/* eslint-disable @typescript-eslint/no-var-requires */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const sgMail = require('@sendgrid/mail');

try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  console.error("Firebase admin initialization error", e);
}

const db = admin.firestore();

// Inicializa o SendGrid com a chave de API armazenada na configuração do Firebase
sgMail.setApiKey(functions.config().sendgrid.key);

// URL do seu serviço de IA (substitua pelo URL do Cloud Run em produção)
const AI_API_URL = process.env.AI_API_URL || "http://localhost:8080"; 
// URL do seu backend (substitua pelo URL do Cloud Run em produção)
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8081";

/**
 * Triggered on the creation of a new proposal.
 * Fetches the related job and client to create a notification for the client.
 */
exports.notifyClientOnNewProposal = functions
  .region("us-west1")
  .firestore.document("proposals/{proposalId}")
  .onCreate(async (snap) => {
    const newProposal = snap.data();
    try {
      const jobDoc = await db.collection("jobs").doc(newProposal.jobId).get();
      if (!jobDoc.exists) {
        console.error(`Job with ID ${newProposal.jobId} not found.`);
        return null;
      }
      const jobData = jobDoc.data();
      const notificationRef = db.collection("notifications").doc();
      await notificationRef.set({
        id: notificationRef.id,
        userId: jobData.clientId,
        text: `Você recebeu uma nova proposta para o job "${jobData.category}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
        relatedJobId: newProposal.jobId,
      });
      console.log(`Notification created for user ${jobData.clientId} for job ${newProposal.jobId}`);
    } catch (error) {
      console.error("Error in notifyClientOnNewProposal:", error);
    }
    return null;
  });

/**
 * Periodically analyzes active chats for negative sentiment.
 * Runs every 15 minutes.
 */
exports.analyzeChatSentimentPeriodically = functions
  .region("us-west1")
  .pubsub.schedule("every 15 minutes")
  .onRun(async (context) => {
    console.log("Running periodic chat sentiment analysis...");

    // 1. Find active jobs (e.g., status 'em_progresso' or 'a_caminho')
    const activeJobsSnapshot = await db.collection("jobs")
      .where("status", "in", ["em_progresso", "a_caminho"])
      .get();

    if (activeJobsSnapshot.empty) {
      console.log("No active jobs found to analyze.");
      return null;
    }

    // 2. For each active job, get chat messages and analyze sentiment
    for (const jobDoc of activeJobsSnapshot.docs) {
      const job = jobDoc.data();
      const jobId = jobDoc.id;

      const messagesSnapshot = await db.collection("messages")
        .where("chatId", "==", jobId)
        .orderBy("createdAt", "asc")
        .get();

      if (messagesSnapshot.docs.length < 4) { // Don't analyze very short chats
        continue;
      }

      const messages = messagesSnapshot.docs.map(doc => doc.data());

      try {
        // 3. Call the AI service to analyze sentiment
        const response = await fetch(`${AI_API_URL}/api/analyze-sentiment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
          console.error(`AI API call failed for job ${jobId} with status: ${response.status}`);
          continue;
        }

        const sentimentResult = await response.json();

        // 4. If sentiment is alertable, create an alert in the backend
        if (sentimentResult && sentimentResult.isAlertable) {
          console.log(`Alertable sentiment detected for job ${jobId}. Creating alert.`);
          await fetch(`${BACKEND_API_URL}/sentiment-alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...sentimentResult, jobId }),
          });
        }
      } catch (error) {
        console.error(`Error analyzing sentiment for job ${jobId}:`, error);
      }
    }

    console.log("Periodic chat sentiment analysis finished.");
    return null;
  });

/**
 * Triggered on the creation of a new prospect.
 * Generates and sends an invitation email via AI and updates the prospect's status.
 */
exports.sendProspectInvitationEmail = functions
  .region("us-west1")
  .firestore.document("prospects/{prospectId}")
  .onCreate(async (snap) => {
    const prospect = snap.data();
    const prospectId = snap.id;

    console.log(`New prospect found: ${prospect.name}. Generating invitation.`);

    try {
      // 1. Fetch the related job to get context for the email
      const jobDoc = await db.collection("jobs").doc(prospect.relatedJobId).get();
      if (!jobDoc.exists) {
        console.error(`Job with ID ${prospect.relatedJobId} not found for prospect ${prospectId}.`);
        return null;
      }
      const job = jobDoc.data();

      // 2. Call the AI service to generate the email content
      const emailResponse = await fetch(`${AI_API_URL}/api/generate-prospect-invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Auth header would be needed in production
        body: JSON.stringify({ prospect, job }),
      });

      if (!emailResponse.ok) {
        throw new Error(`AI email generation failed with status: ${emailResponse.status}`);
      }

      const emailContent = await emailResponse.json();

      // 1. Construir a URL de cadastro dinâmica
      const frontendUrl = functions.config().app.frontend_url || 'http://localhost:5173';
      const registrationUrl = `${frontendUrl}/register?source=prospect_invitation&jobId=${prospect.relatedJobId}&prospectId=${prospectId}`;

      // 2. Substituir o placeholder no corpo do e-mail
      const finalBody = emailContent.body.replace('[LINK_DE_CADASTRO]', registrationUrl);

      // Pega o ID do grupo de descadastro da configuração do Firebase
      const unsubscribeGroupId = functions.config().sendgrid.prospect_unsubscribe_group_id;

      // 3. Send the email using SendGrid
      const msg = {
        to: prospect.email || 'email.do.prospect@example.com', // O e-mail do profissional prospectado
        from: 'contato@servio.ai', // SEU E-MAIL VERIFICADO NO SENDGRID
        subject: emailContent.subject,
        // Usa o corpo do e-mail com a URL real
        html: finalBody.replace(/\n/g, '<br>'), // Converte quebras de linha para HTML
        // Anexa o e-mail a um grupo de descadastro específico
        asm: {
          groupId: parseInt(unsubscribeGroupId, 10),
        },
      };

      await sgMail.send(msg);
      console.log(`Email successfully sent to ${prospect.name} at ${msg.to}`);

      // 4. Update the prospect's status to 'convidado'
      await db.collection("prospects").doc(prospectId).update({
        status: 'convidado',
        lastContactedAt: new Date().toISOString(),
      });

      console.log(`Successfully sent invitation to ${prospect.name} and updated status.`);
    } catch (error) {
      console.error(`Error in sendProspectInvitationEmail for prospect ${prospectId}:`, error);
    }
    return null;
  });