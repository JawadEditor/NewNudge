// ============================================
// EMAILJS SERVICE - Fixed for EmailJS template
// ============================================

import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''

export const sendInvitationEmail = async ({
  to_email,
  to_name = '',
  project_name,
  role,
  invite_link,
  sender_name = 'Nudge Team'
}) => {
  try {
    if (!to_email || !project_name || !role || !invite_link) {
      throw new Error('Missing required fields')
    }

    // EmailJS template variables - must match EXACTLY what's in your EmailJS template
    // Common variable names: to_email, to_name, from_name, message, reply_to, etc.
    const templateParams = {
      to_email: to_email,           // Must match {{to_email}} in template
      to_name: to_name || to_email.split('@')[0],  // Must match {{to_name}} in template
      from_name: sender_name,      // EmailJS might expect this instead of sender_name
      project_name: project_name,
      role: role,
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
    return { success: true, data: result }

  } catch (error) {
    console.error('=== EMAILJS ERROR ===')
    console.error('Status:', error.status)
    console.error('Text:', error.text)
    console.error('====================')

    return { 
      success: false, 
      error: error.text || error.message || 'Failed to send email',
      status: error.status
    }
  }
}

export const isEmailJSConfigured = () => {
  return EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' && 
         EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
}

export default { sendInvitationEmail, isEmailJSConfigured }
