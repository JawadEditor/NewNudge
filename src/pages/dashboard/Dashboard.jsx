import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase.js'
import NotificationDropdown from "../../components/NotificationDropdown"

const Dashboard = ({ onLogout, onViewProject, onViewProjectsList, onCreateProject, onCreateTicket, onViewAllTickets }) => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({ email: 'User' })
  const [userName, setUserName] = useState('User')
  const [projects, setProjects] = useState([])
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    completed: 0,
    inProgress: 0
  })

  useEffect(() => {
    fetchUser()
    fetchProjects()
    fetchTickets()
  }, [])

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      setUserName(name)
    }
  }

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*')
    if (!error && data) setProjects(data)
    setLoading(false)
  }

  const fetchTickets = async () => {
    const { data, error } = await supabase.from('tickets').select('*')
    if (!error && data) {
      setTickets(data)
      // Calculate stats from real data
      const total = data.length
      const open = data.filter(t => t.status !== 'Done' && t.status !== 'Completed').length
      const completed = data.filter(t => t.status === 'Done' || t.status === 'Completed').length
      const inProgress = data.filter(t => t.status === 'In Progress').length
      
      setStats({
        totalTickets: total,
        openTickets: open,
        completed: completed,
        inProgress: inProgress
      })
    }
  }

  const getProjectColor = (index) => {
    const colors = ['bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500']
    return colors[index % colors.length]
  }

  const getProjectIcon = (index) => {
    const icons = ['💼', '🖥️', '📱', '📢', '🛠️']
    return icons[index % icons.length]
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Get recent tickets (last 5)
  const recentTickets = tickets.slice(0, 5).map(ticket => ({
    ...ticket,
    icon: ticket.type === 'bug' ? '🐛' : ticket.type === 'feature' ? '⭐' : ticket.type === 'task' ? '📋' : '🔧',
    project: projects.find(p => p.id === ticket.project_id)?.name || 'Unknown'
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const displayProjects = projects

  // Stats with NO percentages or "from last week"
  const statsData = [
    { label: 'Total Tickets', value: stats.totalTickets, icon: '📋' },
    { label: 'Open Tickets', value: stats.openTickets, icon: '⏱️' },
    { label: 'Completed', value: stats.completed, icon: '✅' },
    { label: 'In Progress', value: stats.inProgress, icon: '👥' },
  ]

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
          
          {/* Welcome */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {userName}! 👋</h1>
              <p className="text-gray-500">Here's what's happening with your projects today.</p>
            </div>
            <button 
              onClick={onCreateProject} 
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition shadow-lg shadow-purple-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Project
            </button>
          </div>

          {/* Stats - Clean, NO percentages, NO "from last week" */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsData.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
                    {stat.icon}
                  </div>
                  <span className="text-sm text-gray-500">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Projects</h2>
              <button 
                onClick={onViewProjectsList} 
                className="text-sm font-medium text-purple-600 hover:underline cursor-pointer bg-transparent border-none"
              >
                View All Projects
              </button>
            </div>

            <div className="space-y-3">
              {displayProjects.length > 0 ? (
                displayProjects.map((project, i) => (
                  <div
                    key={project.id || i}
                    onClick={() => onViewProject(project.id || i + 1)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer border border-gray-100 hover:border-purple-300"
                  >
                    <div className={`w-12 h-12 rounded-xl ${getProjectColor(i)} flex items-center justify-center text-white text-xl`}>
                      {getProjectIcon(i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{project.desc || project.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${getProjectColor(i)}`} style={{ width: `${project.progress || 0}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(j => (
                          <div key={j} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                            {String.fromCharCode(64 + j)}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                          +{i + 2}
                        </div>
                      </div>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-gray-900">{project.tickets || 0}</p>
                      <p className="text-xs text-gray-500">Tickets</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">No projects yet</p>
                  <p className="text-sm">Click "Create Project" to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Recent Tickets</h2>
              <button 
                onClick={onViewAllTickets}
                className="text-sm font-medium text-purple-600 hover:underline cursor-pointer bg-transparent border-none"
              >
                View All Tickets
              </button>
            </div>
            <div className="space-y-3">
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
                      {ticket.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                      <p className="text-sm text-gray-500">{ticket.project}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority || 'Medium'}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                        {userName.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-500">{ticket.updated_at ? new Date(ticket.updated_at).toLocaleDateString() : 'Recently'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">No tickets yet</p>
                  <p className="text-sm">Create a ticket to get started!</p>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

export default Dashboard