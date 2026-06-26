import { useState, useEffect } from 'react'
import NotificationDropdown from "../../components/NotificationDropdown"
import { supabase } from '../../services/supabase.js'

const CreateTicket = ({ onBack, onLogout, projects = [] }) => {
  const [project, setProject] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('high')
  const [status, setStatus] = useState('To Do')
  const [type, setType] = useState('bug')
  const [category, setCategory] = useState('ui-ux')
  const [assignee, setAssignee] = useState('unassigned')
  const [watchers, setWatchers] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectList, setProjectList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setProjectList(data)
        if (data.length > 0) setProject(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayProjects = projectList.length > 0 ? projectList : projects

  const priorities = [
    { id: 'high', label: 'High', icon: '↑', color: 'text-red-500' },
    { id: 'medium', label: 'Medium', icon: '→', color: 'text-yellow-500' },
    { id: 'low', label: 'Low', icon: '↓', color: 'text-green-500' },
  ]

  const statuses = [
    { id: 'To Do', label: 'To Do', dot: 'bg-purple-500' },
    { id: 'In Progress', label: 'In Progress', dot: 'bg-blue-500' },
    { id: 'Review', label: 'Review', dot: 'bg-yellow-500' },
    { id: 'Done', label: 'Done', dot: 'bg-green-500' },
  ]

  const types = [
    { id: 'bug', label: 'Bug', icon: '✨' },
    { id: 'feature', label: 'Feature', icon: '⭐' },
    { id: 'task', label: 'Task', icon: '📋' },
    { id: 'improvement', label: 'Improvement', icon: '🚀' },
  ]

  const categories = [
    { id: 'ui-ux', label: 'UI / UX', icon: '💎' },
    { id: 'backend', label: 'Backend', icon: '⚙️' },
    { id: 'frontend', label: 'Frontend', icon: '🎨' },
    { id: 'api', label: 'API', icon: '🔗' },
    { id: 'database', label: 'Database', icon: '🗄️' },
  ]

  const assignees = [
    { id: 'unassigned', label: 'Unassigned', icon: '👤' },
    { id: 'jawad-ali', label: 'Jawad Ali', icon: 'J' },
    { id: 'sara-khan', label: 'Sara Khan', icon: 'S' },
    { id: 'ali-raza', label: 'Ali Raza', icon: 'A' },
  ]

  const handleCreateTicket = async () => {
    if (!title.trim() || !description.trim()) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          project_id: project,
          title: title,
          description: description,
          priority: priority.charAt(0).toUpperCase() + priority.slice(1),
          status: status,
          type: type.charAt(0).toUpperCase() + type.slice(1),
          // assignee removed - column does not exist in table
        }])
        .select()

      if (error) throw error

      console.log('Ticket created:', data)
      onBack()
    } catch (err) {
      console.error('Error creating ticket:', err)
      console.error('Error message:', err.message)
      console.error('Error code:', err.code)
      console.error('Error details:', err.details)
      alert('Failed to create ticket: ' + (err.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <main className="p-6 max-w-4xl">

        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Ticket List
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Ticket</h1>
          <p className="text-gray-500">Fill in the details below to create a new ticket for your project.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Project */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {displayProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
                📦
              </div>
              <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-2">Select the project this ticket belongs to.</p>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a short, clear title for the ticket"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">Summarize the issue or request in a few words.</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50">
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600 font-bold text-sm">B</button>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600 italic text-sm">I</button>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600 underline text-sm">U</button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1"></div>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue or request in detail..."
                rows={4}
                className="w-full px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none resize-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Provide as much detail as possible to help your team understand the request.</p>
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-red-500 text-lg">↑</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-2">Select the priority level.</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                </div>
                <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-2">Select the initial status.</p>
            </div>
          </div>

          {/* Type & Category Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-purple-500">✨</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-2">Select the type of ticket.</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <span className="text-teal-500">💎</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-xs text-gray-500 mt-2">Select the category (optional).</p>
            </div>
          </div>

          {/* Assignee */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Assignee
            </label>
            <div className="relative">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400">👤</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-2">Assign this ticket to a team member.</p>
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Attachments <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:bg-purple-50 transition cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">Drag and drop files here, or <span className="text-purple-600 font-medium">click to browse</span></p>
              <p className="text-xs text-gray-400">Max file size: 10MB per file</p>
            </div>
          </div>

          {/* Add Watchers */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Add watchers <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
              <input
                type="text"
                value={watchers}
                onChange={(e) => setWatchers(e.target.value)}
                placeholder="Search and add team members..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Add team members who should be notified about this ticket.</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-6"></div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTicket}
              disabled={!title.trim() || !description.trim() || isSubmitting}
              className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                title.trim() && description.trim() && !isSubmitting
                  ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>

        </div>

      </main>
    </div>
  )
}

export default CreateTicket
