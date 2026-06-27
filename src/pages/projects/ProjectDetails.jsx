import { useState, useEffect } from 'react'
import NotificationDropdown from "../../components/NotificationDropdown"
import { supabase, notifyProjectMembers } from '../../services/supabase.js'

const ProjectDetails = ({ projectId, onBack, onInviteMembers, onViewTeamMembers, onViewAllTickets }) => {
  const [project, setProject] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editModal, setEditModal] = useState({ show: false, project: null })
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'Active' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId)

      if (ticketsError) throw ticketsError
      setTickets(ticketsData || [])

    } catch (err) {
      console.error('Error fetching project data:', err)
      setError(err.message)
      setProject(null)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .rpc('update_project', {
          p_id: projectId,
          p_name: editForm.name,
          p_description: editForm.description,
          p_status: editForm.status
        })

      if (error) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            name: editForm.name,
            description: editForm.description,
            status: editForm.status
          })
          .eq('id', projectId)

        if (updateError) throw updateError
      }

      if (user) {
        await notifyProjectMembers(
          projectId,
          `Project Updated`,
          `"${editForm.name}" project details were updated`,
          'project',
          user.id
        )
      }

      setProject({ ...project, ...editForm })
      setEditModal({ show: false, project: null })
    } catch (err) {
      console.error('Error updating project:', err)
      setError(err.message || 'Failed to update project')
    } finally {
      setUpdating(false)
    }
  }

  const openEditModal = () => {
    setEditForm({
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'Active'
    })
    setEditModal({ show: true, project })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'in progress': return 'bg-blue-100 text-blue-700'
      case 'to do': return 'bg-purple-100 text-purple-700'
      case 'review': return 'bg-yellow-100 text-yellow-700'
      case 'done': return 'bg-green-100 text-green-700'
      case 'backlog': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getMemberStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getTicketIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bug': return '🐛'
      case 'feature': return '⭐'
      case 'task': return '📋'
      case 'improvement': return '🚀'
      default: return '🔧'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Project not found</h3>
          <p className="text-gray-500 mb-4">The project you're looking for doesn't exist or has been deleted.</p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const currentProject = project

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status !== 'Done').length,
    completed: tickets.filter(t => t.status === 'Done').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length
  }

  const progress = {
    overall: tickets.length > 0 ? Math.round((tickets.filter(t => t.status === 'Done').length / tickets.length) * 100) : 0,
    todo: tickets.filter(t => t.status === 'To Do').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    review: tickets.filter(t => t.status === 'Review').length,
    done: tickets.filter(t => t.status === 'Done').length,
    backlog: tickets.filter(t => t.status === 'Backlog').length
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
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Projects</span>
          </button>

          {error && !error.includes('infinite recursion') && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              Error: {error}
            </div>
          )}

          {/* Project Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-2xl">
                📦
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentProject.status)}`}>
                    ● {currentProject.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm max-w-xl">{currentProject.description}</p>
                <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      J
                    </div>
                    <span>Created by <span className="font-medium text-gray-700">{currentProject.created_by || 'You'}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created on <span className="font-medium text-gray-700">{currentProject.created_at ? new Date(currentProject.created_at).toLocaleDateString() : 'Recently'}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {currentProject.members?.slice(0, 3).map((m, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                          {m.name.charAt(0)}
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                        +{currentProject.members?.length - 3}
                      </div>
                    </div>
                    <span>Members</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={openEditModal}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Project
              </button>
              <button onClick={onInviteMembers} className="flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Invite Members
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1">

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Tickets', value: stats.totalTickets, change: '12%', up: true, color: 'purple', icon: '📋' },
                  { label: 'Open Tickets', value: stats.openTickets, change: '8%', up: true, color: 'blue', icon: '⏱️' },
                  { label: 'Completed', value: stats.completed, change: '16%', up: true, color: 'green', icon: '✅' },
                  { label: 'In Progress', value: stats.inProgress, change: '4%', up: false, color: 'purple', icon: '👥' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
                        {stat.icon}
                      </div>
                      <span className="text-sm text-gray-500">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium flex items-center gap-1 ${stat.up ? 'text-green-600' : 'text-red-600'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.up ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                        </svg>
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-400">from last week</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Progress Overview</h3>
                <div className="flex items-center gap-8">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#7c3aed" strokeWidth="10" strokeDasharray={`${progress.overall * 2.51} 251`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{progress.overall}%</span>
                      <span className="text-xs text-gray-500">Overall Progress</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'To Do', value: progress.todo, color: 'bg-purple-500' },
                      { label: 'In Progress', value: progress.inProgress, color: 'bg-blue-500' },
                      { label: 'Review', value: progress.review, color: 'bg-teal-500' },
                      { label: 'Done', value: progress.done, color: 'bg-green-500' },
                      { label: 'Backlog', value: progress.backlog, color: 'bg-yellow-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-28">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm text-gray-600">{item.label}</span>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${stats.totalTickets > 0 ? (item.value / stats.totalTickets) * 100 : 0}%` }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-16">{item.value} ({stats.totalTickets > 0 ? Math.round((item.value / stats.totalTickets) * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Tickets - With Comments Button */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recent Tickets</h3>
                  <button 
                    onClick={onViewAllTickets}
                    className="text-sm font-medium text-purple-600 flex items-center gap-1 hover:underline"
                  >
                    View All Tickets
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 font-medium">Ticket</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Assignee</th>
                        <th className="pb-3 font-medium">Updated</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket, i) => (
                        <tr key={ticket.id || i} className="border-t border-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
                                {getTicketIcon(ticket.type) || ticket.icon || '🔧'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{ticket.title}</p>
                                <p className="text-xs text-gray-400">#{ticket.id?.toString().slice(0, 8) || ticket.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                              {ticket.assignee?.full_name?.charAt(0) || ticket.assignee?.charAt(0) || 'J'}
                            </div>
                          </td>
                          <td className="py-4 text-sm text-gray-500">
                            {ticket.updated || (ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'Recently')}
                          </td>
                          {/* ✅ ACTIONS COLUMN - Comments Button + Three dots */}
                          <td className="py-4">
                            <div className="flex items-center gap-1">
                              {/* Comments Button */}
                              <button
                                onClick={() => onViewAllTickets && onViewAllTickets()}
                                className="p-2 hover:bg-gray-100 rounded-lg text-purple-500"
                                title="View Comments"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>
                              {/* Three dots menu */}
                              <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Sidebar */}
            <div className="w-80 space-y-6">

              {/* Project Members */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Project Members</h3>
                </div>
                <div className="space-y-3">
                  {currentProject.members?.length > 0 ? currentProject.members.map((member, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                          {member.name?.charAt(0) || '?'}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getMemberStatusColor(member.status)}`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{member.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{member.role || 'Member'}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${member.status === 'online' ? 'bg-green-50 text-green-600' : member.status === 'away' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-500'}`}>
                        {member.status === 'online' ? 'Online' : member.status === 'away' ? 'Away' : 'Offline'}
                      </span>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No members yet
                    </div>
                  )}
                </div>
                <button 
                  onClick={onViewTeamMembers}
                  className="w-full mt-4 py-2.5 border border-purple-200 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  All Members
                </button>
              </div>

              {/* Project Activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Project Activity</h3>
                  <a href="#" className="text-sm text-purple-600 hover:underline">View All</a>
                </div>
                <div className="space-y-4">
                  <div className="text-center py-4 text-gray-400 text-sm">
                    No recent activity
                  </div>
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>

      {/* Edit Project Modal */}
      {editModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Project</h3>
              <button 
                onClick={() => setEditModal({ show: false, project: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, project: null })}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetails