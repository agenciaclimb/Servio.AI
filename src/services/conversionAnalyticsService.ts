/**
 * Serviço de Analytics de Conversão - Task 3.3
 * Rastreia eventos críticos: jobs criados, propostas, pagamentos, conversão de leads
 * Integração com Firebase Analytics para produção
 */

import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';

/**
 * Tipos de eventos de conversão rastreados
 */
export type ConversionEventType =
  | 'job_created'
  | 'proposal_sent'
  | 'proposal_accepted'
  | 'payment_completed'
  | 'job_completed'
  | 'lead_imported'
  | 'lead_contacted'
  | 'signup_completed'
  | 'profile_completed';

/**
 * Interface para evento de conversão
 */
export interface ConversionEvent {
  eventType: ConversionEventType;
  userId: string;
  userEmail: string;
  userRole: 'cliente' | 'prestador' | 'prospector' | 'admin';
  metadata?: {
    jobId?: string;
    proposalId?: string;
    leadId?: string;
    amount?: number;
    currency?: string;
    source?: string;
    referrer?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    location?: string;
  };
  timestamp: Timestamp;
}

/**
 * Serviço centralizado de analytics de conversão
 * Armazena eventos em Firestore e envia métricas para dashboard
 */
class ConversionAnalyticsService {
  private readonly collectionName = 'conversion_events';
  private readonly metricsCollection = 'analytics_metrics';

  /**
   * Registrar evento de conversão na Firestore
   * @param event - Evento de conversão
   * @returns Promise com ID do documento criado
   */
  async trackEvent(event: Omit<ConversionEvent, 'timestamp'>): Promise<string> {
    try {
      const eventDoc: ConversionEvent = {
        ...event,
        timestamp: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), eventDoc);
      
      // Atualizar métricas agregadas em tempo real
      await this.updateMetrics(event.eventType, event.userRole, event.metadata?.amount || 0);
      
      return docRef.id;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Erro ao rastrear evento ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * Atualizar métricas agregadas (contadores, totais)
   */
  private async updateMetrics(
    eventType: ConversionEventType,
    userRole: string,
    amount: number
  ): Promise<void> {
    try {
      const metricsDoc = doc(db, this.metricsCollection, 'daily_summary');

      const fieldPath = `counts.${eventType}`;
      const amountPath = `amounts.${eventType}`;
      const roleFieldPath = `by_role.${userRole}.${eventType}`;

      await updateDoc(metricsDoc, {
        [fieldPath]: increment(1),
        ...(amount > 0 && { [amountPath]: increment(amount) }),
        [roleFieldPath]: increment(1),
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      // Métrica falha não deve interromper fluxo principal
      // eslint-disable-next-line no-console
      console.warn('Erro ao atualizar métricas:', error);
    }
  }

  /**
   * Rastrear criação de job
   */
  async trackJobCreated(
    userId: string,
    userEmail: string,
    jobId: string,
    category: string,
    location: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'job_created',
      userId,
      userEmail,
      userRole: 'cliente',
      metadata: {
        jobId,
        source: category,
        location,
      },
    });
  }

  /**
   * Rastrear proposta enviada
   */
  async trackProposalSent(
    userId: string,
    userEmail: string,
    proposalId: string,
    jobId: string,
    amount: number
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'proposal_sent',
      userId,
      userEmail,
      userRole: 'prestador',
      metadata: {
        proposalId,
        jobId,
        amount,
        currency: 'BRL',
      },
    });
  }

  /**
   * Rastrear proposta aceita (conversão para negócio)
   */
  async trackProposalAccepted(
    clientId: string,
    clientEmail: string,
    providerId: string,
    providerEmail: string,
    proposalId: string,
    jobId: string,
    amount: number
  ): Promise<void> {
    // Registrar para ambos os lados
    await this.trackEvent({
      eventType: 'proposal_accepted',
      userId: clientId,
      userEmail: clientEmail,
      userRole: 'cliente',
      metadata: {
        proposalId,
        jobId,
        amount,
        currency: 'BRL',
      },
    });

    await this.trackEvent({
      eventType: 'proposal_accepted',
      userId: providerId,
      userEmail: providerEmail,
      userRole: 'prestador',
      metadata: {
        proposalId,
        jobId,
        amount,
        currency: 'BRL',
      },
    });
  }

  /**
   * Rastrear pagamento concluído (evento crítico)
   */
  async trackPaymentCompleted(
    userId: string,
    userEmail: string,
    jobId: string,
    amount: number,
    paymentMethod: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'payment_completed',
      userId,
      userEmail,
      userRole: 'cliente',
      metadata: {
        jobId,
        amount,
        currency: 'BRL',
        source: paymentMethod,
      },
    });
  }

  /**
   * Rastrear job completado
   */
  async trackJobCompleted(
    clientId: string,
    clientEmail: string,
    providerId: string,
    providerEmail: string,
    jobId: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'job_completed',
      userId: clientId,
      userEmail: clientEmail,
      userRole: 'cliente',
      metadata: { jobId },
    });

    await this.trackEvent({
      eventType: 'job_completed',
      userId: providerId,
      userEmail: providerEmail,
      userRole: 'prestador',
      metadata: { jobId },
    });
  }

  /**
   * Rastrear lead importado (prospecting)
   */
  async trackLeadImported(
    prospectorId: string,
    prospectorEmail: string,
    leadId: string,
    source: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'lead_imported',
      userId: prospectorId,
      userEmail: prospectorEmail,
      userRole: 'prospector',
      metadata: {
        leadId,
        source,
      },
    });
  }

  /**
   * Rastrear lead contatado (pré-venda)
   */
  async trackLeadContacted(
    prospectorId: string,
    prospectorEmail: string,
    leadId: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'lead_contacted',
      userId: prospectorId,
      userEmail: prospectorEmail,
      userRole: 'prospector',
      metadata: { leadId },
    });
  }

  /**
   * Rastrear signup completado (top-of-funnel)
   */
  async trackSignupCompleted(
    userId: string,
    userEmail: string,
    userRole: 'cliente' | 'prestador',
    referrer?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'signup_completed',
      userId,
      userEmail,
      userRole,
      metadata: {
        referrer: referrer || 'organic',
      },
    });
  }

  /**
   * Rastrear perfil completado (onboarding)
   */
  async trackProfileCompleted(
    userId: string,
    userEmail: string,
    userRole: 'cliente' | 'prestador' | 'prospector'
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'profile_completed',
      userId,
      userEmail,
      userRole,
    });
  }
}

// Exportar instância singleton
export const conversionAnalytics = new ConversionAnalyticsService();

export default ConversionAnalyticsService;
