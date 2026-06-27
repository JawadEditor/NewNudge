import { useState, useEffect } from 'react'
import TicketComments from '../../components/TicketComments.jsx'
import NotificationDropdown from "../../components/NotificationDropdown"
import { supabase, notifyProjectMembers } from '../../services/supabase.js'

const AllTickets = ({ onBack, onLogout, onViewTicket, onCreateTicket, projectId }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [commentModal, setCommentModal] = useState({ show: false, ticket: null })
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [priorityFilter, setPriorityFilter] = useState('All Priorities')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0
  })
  const [deleteModal, setDeleteModal] = useState({ show: false, ticket: null })
  const [editModal, setEditModal] = useState({ show: false, ticket: null })
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    type: 'Task'
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
    fetchTickets()
  }, [projectId])

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('created_by', user.id)
          .limit(1)

        setIsOwner(projects && projects.length > 0)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('tickets')
        .select(`
          *,
          projects(id, name, created_by)
        `)
        .order('updated_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched tickets:', data)

      if (data && data.length > 0) {
        setTickets(data)
        setStats({
          total: data.length,
          open: data.filter(t => t.status !== 'Done').length,
          inProgress: data.filter(t => t.status === 'In Progress').length,
          completed: data.filter(t => t.status === 'Done').length
        })
      } else {
        setTickets([])
        setStats({ total: 0, open: 0, inProgress: 0, completed: 0 })
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setTickets([])
      setStats({ total: 0, open: 0, inProgress: 0, completed: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)

      if (error) throw error

      setTickets(tickets.filter(t => t.id !== ticketId))
      const remaining = tickets.filter(t => t.id !== ticketId)
      setStats({
        total: remaining.length,
        open: remaining.filter(t => t.status !== 'Done').length,
        inProgress: remaining.filter(t => t.status === 'In Progress').length,
        completed: remaining.filter(t => t.status === 'Done').length
      })
      setDeleteModal({ show: false, ticket: null })
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Failed to delete ticket: ' + (error.message || 'You do not have permission to delete this ticket'))
    }
  }

  const openEditModal = (ticket) => {
    setEditForm({
      title: ticket.title || '',
      description: ticket.description || '',
      status: ticket.status || 'To Do',
      priority: ticket.priority || 'Medium',
      type: ticket.type || 'Task'
    })
    setEditModal({ show: true, ticket })
  }

  const handleUpdateTicket = async (e) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          type: editForm.type,
          updated_at: new Date().toISOString()
        })
        .eq('id', editModal.ticket.id)

      if (error) throw error

      if (user) {
        await notifyProjectMembers(
          editModal.ticket.project_id,
          `Ticket Status Updated`,
          `"${editForm.title}" status changed to ${editForm.status}`,
          'ticket_status',
          user.id,
          { ticket_id: editModal.ticket.id, new_status: editForm.status }
        )
      }

      const updatedTickets = tickets.map(t => 
        t.id === editModal.ticket.id 
          ? { ...t, ...editForm, updated_at: new Date().toISOString() }
          : t
      )
      setTickets(updatedTickets)

      setStats({
        total: updatedTickets.length,
        open: updatedTickets.filter(t => t.status !== 'Done').length,
        inProgress: updatedTickets.filter(t => t.status === 'In Progress').length,
        completed: updatedTickets.filter(t => t.status === 'Done').length
      })

      setEditModal({ show: false, ticket: null })
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Failed to update ticket: ' + (error.message || 'Unknown error'))
    } finally {
      setUpdating(false)
    }
  }

  const isTicketOwner = (ticket) => {
    if (!currentUser || !ticket.projects) return false
    return ticket.projects.created_by === currentUser.id
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

  const getTicketIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'bug': return '🐛'
      case 'feature': return '⭐'
      case 'task': return '📋'
      case 'improvement': return '🚀'
      default: return '🔧'
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'All Priorities' || ticket.priority === priorityFilter
    const matchesType = typeFilter === 'All Types' || ticket.type === typeFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
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

      <main className="p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tickets</h1>
            <p className="text-gray-500">View and manage all tickets across your projects.</p>
          </div>
          <button 
            onClick={() => onCreateTicket && onCreateTicket()}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">🎫</div>
            <div>
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-400">All tickets</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">📋</div>
            <div>
              <p className="text-sm text-gray-500">Open</p>
              <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              <p className="text-xs text-gray-400">Awaiting action</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-xs text-gray-400">Being worked on</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-400">Done & closed</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>All Status</option>
              <option>To Do</option>
              <option>In Progress</option>
              <option>Review</option>
              <option>Done</option>
            </select>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option>All Types</option>
              <option>Bug</option>
              <option>Feature</option>
              <option>Task</option>
              <option>Improvement</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
            <div className="col-span-2">Ticket</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Priority</div>
            <div className="col-span-1">Assignee</div>
            <div className="col-span-1">Project</div>
            <div className="col-span-1">Actions</div>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredTickets.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-3">🎫</div>
                <p className="text-gray-500 text-lg mb-1">No tickets found</p>
                <p className="text-gray-400 text-sm mb-4">Create your first ticket to get started</p>
                <button 
                  onClick={() => onCreateTicket && onCreateTicket()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                >
                  Create Ticket
                </button>
              </div>
            )}
            {filteredTickets.map((ticket, i) => (
              <div key={ticket.id || i} className="grid grid-cols-7 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition group">
                <div 
                  className="col-span-2 flex items-center gap-3 cursor-pointer"
                  onClick={() => onViewTicket && onViewTicket(ticket.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
                    {getTicketIcon(ticket.type) || '🔧'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{ticket.title}</p>
                    <p className="text-xs text-gray-400">#{ticket.id?.toString().slice(0, 8)}</p>
                  </div>
                </div>
                <div className="col-span-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {ticket.priority}
                  </span>
                </div>
                <div className="col-span-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                    {ticket.assignee?.charAt(0) || 'J'}
                  </div>
                  <span className="text-sm text-gray-600">{ticket.assignee || 'Unassigned'}</span>
                </div>
                <div className="col-span-1 text-sm text-gray-600">{ticket.projects?.name || 'Unknown'}</div>
                {/* Actions */}
<div className="col-span-1 flex items-center gap-2">
  {/* Comments Button */}
  <button
    onClick={(e) => {
      e.stopPropagation()
      setCommentModal({ show: true, ticket })
    }}
    className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
    title="View Comments"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  </button>

  {/* Edit Button - Available for all users */}
  <button
    onClick={(e) => {
      e.stopPropagation()
      openEditModal(ticket)
    }}
    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
    title="Edit Ticket"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  </button>

  {/* Delete Button - ONLY for project owners */}
  {isTicketOwner(ticket) && (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setDeleteModal({ show: true, ticket })
      }}
      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
      title="Delete Ticket"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )}
</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Showing {filteredTickets.length > 0 ? `1 to ${filteredTickets.length}` : '0'} of {stats.total} tickets</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-10 h-10 bg-purple-600 text-white rounded-lg font-medium">1</button>
            <button className="w-10 h-10 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50">2</button>
            <button className="w-10 h-10 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50">3</button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </main>

      {/* Edit Ticket Modal */}
      {editModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Ticket</h3>
              <button 
                onClick={() => setEditModal({ show: false, ticket: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                  <option value="Task">Task</option>
                  <option value="Improvement">Improvement</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, ticket: null })}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && isTicketOwner(deleteModal.ticket) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Ticket</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{deleteModal.ticket?.title}"</strong>? This ticket will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, ticket: null })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTicket(deleteModal.ticket.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Comment Modal - INSIDE the return! */}
      {commentModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Comments: {commentModal.ticket?.title}
              </h3>
              <button 
                onClick={() => setCommentModal({ show: false, ticket: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TicketComments 
              ticketId={commentModal.ticket?.id} 
              currentUser={currentUser}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default AllTickets