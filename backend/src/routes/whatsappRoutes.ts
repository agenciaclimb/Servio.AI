/**
 * WhatsApp Routes
 * Express endpoints for WhatsApp Business API integration
 * Task 4.5 - Integração WhatsApp
 */

import { Router, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import WhatsAppService from '../services/whatsappService';

const router = Router();

/**
 * POST /api/whatsapp/send-text
 * Send text message
 */
router.post('/send-text', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message',
      });
    }

    const messageId = await WhatsAppService.sendTextMessage(to, message);

    return res.status(201).json({
      success: true,
      messageId,
      message: 'Text message sent successfully',
    });
  } catch (error: any) {
    logger.error('Error in POST /send-text', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/whatsapp/send-template
 * Send template message
 */
router.post('/send-template', async (req: Request, res: Response) => {
  try {
    const { to, templateName, templateLanguage, parameters } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, templateName',
      });
    }

    const messageId = await WhatsAppService.sendTemplateMessage(
      to,
      templateName,
      templateLanguage || 'pt_BR',
      parameters || []
    );

    return res.status(201).json({
      success: true,
      messageId,
      message: 'Template message sent successfully',
    });
  } catch (error: any) {
    logger.error('Error in POST /send-template', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/whatsapp/send-interactive
 * Send interactive message
 */
router.post('/send-interactive', async (req: Request, res: Response) => {
  try {
    const { to, interactive } = req.body;

    if (!to || !interactive) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, interactive',
      });
    }

    const messageId = await WhatsAppService.sendInteractiveMessage(to, interactive);

    return res.status(201).json({
      success: true,
      messageId,
      message: 'Interactive message sent successfully',
    });
  } catch (error: any) {
    logger.error('Error in POST /send-interactive', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Webhook for incoming messages
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Verify webhook token
    const verifyToken = req.query.verify_token as string;
    if (!WhatsAppService.verifyWebhookToken(verifyToken)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid verify token',
      });
    }

    // Process incoming message
    await WhatsAppService.processIncomingMessage(req.body);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error: any) {
    logger.error('Error in POST /webhook', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/whatsapp/webhook
 * Webhook verification challenge
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe' && WhatsAppService.verifyWebhookToken(token)) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({
    success: false,
    error: 'Invalid verification token',
  });
});

/**
 * GET /api/whatsapp/conversation/:conversationId/history
 * Get conversation history
 */
router.get('/conversation/:conversationId/history', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const history = await WhatsAppService.getConversationHistory(conversationId);

    return res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    logger.error('Error in GET /conversation/:conversationId/history', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/whatsapp/conversation/:conversationId/close
 * Close conversation
 */
router.post('/conversation/:conversationId/close', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const success = await WhatsAppService.closeConversation(conversationId);

    return res.status(success ? 200 : 400).json({
      success,
      message: success ? 'Conversation closed' : 'Failed to close conversation',
    });
  } catch (error: any) {
    logger.error('Error in POST /conversation/:conversationId/close', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/whatsapp/conversations/active
 * Get active conversations
 */
router.get('/conversations/active', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const conversations = await WhatsAppService.getActiveConversations(
      limit ? parseInt(limit as string) : 50
    );

    return res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error: any) {
    logger.error('Error in GET /conversations/active', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/whatsapp/conversation/:conversationId/suggestions
 * Get bot suggestions
 */
router.get('/conversation/:conversationId/suggestions', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const suggestions = await WhatsAppService.getBotSuggestions(conversationId);

    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    logger.error('Error in GET /conversation/:conversationId/suggestions', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
