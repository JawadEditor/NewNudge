import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase.js'
import NotificationDropdown from '../../components/NotificationDropdown'

const ProjectsList = ({ onLogout, onViewProject, onViewDashboard, onCreateProject }) => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [sortBy, setSortBy] = useState('Recently Updated')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteModal, setDeleteModal] = useState({ show: false, project: null })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('No user logged in')
        setProjects([])
        setLoading(false)
        return
      }

      console.log('Current user ID:', user.id)

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', user.id)

      if (error) {
        console.error('Error:', error)
        throw error
      }

      console.log('Projects fetched for user:', data)
      console.log('Number of projects:', data?.length || 0)
      if (data) setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.filter(p => p.id !== projectId))
      setDeleteModal({ show: false, project: null })
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'planning': return 'bg-purple-100 text-purple-700'
      case 'on hold': return 'bg-gray-100 text-gray-700'
      case 'completed': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusDot = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500'
      case 'planning': return 'bg-purple-500'
      case 'on hold': return 'bg-gray-400'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-purple-500'
    if (progress >= 50) return 'bg-teal-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getProjectIcon = (index) => {
    const icons = ['🛡️', '💻', '📱', '🔊', '🛠️']
    return icons[index % icons.length]
  }

  const getIconBgColor = (index) => {
    const colors = ['bg-purple-100 text-purple-600', 'bg-teal-100 text-teal-600', 'bg-yellow-100 text-yellow-600', 'bg-indigo-100 text-indigo-600', 'bg-pink-100 text-pink-600']
    return colors[index % colors.length]
  }

  let filteredProjects = projects.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (sortBy === 'Name') {
    filteredProjects.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy === 'Progress') {
    filteredProjects.sort((a, b) => (b.progress || 0) - (a.progress || 0))
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
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Projects</h1>
              <p className="text-gray-500">Manage and organize all your projects in one place.</p>
            </div>
            <button 
              onClick={onCreateProject}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Planning</option>
                <option>On Hold</option>
                <option>Completed</option>
              </select>

              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option>Recently Updated</option>
                <option>Name</option>
                <option>Progress</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first project to get started</p>
              <button 
                onClick={onCreateProject}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
              >
                Create Project
              </button>
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, i) => (
                <div 
                  key={project.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group relative"
                >
                  {/* Delete Button - appears on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteModal({ show: true, project })
                    }}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 z-10"
                    title="Delete Project"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div 
                    onClick={() => onViewProject(project.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${getIconBgColor(i)} flex items-center justify-center text-xl`}>
                        {getProjectIcon(i)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status || 'Active'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description || 'No description'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, 3))].map((_, j) => (
                            <div key={j} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                              <img src={`https://i.pravatar.cc/150?img=${10 + j + i}`} alt="Member" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">0 members</span>
                      </div>
                      <span className="text-xs text-gray-500">0 tickets</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getProgressColor(project.progress || 0)}`} style={{ width: `${project.progress || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && filteredProjects.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Project</div>
                <div className="col-span-2 text-center">Members</div>
                <div className="col-span-3 text-center">Progress</div>
                <div className="col-span-1 text-center">Tickets</div>
                <div className="col-span-1 text-center">Updated</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-50">
                {filteredProjects.map((project, i) => (
                  <div 
                    key={project.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition group"
                  >
                    {/* Project Info */}
                    <div 
                      className="col-span-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => onViewProject(project.id)}
                    >
                      <div className={`w-12 h-12 rounded-xl ${getIconBgColor(i)} flex items-center justify-center text-xl`}>
                        {getProjectIcon(i)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(project.status)}`}></span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                            {project.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="col-span-2 flex justify-center">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(3, 3))].map((_, j) => (
                          <div key={j} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                            <img src={`https://i.pravatar.cc/150?img=${10 + j + i}`} alt="Member" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(project.progress || 0)}`} 
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">{project.progress || 0}%</span>
                      </div>
                    </div>

                    {/* Tickets */}
                    <div className="col-span-1 text-center">
                      <p className="text-lg font-bold text-gray-900">0</p>
                      <p className="text-xs text-gray-500">Tickets</p>
                    </div>

                    {/* Updated */}
                    <div className="col-span-1 text-center">
                      <span className="text-sm text-gray-500">{new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteModal({ show: true, project })
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="Delete Project"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">Showing 1 to {filteredProjects.length} of {filteredProjects.length} projects</p>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-purple-600 text-white rounded-lg font-medium">1</button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{deleteModal.project?.name}"</strong>? All tickets and data associated with this project will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, project: null })}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteModal.project.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectsList
