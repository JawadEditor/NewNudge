import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase.js'
import NotificationDropdown from '../../components/NotificationDropdown'

const TeamMembers = ({ project, onBack, onLogout, onInviteMembers }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, online: 0, admin: 0, developer: 0 })
  const [deleteModal, setDeleteModal] = useState({ show: false, member: null })
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState('member')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchMembers()
      checkUserRole()
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setError('Not logged in')
        return
      }

      // Get owned projects - SIMPLE query, no joins
      const { data: owned, error: ownedErr } = await supabase
        .from('projects')
        .select('id, name, created_by')
        .eq('created_by', user.id)

      if (ownedErr) console.error('Owned projects error:', ownedErr)

      // Get member projects - SIMPLE query, no joins
      const { data: memberProjects, error: memberErr } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (memberErr) console.error('Member projects error:', memberErr)

      // Get names for member projects
      const memberProjectIds = (memberProjects || []).map(m => m.project_id)
      let memberProjectNames = {}
      if (memberProjectIds.length > 0) {
        const { data: projNames } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', memberProjectIds)

        if (projNames) {
          projNames.forEach(p => { memberProjectNames[p.id] = p.name })
        }
      }

      const allProjects = [
        ...(owned || []),
        ...(memberProjects || []).map(m => ({
          id: m.project_id,
          name: memberProjectNames[m.project_id] || 'Unknown Project'
        }))
      ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

      console.log('Projects loaded:', allProjects.length, allProjects)
      setProjects(allProjects)

      if (allProjects.length > 0) {
        setSelectedProject(project?.id || allProjects[0].id)
      } else {
        setLoading(false)
        setError('No projects found. Create a project first.')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !selectedProject) return

      const { data: project } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', selectedProject)
        .single()

      if (project?.created_by === user.id) {
        setCurrentUserRole('owner')
        return
      }

      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', selectedProject)
        .eq('user_id', user.id)
        .single()

      setCurrentUserRole(member?.role || 'member')
    } catch (err) {
      console.error('Error checking role:', err)
      setCurrentUserRole('member')
    }
  }

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get project - SIMPLE query, no joins
      const { data: project, error: projectErr } = await supabase
        .from('projects')
        .select('id, name, created_by')
        .eq('id', selectedProject)
        .single()

      if (projectErr) {
        console.error('Project fetch error:', projectErr)
        throw projectErr
      }

      // Get project members - SIMPLE query, no joins
      const { data: membersData, error: membersErr } = await supabase
        .from('project_members')
        .select('id, user_id, email, role, status, joined_at')
        .eq('project_id', selectedProject)
        .eq('status', 'active')

      if (membersErr) {
        console.error('Members fetch error:', membersErr)
        throw membersErr
      }

      // Get user details separately
      const allUserIds = [project.created_by, ...(membersData || []).map(m => m.user_id)].filter(Boolean)
      const uniqueUserIds = [...new Set(allUserIds)]

      let userDetails = {}
      if (uniqueUserIds.length > 0) {
        const { data: users, error: usersErr } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', uniqueUserIds)

        if (usersErr) {
          console.log('profiles table error, trying auth.users...', usersErr)
          // Fallback: try to get from auth.users (requires service role or proper RLS)
        }

        if (users) {
          users.forEach(u => {
            userDetails[u.id] = u
          })
        }
      }

      // Format owner
      const ownerDetail = userDetails[project.created_by] || {}
      const ownerData = {
        id: 'owner',
        user_id: project.created_by,
        email: ownerDetail.email || project.created_by.substring(0, 8) + '@project.owner',
        role: 'Owner',
        status: 'active',
        name: ownerDetail.full_name || 'Project Owner',
        isOwner: true,
        joined_at: new Date().toISOString()
      }

      // Format members
      const formattedMembers = [ownerData]

      for (const m of (membersData || [])) {
        const userDetail = userDetails[m.user_id] || {}
        formattedMembers.push({
          id: m.id,
          user_id: m.user_id,
          email: m.email || userDetail.email || 'member@project.com',
          role: m.role || 'Member',
          status: m.status || 'active',
          name: userDetail.full_name || m.email?.split('@')[0] || 'Team Member',
          isOwner: false,
          joined_at: m.joined_at || new Date().toISOString()
        })
      }

      console.log('Members loaded:', formattedMembers.length, formattedMembers)
      setMembers(formattedMembers)
      setStats({
        total: formattedMembers.length,
        online: formattedMembers.filter(m => m.status === 'active').length,
        admin: formattedMembers.filter(m => m.role === 'Admin' || m.role === 'Owner').length,
        developer: formattedMembers.filter(m => m.role === 'Developer').length
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching members:', err)
      setError('Failed to load members: ' + err.message)
      setMembers([])
      setStats({ total: 0, online: 0, admin: 0, developer: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId, userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      fetchMembers()
      setDeleteModal({ show: false, member: null })
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  const handleChangeRole = async (memberId, newRole) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error
      fetchMembers()
    } catch (err) {
      console.error('Error changing role:', err)
      alert('Failed to change role')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'removed': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Online'
      case 'pending': return 'Pending'
      case 'removed': return 'Offline'
      default: return 'Offline'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Owner': return 'bg-purple-100 text-purple-700'
      case 'Admin': return 'bg-purple-100 text-purple-700'
      case 'Manager': return 'bg-blue-100 text-blue-700'
      case 'Developer': return 'bg-green-100 text-green-700'
      case 'Designer': return 'bg-teal-100 text-teal-700'
      case 'QA': return 'bg-indigo-100 text-indigo-700'
      case 'QA Engineer': return 'bg-indigo-100 text-indigo-700'
      case 'Support': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'Admin'

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'All Roles' || m.role === roleFilter
    const matchesStatus = statusFilter === 'All Status' || m.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Members</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => { setError(null); fetchMembers(); }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <input type="text" placeholder="Search projects, tickets..." className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm w-80 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
        </div>
      </header>

      <main className="p-6 w-full">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Project
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
            <p className="text-gray-500">Manage and collaborate with your team members.</p>
          </div>
          {canManageMembers && (
            <button onClick={onInviteMembers} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite Members
            </button>
          )}
        </div>

        {projects.length > 1 && (
          <div className="mb-6">
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">👥</div>
            <div><p className="text-sm text-gray-500">Total Members</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">🟢</div>
            <div><p className="text-sm text-gray-500">Online</p><p className="text-2xl font-bold text-gray-900">{stats.online}</p></div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">👑</div>
            <div><p className="text-sm text-gray-500">Admins</p><p className="text-2xl font-bold text-gray-900">{stats.admin}</p></div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">💻</div>
            <div><p className="text-sm text-gray-500">Developers</p><p className="text-2xl font-bold text-gray-900">{stats.developer}</p></div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search members..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="flex items-center gap-3">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>All Roles</option><option>Owner</option><option>Admin</option><option>Manager</option><option>Developer</option><option>Designer</option><option>QA Engineer</option><option>Support</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>All Status</option><option>active</option><option>pending</option><option>removed</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <div className="col-span-2">Member</div>
            <div className="col-span-1">Role</div>
            <div className="col-span-1">Department</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Joined On</div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredMembers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-500 text-lg mb-1">No members found</p>
                <p className="text-gray-400 text-sm mb-4">Invite team members to get started</p>
                <button onClick={onInviteMembers} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">Invite Members</button>
              </div>
            ) : (
              filteredMembers.map((member, i) => (
                <div key={member.id || i} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition group">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {member.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{member.email || ''}</p>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>{member.role}</span>
                  </div>
                  <div className="col-span-1 text-sm text-gray-600">{member.department || 'General'}</div>
                  <div className="col-span-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></span>
                      <span className="text-sm text-gray-600">{getStatusText(member.status)}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{new Date(member.joined_at).toLocaleDateString()}</span>
                    {canManageMembers && !member.isOwner && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        <select value={member.role} onChange={(e) => handleChangeRole(member.id, e.target.value)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option>Admin</option><option>Developer</option><option>Designer</option><option>QA</option>
                        </select>
                        <button onClick={() => setDeleteModal({ show: true, member })} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove Member">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Showing {filteredMembers.length > 0 ? `1 to ${filteredMembers.length}` : '0'} of {stats.total} members</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <button className="w-10 h-10 bg-purple-600 text-white rounded-lg font-medium">1</button>
            <button className="w-10 h-10 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50">2</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeJoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
      </main>

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <div><h3 className="text-lg font-semibold text-gray-900">Remove Member</h3><p className="text-sm text-gray-500">This action cannot be undone</p></div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to remove <strong>"{deleteModal.member?.name || 'this member'}"</strong> from this project? They will lose access to all project data.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, member: null })} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => handleRemoveMember(deleteModal.member.id, deleteModal.member.user_id)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamMembers
