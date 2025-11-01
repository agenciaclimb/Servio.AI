/* eslint-disable @typescript-eslint/no-var-requires */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { VertexAI } = require('@google-cloud/vertexai');
const sgMail = require('@sendgrid/mail');

try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  console.error("Firebase admin initialization error", e);
}

const db = admin.firestore();

// Inicializa serviços com chaves de API armazenadas na configuração do Firebase
if (functions.config().sendgrid && functions.config().sendgrid.key) {
  sgMail.setApiKey(functions.config().sendgrid.key);
}
// Inicializa o Vertex AI. A autenticação é automática no ambiente do Google Cloud.
const vertex_ai = new VertexAI({
  project: process.env.GCP_PROJECT || 'gen-lang-client-0737507616', 
  location: 'us-central1' 
});

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

/**
 * Triggered on the creation of a new staff user.
 * Sends a welcome email with a link to set their initial password.
 */
exports.sendWelcomeEmailToStaff = functions
  .region("us-west1")
  .firestore.document("users/{userId}")
  .onCreate(async (snap) => {
    const newUser = snap.data();

    // 1. Only run for new users of type 'staff'
    if (newUser.type !== 'staff') {
      return null;
    }

    console.log(`New staff member detected: ${newUser.email}. Sending welcome email.`);

    try {
      // 2. Generate a password reset link (which acts as a "set your password" link)
      const passwordResetLink = await admin.auth().generatePasswordResetLink(newUser.email);

      // 3. Compose the email message
      const subject = "Bem-vindo(a) à Equipe SERVIO.AI!";
      const body = `
        <p>Olá, ${newUser.name},</p>
        <p>Seja bem-vindo(a) à equipe da SERVIO.AI! Sua conta foi criada com a função de <strong>${newUser.role}</strong>.</p>
        <p>Para começar, por favor, configure sua senha de acesso clicando no link abaixo:</p>
        <p><a href="${passwordResetLink}">Criar minha senha</a></p>
        <p>Este link é válido por 24 horas.</p>
        <p>Atenciosamente,<br>Equipe SERVIO.AI</p>
      `;

      // 4. Send the email using SendGrid
      const msg = {
        to: newUser.email,
        from: 'no-reply@servio.ai', // Use um e-mail verificado no SendGrid
        subject: subject,
        html: body,
      };

      await sgMail.send(msg);
      console.log(`Welcome email sent successfully to ${newUser.email}.`);
    } catch (error) {
      console.error(`Error sending welcome email to ${newUser.email}:`, error);
    }

    return null;
  });

/**
 * Runs daily to generate marketing action proposals.
 * The AI analyzes platform data and suggests content to be created.
 */
exports.runMarketingAI = functions
  .region("us-west1")
  .pubsub.schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Running daily marketing AI...");

    try {
      // 1. Fetch recent data for analysis (e.g., last 7 days of jobs)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const jobsSnapshot = await db.collection("jobs").where("createdAt", ">=", sevenDaysAgo.toISOString()).get();
      const recentJobs = jobsSnapshot.docs.map(doc => doc.data());

      // 2. Call the AI to get a marketing plan
      const planResponse = await fetch(`${AI_API_URL}/api/generate-marketing-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Auth needed in production
        body: JSON.stringify({ recentJobs }),
      });

      if (!planResponse.ok) {
        throw new Error(`AI marketing plan generation failed with status: ${planResponse.status}`);
      }

      const marketingPlan = await planResponse.json();

      // 3. Save each proposed action to the 'marketing_proposals' collection for approval
      const batch = db.batch();
      for (const proposal of marketingPlan.proposals) {
        const proposalRef = db.collection("marketing_proposals").doc();
        batch.set(proposalRef, {
          ...proposal,
          status: 'pendente', // 'pendente', 'aprovado', 'rejeitado'
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();

      console.log(`Marketing AI finished. ${marketingPlan.proposals.length} new actions proposed.`);

    } catch (error) {
      console.error("Error in runMarketingAI:", error);
    }

    return null;
  });

/**
 * Triggered when a marketing proposal is updated.
 * If a blog post proposal is approved, it generates the full post and saves it.
 */
exports.executeApprovedMarketingAction = functions
  .region("us-west1")
  .firestore.document("marketing_proposals/{proposalId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    // 1. Check if the proposal was just approved
    if (before.status !== 'pendente' || after.status !== 'aprovado') {
      return null;
    }

    // 2. Check if it's a blog post proposal
    if (after.type !== 'blog_post') {
      console.log(`Proposal ${change.after.id} is not a blog post. Skipping.`);
      return null;
    }

    console.log(`Blog post proposal ${change.after.id} approved. Generating full content...`);

    try {
      // 3. Call the AI to generate the full blog post content
      const postResponse = await fetch(`${AI_API_URL}/api/generate-full-blog-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Auth needed in production
        body: JSON.stringify({ topic: after.details.topic }),
      });

      if (!postResponse.ok) {
        throw new Error(`AI blog post generation failed with status: ${postResponse.status}`);
      }

      const postContent = await postResponse.json();

      // 4. Generate the featured image using Imagen 2 on Vertex AI
      const generativeModel = vertex_ai.getGenerativeModel({
        model: 'imagen-2',
      });

      const imageResponse = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: postContent.featuredImage.prompt }] }],
        generation_config: {
          "outputImageCount": 1,
          "quality": "standard" // 'standard' é mais rápido e barato que 'hd'
        }
      });

      // A resposta do Imagen vem em base64
      const imageBase64 = imageResponse.response.candidates[0].content.parts[0].fileData.data;
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // 5. Upload the image to our Google Cloud Storage bucket
      const bucketName = process.env.GCP_STORAGE_BUCKET || 'servioai.appspot.com';
      const bucket = admin.storage().bucket(bucketName);
      const filePath = `blog_images/${postContent.slug}.png`;
      const file = bucket.file(filePath);

      await file.save(imageBuffer, {
        metadata: { contentType: 'image/png' },
        public: true, // Make the file publicly accessible
      });
      const publicImageUrl = file.publicUrl();

      // 6. Save the complete blog post with the permanent image URL
      // The document ID will be the URL-friendly slug
      await db.collection("blog_posts").doc(postContent.slug).set({
        ...postContent,
        featuredImageUrl: publicImageUrl, // Save the final image URL
        createdAt: new Date().toISOString(),
        status: 'publicado',
      });

      console.log(`Blog post "${postContent.title}" published successfully.`);
    } catch (error) {
      console.error(`Error executing marketing action for proposal ${change.after.id}:`, error);
    }

    return null;
  });

/**
 * Triggered on the creation of a new notification document.
 * Sends an email to the user with the notification content.
 */
exports.sendEmailNotification = functions
  .region("us-west1")
  .firestore.document("notifications/{notificationId}")
  .onCreate(async (snap) => {
    const notification = snap.data();

    if (!notification || !notification.userId) {
      console.log("Notification data is invalid, skipping email.");
      return null;
    }

    try {
      // 1. Fetch the user's profile to get their email and name
      const userDoc = await db.collection("users").doc(notification.userId).get();
      if (!userDoc.exists) {
        console.error(`User ${notification.userId} not found. Cannot send email.`);
        return null;
      }
      const user = userDoc.data();

      // 2. Compose the email message
      const msg = {
        to: user.email,
        from: 'notificacoes@servio.ai', // Use um e-mail verificado no SendGrid
        subject: `🔔 Nova notificação: ${notification.text.substring(0, 30)}...`,
        html: `<p>Olá, ${user.name},</p><p>Você tem uma nova notificação na plataforma SERVIO.AI:</p><p><strong>${notification.text}</strong></p><p>Acesse seu painel para ver mais detalhes.</p>`,
      };

      // 3. Send the email using SendGrid
      await sgMail.send(msg);
      console.log(`Email notification sent successfully to ${user.email}.`);

    } catch (error) {
      console.error(`Error sending email notification to ${notification.userId}:`, error);
    }

    return null;
  });
 