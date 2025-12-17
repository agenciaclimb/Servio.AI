/**
 * Twilio Notification Routes
 * Express endpoints for sending notifications via Twilio
 * Task 4.2 - Integração Twilio SMS/Voice Notifications
 */

import { Router, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import TwilioService from '../services/twilioService';

const router = Router();

/**
 * POST /api/twilio/send-sms
 * Send SMS notification
 */
router.post('/send-sms', async (req: Request, res: Response) => {
  try {
    const { userId, phoneNumber, templateKey, variables, channel } = req.body;

    // Validate required fields
    if (!userId || !phoneNumber || !templateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, phoneNumber, templateKey',
      });
    }

    const result = await TwilioService.sendSMS({
      userId,
      phoneNumber,
      templateKey,
      variables: variables || {},
      channel: channel || 'sms',
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error in /send-sms', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/twilio/send-voice
 * Send voice call notification
 */
router.post('/send-voice', async (req: Request, res: Response) => {
  try {
    const { userId, phoneNumber, templateKey, variables, channel } = req.body;

    // Validate required fields
    if (!userId || !phoneNumber || !templateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, phoneNumber, templateKey',
      });
    }

    const result = await TwilioService.sendVoiceCall({
      userId,
      phoneNumber,
      templateKey,
      variables: variables || {},
      channel: channel || 'voice',
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error in /send-voice', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/twilio/send-notification
 * Send notification (SMS or Voice or both)
 */
router.post('/send-notification', async (req: Request, res: Response) => {
  try {
    const { userId, phoneNumber, templateKey, variables, channel } = req.body;

    // Validate required fields
    if (!userId || !phoneNumber || !templateKey || !channel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, phoneNumber, templateKey, channel',
      });
    }

    const result = await TwilioService.sendNotification({
      userId,
      phoneNumber,
      templateKey,
      variables: variables || {},
      channel,
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    logger.error('Error in /send-notification', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/twilio/communication-preferences/:userId
 * Get user communication preferences
 */
router.get('/communication-preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const preferences = await TwilioService.getUserCommunicationPreference(userId);

    return res.status(preferences ? 200 : 404).json({
      success: !!preferences,
      data: preferences,
    });
  } catch (error: any) {
    logger.error('Error in /communication-preferences', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * PUT /api/twilio/communication-preferences/:userId
 * Update user communication preferences
 */
router.put('/communication-preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { smsEnabled, voiceEnabled, emailEnabled, preferredLanguage } = req.body;

    const success = await TwilioService.updateUserCommunicationPreference(userId, {
      userId,
      smsEnabled: smsEnabled !== undefined ? smsEnabled : true,
      voiceEnabled: voiceEnabled !== undefined ? voiceEnabled : true,
      emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
      preferredLanguage: preferredLanguage || 'pt-BR',
    });

    return res.status(success ? 200 : 400).json({
      success,
      message: success ? 'Preferences updated' : 'Failed to update preferences',
    });
  } catch (error: any) {
    logger.error('Error in PUT /communication-preferences', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/twilio/templates
 * Get all notification templates
 */
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = TwilioService.getTemplates();
    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Error in /templates', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/twilio/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'twilio-notifications',
    timestamp: new Date(),
  });
});

export default router;
