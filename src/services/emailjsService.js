// ============================================
// EMAILJS SERVICE - Send invitation emails
// ============================================
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://www.emailjs.com/ and sign up (free tier: 200 emails/month)
// 2. Create an Email Service (Gmail, Outlook, etc.)
// 3. Create an Email Template with these variables:
//    - {{to_email}} - recipient email
//    - {{to_name}} - recipient name (optional)
//    - {{project_name}} - project name
//    - {{role}} - invited role
//    - {{invite_link}} - the invitation link
//    - {{sender_name}} - your name
//
// 4. Replace the placeholders below with your actual credentials:
//    - Service ID (from Email Services page)
//    - Template ID (from Email Templates page)
//    - Public Key (from Account > General page)

import emailjs from '@emailjs/browser'

// ============================================
// YOUR EMAILJS CREDENTIALS - UPDATE THESE!
// ============================================

// Your EmailJS Service ID
const EMAILJS_SERVICE_ID = 'service_34a9ewu'

// Your EmailJS Template ID
const EMAILJS_TEMPLATE_ID = 'template_w6ordve'

// Find your Public Key:
// EmailJS Dashboard → Account → General → Public Key
const EMAILJS_PUBLIC_KEY = '3wTfWzbCv-hOAUNny'    // ✅ Your Public Key

// ⚠️ IMPORTANT: NEVER put your Private Key in frontend code!
// Private Key is only for server-side use (Edge Functions, backend APIs)

/**
 * Send invitation email via EmailJS
 * @param {Object} params - Email parameters
 * @param {string} params.to_email - Recipient email
 * @param {string} params.to_name - Recipient name
 * @param {string} params.project_name - Project name
 * @param {string} params.role - Role (Admin, Developer, etc.)
 * @param {string} params.invite_link - The invitation URL
 * @param {string} params.sender_name - Sender's name
 */
export const sendInvitationEmail = async ({
  to_email,
  to_name = '',
  project_name,
  role,
  invite_link,
  sender_name = 'Nudge Team'
}) => {
  try {
    // Validate required fields
    if (!to_email || !project_name || !role || !invite_link) {
      throw new Error('Missing required fields: to_email, project_name, role, or invite_link')
    }

    // Check if credentials are set
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' || EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
      console.warn('EmailJS Service ID or Template ID not configured!')
      console.warn('Please update src/services/emailjsService.js with your credentials.')
      return { 
        success: false, 
        error: 'EmailJS not fully configured',
        message: 'Please set your Service ID and Template ID in src/services/emailjsService.js'
      }
    }

    const templateParams = {
      to_email: to_email,
      to_name: to_name || to_email.split('@')[0],
      project_name: project_name,
      role: role,
      invite_link: invite_link,
      sender_name: sender_name,
      reply_to: 'noreply@nudge.app'
    }

    console.log('Sending email via EmailJS:', templateParams)

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    )

    console.log('Email sent successfully:', result)
    return { 
      success: true, 
      data: result,
      message: `Invitation email sent to ${to_email}`
    }

  } catch (error) {
    console.error('EmailJS error:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to send email',
      message: `Failed to send email to ${to_email}: ${error.message}`
    }
  }
}

/**
 * Send multiple invitation emails
 * @param {Array} invitations - Array of invitation objects
 */
export const sendBulkInvitations = async (invitations) => {
  const results = []

  for (const invite of invitations) {
    const result = await sendInvitationEmail(invite)
    results.push(result)
  }

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    success: failed === 0,
    total: invitations.length,
    sent: successful,
    failed: failed,
    results: results
  }
}

/**
 * Check if EmailJS is fully configured
 */
export const isEmailJSConfigured = () => {
  return EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' && 
         EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
}

export default {
  sendInvitationEmail,
  sendBulkInvitations,
  isEmailJSConfigured
}