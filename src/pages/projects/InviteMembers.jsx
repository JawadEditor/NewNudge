import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase.js'
import { sendInvitationEmail, isEmailJSConfigured } from '../../services/emailjsService.js'
import NotificationDropdown from "../../components/NotificationDropdown"

const InviteMembers = ({ project, onBack, onLogout }) => {
  const [emails, setEmails] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [invitations, setInvitations] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [copiedLink, setCopiedLink] = useState('')
  const [emailResults, setEmailResults] = useState([])
  const [showLinks, setShowLinks] = useState(false)

  const roles = [
    { 
      id: 'Admin', 
      label: 'Admin', 
      description: 'Full access to project settings, members and tickets.',
      icon: '👑',
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      id: 'Developer', 
      label: 'Developer', 
      description: 'Manage tickets and project activities.',
      icon: '⚙️',
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      id: 'Designer', 
      label: 'Designer', 
      description: 'View and manage assigned tickets.',
      icon: '👤',
      color: 'bg-teal-100 text-teal-600'
    },
    { 
      id: 'QA', 
      label: 'QA Engineer', 
      description: 'View project and tickets (read-only).',
      icon: '👁️',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ]

  useEffect(() => {
    fetchProjects()
    fetchInvitations()
  }, [])

  useEffect(() => {
    if (project?.id) {
      setSelectedProject(project.id)
    }
  }, [project])

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('created_by', user.id)

      if (error) throw error
      setProjects(data || [])
      if (data && data.length > 0 && !selectedProject && !project?.id) {
        setSelectedProject(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          project:project_id (name)
        `)
        .eq('invited_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (err) {
      console.error('Error fetching invitations:', err)
    }
  }

  const currentProject = project || projects.find(p => p.id === selectedProject) || {
    name: 'Nudge Platform',
    status: 'Active',
    icon: '📦'
  }

  const getInviteLink = (token) => {
    return `${window.location.origin}/accept-invite?token=${token}`
  }

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(link)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setCopiedLink('')
    }, 2000)
  }

  const handleSendInvites = async () => {
    if (!emails.trim() || !selectedRole || !selectedProject) {
      setError('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')
    setEmailResults([])

    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        return
      }

      // Get project name
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', selectedProject)
        .single()

      const projectName = projectData?.name || 'Project'

      // Get sender name
      const { data: userData } = await supabase.auth.getUser()
      const senderName = userData?.user?.user_metadata?.full_name || 'Nudge Team'

      // Generate unique tokens for each invitation
      const invitationsData = emailList.map(email => ({
        project_id: selectedProject,
        email: email.toLowerCase(),
        role: selectedRole,
        invited_by: user.id,
        token: crypto.randomUUID(),
        status: 'pending'
      }))

      // Save invitations to database
      const { data: savedInvites, error: dbError } = await supabase
        .from('invitations')
        .insert(invitationsData)
        .select()

      if (dbError) throw dbError

      // Send emails via EmailJS
      const emailSendResults = []
      const linksForDisplay = []

      for (const invite of savedInvites) {
        const inviteLink = getInviteLink(invite.token)

        linksForDisplay.push({
          email: invite.email,
          link: inviteLink,
          token: invite.token
        })

        // Try to send email via EmailJS
        const emailResult = await sendInvitationEmail({
          to_email: invite.email,
          to_name: invite.email.split('@')[0],
          project_name: projectName,
          role: invite.role,
          invite_link: inviteLink,
          sender_name: senderName
        })

        emailSendResults.push({
          email: invite.email,
          ...emailResult
        })
      }

      setEmailResults(emailSendResults)
      setShowLinks(true)

      const successfulEmails = emailSendResults.filter(r => r.success).length
      const failedEmails = emailSendResults.filter(r => !r.success)

      if (successfulEmails > 0) {
        setSuccess(`✅ ${successfulEmails} invitation email(s) sent successfully!`)
      } else if (!isEmailJSConfigured()) {
        setSuccess(`✅ Invitations created! EmailJS not configured - copy links below to share manually.`)
      } else {
        setError('Failed to send emails. Invitations saved but emails not delivered.')
      }

      if (failedEmails.length > 0) {
        console.warn('Failed emails:', failedEmails)
      }

      setEmails('')
      setSelectedRole('')
      fetchInvitations()
    } catch (err) {
      console.error('Error sending invitations:', err)
      setError(err.message || 'Failed to send invitations. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelInvite = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId)

      if (error) throw error
      fetchInvitations()
    } catch (err) {
      console.error('Error canceling invitation:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'accepted': return 'bg-green-100 text-green-700'
      case 'expired': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="relative hidden md:block">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search projects, tickets..." 
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-80 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
        </div>
      </header>

      <div>
        <main className="p-6">

          {/* Back Button */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Members
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl">
              {currentProject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Invite Members</h1>
              <p className="text-gray-500">Add new members to {currentProject.name} and give them access to this project.</p>
            </div>
          </div>

          {/* Project Selector */}
          {!project?.id && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full max-w-md px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project Badge */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="font-medium text-gray-900">{currentProject.name}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentProject.status)}`}>
              ● {currentProject.status || 'Active'}
            </span>
          </div>

          {/* EmailJS Config Warning */}
          {!isEmailJSConfigured() && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
              <p className="font-medium">⚠️ EmailJS Not Configured</p>
              <p className="mt-1">Invitation links will be generated but emails won't be sent automatically. You'll need to copy and share the links manually.</p>
              <p className="mt-2 text-xs">To enable email sending, update your credentials in <code>src/services/emailjsService.js</code></p>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Email Results */}
          {emailResults.length > 0 && (
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Email Delivery Status</h3>
              <div className="space-y-2">
                {emailResults.map((result, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-medium">{result.email}</span>
                    <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✓ Sent' : `✗ ${result.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitation Links (shown after creation) */}
          {showLinks && emailResults.some(r => !r.success) && (
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Copy & Share These Links</h3>
              <p className="text-sm text-gray-500 mb-4">Share these links with your team members:</p>
              <div className="space-y-3">
                {emailResults.filter(r => !r.success).map((result, idx) => {
                  const invite = invitations.find(i => i.email === result.email && i.status === 'pending')
                  const link = invite ? getInviteLink(invite.token) : ''
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700 min-w-[180px]">{result.email}</span>
                      <input 
                        type="text" 
                        value={link} 
                        readOnly 
                        className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
                      >
                        {copiedLink === link ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* Left Column - Invite Form */}
            <div className="flex-1">

              {/* Invite by Email */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Invite by Email</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {isEmailJSConfigured() 
                    ? 'Enter email addresses to send invitation emails automatically.' 
                    : 'Enter email addresses to generate invitation links.'}
                </p>

                <div className="relative mb-2">
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="text"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="Enter email addresses"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mb-6">You can add multiple emails separated by commas.</p>

                {/* Role Selection */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Role</h4>
                  <div className="relative">
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                    <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Choose the role for the new members.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onBack}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvites}
                  disabled={!emails.trim() || !selectedRole || !selectedProject || isSubmitting}
                  className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                    emails.trim() && selectedRole && selectedProject && !isSubmitting
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {isSubmitting ? 'Sending...' : isEmailJSConfigured() ? 'Send Invites' : 'Generate Links'}
                </button>
              </div>

              {/* Sent Invitations List */}
              {invitations.length > 0 && (
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Sent Invitations</h3>
                  <div className="space-y-3">
                    {invitations.map(invite => (
                      <div key={invite.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{invite.email}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                              {invite.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Project: {invite.project?.name || 'Project'} • Role: {invite.role} • 
                            Sent: {new Date(invite.created_at).toLocaleDateString()}
                          </p>
                          {invite.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={getInviteLink(invite.token)} 
                                readOnly 
                                className="flex-1 text-xs bg-white px-2 py-1 rounded border border-gray-200"
                              />
                              <button
                                onClick={() => handleCopyLink(getInviteLink(invite.token))}
                                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                              >
                                {copiedLink === getInviteLink(invite.token) ? 'Copied!' : 'Copy Link'}
                              </button>
                            </div>
                          )}
                        </div>
                        {invite.status === 'pending' && (
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-2"
                            title="Cancel Invitation"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column - Roles & Permissions */}
            <div className="w-80">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Roles & Permissions</h3>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${role.color} flex items-center justify-center text-lg flex-shrink-0`}>
                        {role.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{role.label}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  )
}

export default InviteMembers
