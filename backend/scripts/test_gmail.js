/**
 * Test Gmail Service
 * 
 * Tests email sending functionality with Gmail SMTP.
 * 
 * Setup before running:
 * 1. Add to backend/.env:
 *    GMAIL_USER=your-email@gmail.com
 *    GMAIL_APP_PASSWORD=your-app-password
 * 2. Install: npm install
 * 3. Run: node scripts/test_gmail.js
 */

require('dotenv').config();
const gmailService = require('../src/gmailService');

async function testGmailService() {
  console.log('🧪 Testing Gmail Service...\n');

  // Check environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Missing environment variables!');
    console.error('   Required: GMAIL_USER and GMAIL_APP_PASSWORD');
    console.error('   See doc/GMAIL_API_SETUP.md for setup instructions');
    process.exit(1);
  }

  console.log('✓ Environment variables found');
  console.log(`  GMAIL_USER: ${process.env.GMAIL_USER}`);
  console.log(`  GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD.substring(0, 4)}****\n`);

  // Test 1: Verify SMTP connection
  console.log('Test 1: Verifying SMTP connection...');
  try {
    const isReady = await gmailService.verify();
    if (isReady) {
      console.log('✅ SMTP connection successful\n');
    } else {
      console.error('❌ SMTP connection failed\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ SMTP verification error:', error.message);
    process.exit(1);
  }

  // Test 2: Send simple test email
  console.log('Test 2: Sending simple test email...');
  try {
    await gmailService.sendEmail({
      to: process.env.GMAIL_USER, // Send to yourself
      subject: '🧪 Servio.AI - Test Email',
      text: 'This is a test email from Servio.AI Gmail Service.',
      html: `
        <h2>🧪 Test Email</h2>
        <p>This is a test email from <strong>Servio.AI Gmail Service</strong>.</p>
        <p>If you receive this, the email service is working correctly! ✅</p>
      `,
    });
    console.log('✅ Simple email sent successfully\n');
  } catch (error) {
    console.error('❌ Simple email failed:', error.message);
    process.exit(1);
  }

  // Test 3: Send prospector invite email
  console.log('Test 3: Sending prospector invite email...');
  try {
    await gmailService.sendProspectorInvite(
      'João Silva',
      process.env.GMAIL_USER,
      'https://servio-ai.com/register?ref=TEST123ABC'
    );
    console.log('✅ Prospector invite email sent successfully\n');
  } catch (error) {
    console.error('❌ Prospector invite email failed:', error.message);
    process.exit(1);
  }

  // Test 4: Send follow-up reminder
  console.log('Test 4: Sending follow-up reminder email...');
  try {
    await gmailService.sendFollowUpReminder(
      'Maria Santos',
      process.env.GMAIL_USER,
      'Carlos Ferreira',
      3
    );
    console.log('✅ Follow-up reminder email sent successfully\n');
  } catch (error) {
    console.error('❌ Follow-up reminder email failed:', error.message);
    process.exit(1);
  }

  // Test 5: Send conversion notification
  console.log('Test 5: Sending conversion notification email...');
  try {
    await gmailService.sendConversionNotification(
      'Ana Costa',
      process.env.GMAIL_USER,
      'Pedro Oliveira',
      'Eletricista',
      450.00
    );
    console.log('✅ Conversion notification email sent successfully\n');
  } catch (error) {
    console.error('❌ Conversion notification email failed:', error.message);
    process.exit(1);
  }

  console.log('🎉 All tests passed! Gmail service is ready to use.');
  console.log('\n📧 Check your inbox:', process.env.GMAIL_USER);
  console.log('   You should have received 4 test emails.\n');
}

// Run tests
testGmailService().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
