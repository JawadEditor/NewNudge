// ============================================
// EMAILJS SERVICE - Environment Variable Version
// ============================================
//
// SETUP:
// 1. Create a .env file in your project root (if not exists)
// 2. Add these lines (replace with your actual values):
// VITE_EMAILJS_SERVICE_ID=service_34a9ewu
// VITE_EMAILJS_TEMPLATE_ID=template_w6ordve
// VITE_EMAILJS_PUBLIC_KEY=3wTfWzbCv-hOAUNny
//
// 3. Add .env to .gitignore (so it doesn't get pushed to GitHub)
// 4. Restart your dev server after adding .env

import emailjs from '@emailjs/browser'

// Use environment variables (Vite requires VITE_ prefix)
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''

/**
 * Send invitation email via EmailJS
 * @param {Object} params - Email parameters
 * @param {string} params.to_email - Recipient email (REQUIRED)
 * @param {string} params.to_name - Recipient name (optional)
 * @param {string} params.project_name - Project name (REQUIRED)
 * @param {string} params.role - Role (optional, defaults to 'Member')
 * @param {string} params.invite_link - The invitation URL (REQUIRED)
 * @param {string} params.sender_name - Sender's name (optional)
 */
export const sendInvitationEmail = async ({
  to_email,
  to_name = '',
  project_name,
  role = 'Member',  // ← Default value if not provided
  invite_link,
  sender_name = 'Nudge Team'
}) => {
  try {
    // Validate required fields (role is now optional)
    if (!to_email || !project_name || !invite_link) {
      throw new Error('Missing required fields: to_email, project_name, or invite_link')
    }

    // Check if credentials are configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS credentials not configured!')
      console.warn('Please add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY to your .env file')
      return {
        success: false,
        error: 'EmailJS not configured',
        message: 'Please configure EmailJS credentials in your .env file'
      }
    }

    const templateParams = {
      to_email: to_email,
      to_name: to_name || to_email.split('@')[0],
      sender_name: sender_name,
      project_name: project_name,
      role: role || 'Member',  // ← Ensure role always has a value
      invite_link: invite_link,
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
    console.error('=== EMAILJS ERROR ===')
    console.error('Status:', error.status)
    console.error('Text:', error.text)
    console.error('Full error:', error)
    console.error('====================')

    return {
      success: false,
      error: error.text || error.message || 'Failed to send email',
      status: error.status
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
  return !!EMAILJS_SERVICE_ID && !!EMAILJS_TEMPLATE_ID && !!EMAILJS_PUBLIC_KEY
}

export default {
  sendInvitationEmail,
  sendBulkInvitations,
  isEmailJSConfigured
}
