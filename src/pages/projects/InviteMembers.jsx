import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase.js';
import { sendInvitationEmail, isEmailJSConfigured } from '../../services/emailjsService.js';
import { useNavigate } from 'react-router-dom';

const InviteMembers = ({ project, onBack, onLogout }) => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('member');  // Changed default to 'member' - most common default
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [emailResults, setEmailResults] = useState([]);
  const [showLinks, setShowLinks] = useState(false);
  const [currentProject, setCurrentProject] = useState(project || {});
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(project?.id || '');
  const [dbRoles, setDbRoles] = useState([]); // Store valid roles from DB

  // Default roles - will be overridden if DB has different constraints
  const defaultRoles = [
    { value: 'admin', label: 'Admin', description: 'Full access to all project settings, members, and tickets.', icon: '👑' },
    { value: 'member', label: 'Member', description: 'Standard project member access.', icon: '👤' },
    { value: 'developer', label: 'Developer', description: 'Can create and manage tickets, view project details.', icon: '💻' },
    { value: 'designer', label: 'Designer', description: 'Can view and comment on tickets, upload design assets.', icon: '🎨' },
    { value: 'qa', label: 'QA', description: 'Can create bug reports, test tickets, and add comments.', icon: '🧪' }
  ];

  useEffect(() => {
    if (!project?.id) {
      fetchProjects();
    }
    fetchInvitations();
    fetchValidRoles(); // Check what roles the DB actually accepts
  }, [project]);

  // Fetch valid roles from database check constraint
  const fetchValidRoles = async () => {
    try {
      // Try to get the constraint info by testing inserts
      const testRoles = ['admin', 'member', 'developer', 'viewer', 'owner', 'user'];
      const validRoles = [];

      for (const testRole of testRoles) {
        try {
          // Try a test insert (will rollback)
          const { error } = await supabase
            .from('invitations')
            .insert({
              project_id: selectedProjectId || '00000000-0000-0000-0000-000000000000',
              email: 'test@example.com',
              role: testRole,
              invited_by: '00000000-0000-0000-0000-000000000000',
              status: 'pending',
              token: 'test-token'
            });

          if (!error || !error.message.includes('check constraint')) {
            validRoles.push(testRole);
          }
        } catch (e) {
          // Ignore
        }
      }

      console.log('Valid DB roles detected:', validRoles);
      if (validRoles.length > 0) {
        setDbRoles(validRoles);
      }
    } catch (err) {
      console.log('Could not detect valid roles, using defaults');
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
        setCurrentProject(data[0]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const projectId = project?.id || selectedProjectId;
      if (!projectId) return;

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const getInviteLink = (token) => {
    return `${window.location.origin}/accept-invitation/${token}`;
  };

  const handleSendInvites = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setEmailResults([]);
    setShowLinks(false);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in to send invitations');

      const projectId = project?.id || selectedProjectId;
      if (!projectId) throw new Error('Please select a project first');

      const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
      if (emailList.length === 0) throw new Error('Please enter at least one email address');

      // Get current user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userData.user.id)
        .single();

      const senderName = profileData?.full_name || userData.user.email;

      // Determine valid role - try to match DB constraint
      // Common valid values: 'admin', 'member', 'viewer', 'owner'
      let validRole = role;

      // If we detected DB roles, use the first matching one
      if (dbRoles.length > 0 && !dbRoles.includes(role)) {
        validRole = dbRoles[0]; // Use first valid role as fallback
        console.log(`Role '${role}' not valid, using '${validRole}' instead`);
      }

      // If still not sure, try 'member' as safest default
      if (!validRole) validRole = 'member';

      console.log('Using role:', validRole);

      // Generate invitation data
      const invitationsData = emailList.map(email => ({
        project_id: projectId,
        email: email,
        role: validRole,
        invited_by: userData.user.id,
        status: 'pending',
        token: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }));

      console.log('Creating invitations:', invitationsData);

      // Try to insert
      const { data: savedInvites, error: dbError } = await supabase
        .from('invitations')
        .insert(invitationsData)
        .select();

      console.log('DB Insert Result:', savedInvites);
      console.log('DB Insert Error:', dbError);

      if (dbError) {
        console.error('Database error details:', dbError);

        // If constraint error, show helpful message
        if (dbError.message.includes('check constraint')) {
          throw new Error(`Invalid role: '${role}'. The database only accepts specific role values. Please check your database schema or use a different role.`);
        }

        throw new Error(`Database error: ${dbError.message}`);
      }

      if (!savedInvites || savedInvites.length === 0) {
        throw new Error('No invitations were saved to the database');
      }

      // Refresh invitations list
      await fetchInvitations();

      // Send emails
      const results = [];
      for (const invite of savedInvites) {
        const inviteLink = getInviteLink(invite.token);

        if (isEmailJSConfigured()) {
          try {
            await sendInvitationEmail({
              to_email: invite.email,
              to_name: invite.email.split('@')[0],
              project_name: currentProject.name || 'Project',
              role: roles.find(r => r.value === role)?.label || role,
              invite_link: inviteLink,
              sender_name: senderName
            });
            results.push({ email: invite.email, success: true });
          } catch (emailError) {
            console.error('Email error:', emailError);
            results.push({ email: invite.email, success: false, error: emailError.message });
          }
        } else {
          results.push({ email: invite.email, success: false, error: 'EmailJS not configured' });
        }
      }

      setEmailResults(results);
      setShowLinks(true);

      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        setSuccess(`Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}!`);
      } else {
        setSuccess(`Invitations created! ${results.length} link(s) generated for manual sharing.`);
      }

      setEmails('');
    } catch (err) {
      console.error('Full error:', err);
      setError(err.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (invite) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userData.user.id)
        .single();

      const senderName = profileData?.full_name || userData.user.email;
      const inviteLink = getInviteLink(invite.token);

      if (isEmailJSConfigured()) {
        await sendInvitationEmail({
          to_email: invite.email,
          to_name: invite.email.split('@')[0],
          project_name: currentProject.name || 'Project',
          role: roles.find(r => r.value === invite.role)?.label || invite.role,
          invite_link: inviteLink,
          sender_name: senderName
        });
        setSuccess(`Invitation resent to ${invite.email}!`);
      } else {
        setSuccess(`Copy this link: ${inviteLink}`);
      }
    } catch (err) {
      setError(`Failed to resend: ${err.message}`);
    }
  };

  const handleRevoke = async (inviteId) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      await fetchInvitations();
      setSuccess('Invitation revoked successfully');
    } catch (err) {
      setError(`Failed to revoke: ${err.message}`);
    }
  };

  // Use DB roles if detected, otherwise use defaults
  const roles = dbRoles.length > 0 
    ? dbRoles.map(r => ({ 
        value: r, 
        label: r.charAt(0).toUpperCase() + r.slice(1), 
        description: `Role: ${r}`,
        icon: '👤'
      }))
    : defaultRoles;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button onClick={onBack || (() => navigate(-1))} className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
              {currentProject.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invite Members</h1>
              <p className="text-gray-600">Add new members to {currentProject.name} and give them access to this project.</p>
            </div>
          </div>
        </div>

        {/* EmailJS Config Warning */}
        {!isEmailJSConfigured() && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800">EmailJS Not Configured</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Invitation links will be generated but emails won't be sent automatically. You'll need to copy and share the links manually.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Email Results */}
        {emailResults.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Email Delivery Status</h3>
            {emailResults.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                <span className="text-blue-900">{result.email}</span>
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✓ Sent' : `✗ ${result.error}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Invitation Links */}
        {showLinks && emailResults.some(r => !r.success) && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Copy & Share These Links</h3>
            <p className="text-purple-600 text-sm mb-3">Share these links with your team members:</p>
            {emailResults.filter(r => !r.success).map((result, idx) => {
              const invite = invitations.find(i => i.email === result.email && i.status === 'pending');
              const link = invite ? getInviteLink(invite.token) : '';
              return (
                <div key={idx} className="mb-2">
                  <div className="text-sm text-purple-900 mb-1">{result.email}</div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={link} 
                      readOnly 
                      className="flex-1 p-2 bg-white border border-purple-200 rounded text-sm text-purple-800"
                    />
                    <button 
                      onClick={() => navigator.clipboard.writeText(link)}
                      className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Invite Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite by Email</h2>
              <p className="text-gray-600 text-sm mb-4">
                {isEmailJSConfigured() 
                  ? 'Enter email addresses to send invitation emails automatically.' 
                  : 'Enter email addresses to generate invitation links.'}
              </p>

              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Addresses</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="Enter email addresses"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">You can add multiple emails separated by commas.</p>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        role === r.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{r.icon}</div>
                      <div className="font-semibold text-gray-900">{r.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{r.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSendInvites}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Invitations'}
                </button>
              </div>
            </div>

            {/* Sent Invitations List */}
            {invitations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Invitations</h2>
                <div className="space-y-3">
                  {invitations.map(invite => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                          {invite.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{invite.email}</div>
                          <div className="text-sm text-gray-600">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {invite.status}
                            </span>
                            <span className="ml-2">
                              Project: {invite.project?.name || 'Project'} • Role: {invite.role} • 
                              Sent: {new Date(invite.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {invite.status === 'pending' && (
                          <button
                            onClick={() => handleResend(invite)}
                            className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors"
                          >
                            Resend
                          </button>
                        )}
                        {invite.status === 'pending' && (
                          <button
                            onClick={() => handleRevoke(invite.id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Roles & Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles & Permissions</h2>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.value} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{role.icon}</span>
                    <h3 className="font-semibold text-gray-900">{role.label}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMembers;
