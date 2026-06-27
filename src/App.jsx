import { useEffect, useState } from 'react'
import FlashScreen from './components/FlashScreen.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import ProjectsList from './pages/projects/ProjectsList.jsx'
import ProjectDetails from './pages/projects/ProjectDetails.jsx'
import InviteMembers from './pages/projects/InviteMembers.jsx'
import CreateProject from './pages/projects/CreateProject.jsx'
import CreateTicket from './pages/tickets/CreateTicket.jsx'
import Sidebar from './components/Sidebar.jsx'
import TeamMembers from './pages/projects/TeamMembers.jsx'
import Profile from './pages/profile/Profile.jsx'
import Settings from './pages/settings/Settings.jsx'
import AllTickets from './pages/tickets/AllTickets.jsx'
import { supabase } from './services/supabase.js'

function App() {
  const [showFlash, setShowFlash] = useState(true)
  const [showLogin, setShowLogin] = useState(true)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard')
  const [previousView, setPreviousView] = useState('dashboard')

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setShowLogin(!session)
      setShowFlash(!session)
      setCurrentView('dashboard')
      setSelectedProjectId(null)
      setIsLoading(false)
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      setShowLogin(!session)
      setShowFlash(!session)
      if (!session) {
        setCurrentView('dashboard')
        setSelectedProjectId(null)
      }
    })

    return () => subscription?.unsubscribe?.()
  }, [])

  const handleForgotPassword = () => {
    setShowResetPassword(true)
  }

  const handleViewAllTickets = () => {
    setPreviousView(currentView)
    setCurrentView('all-tickets')
  }

  const handleBackToLogin = () => {
    setShowResetPassword(false)
    setShowLogin(true)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowResetPassword(false)
    setShowLogin(false)
    setShowFlash(false)
    setCurrentView('dashboard')
    setSelectedProjectId(null)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }

    setIsAuthenticated(false)
    setShowFlash(true)
    setShowLogin(true)
    setShowResetPassword(false)
    setCurrentView('dashboard')
    setSelectedProjectId(null)
  }

  const handleViewProject = (id) => {
    setPreviousView(currentView)
    setSelectedProjectId(id)
    setCurrentView('project')
  }

  const handleViewProjectsList = () => {
    setPreviousView(currentView)
    setCurrentView('projects')
  }

  const handleCreateTicket = () => {
    setPreviousView(currentView)
    setCurrentView('create-ticket')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedProjectId(null)
    setPreviousView('dashboard')
  }

  const handleGoBack = () => {
    setCurrentView(previousView)
  }

  const handleInviteMembers = () => {
    setPreviousView(currentView)
    setCurrentView('invite')
  }

  const handleCreateProject = () => {
    setPreviousView(currentView)
    setCurrentView('create-project')
  }

  const handleProjectCreated = (projectId) => {
    setSelectedProjectId(projectId)
    setPreviousView('projects')
    setCurrentView('project')
  }

  const handleViewTeamMembers = () => {
    setPreviousView(currentView)
    setCurrentView('team-members')
  }

  const handleViewSettings = () => {
    setPreviousView(currentView)
    setCurrentView('settings')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {showFlash && <FlashScreen onComplete={() => setShowFlash(false)} />}
        {!showFlash && (
          showResetPassword ? (
            <ResetPassword onBackToLogin={handleBackToLogin} />
          ) : showLogin ? (
            <Login 
              onSwitchToRegister={() => setShowLogin(false)}
              onLoginSuccess={handleLoginSuccess}
              onForgotPassword={handleForgotPassword}
            />
          ) : (
            <Register onSwitchToLogin={() => setShowLogin(true)} />
          )
        )}
      </>
    )
  }

  const getActiveItem = () => {
    if (currentView === 'dashboard' || currentView === 'profile') return 'dashboard'
    if (currentView === 'all-tickets') return 'all-tickets'
    if (currentView === 'team-members' || currentView === 'invite') return 'all-members'
    if (currentView === 'settings') return 'settings'
    if (currentView === 'projects' || currentView === 'project' || currentView === 'create-project') return 'projects'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeItem={getActiveItem()}
        onLogout={handleLogout}
        onNavigate={(item) => {
          if (item === 'dashboard') {
            setCurrentView('dashboard')
            setSelectedProjectId(null)
          }
          if (item === 'all-tickets') {
            setCurrentView('all-tickets')
          }
          if (item === 'all-members') {
            setCurrentView('team-members')
          }
          if (item === 'projects') {
            setCurrentView('projects')
          }
          if (item === 'profile') {
            setCurrentView('profile')
          }
          if (item === 'settings') {
            setCurrentView('settings')
          }
        }}
      />

      <div className="flex-1 lg:ml-64">
        <div 
          key={currentView} 
          className="animate-fade-in"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >

          {currentView === 'profile' && (
            <Profile 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'dashboard' && (
            <Dashboard 
              onLogout={handleLogout} 
              onViewProject={handleViewProject} 
              onViewProjectsList={handleViewProjectsList}
              onCreateProject={handleCreateProject}
              onCreateTicket={handleCreateTicket}
              onViewAllTickets={handleViewAllTickets}
            />
          )}

          {currentView === 'settings' && (
            <Settings 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'all-tickets' && (
            <AllTickets 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout}
              onCreateTicket={handleCreateTicket}
            />
          )}

          {currentView === 'team-members' && (
            <TeamMembers 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout}
              onInviteMembers={handleInviteMembers}
            />
          )}

          {currentView === 'projects' && (
            <ProjectsList 
              onLogout={handleLogout} 
              onViewProject={handleViewProject} 
              onViewDashboard={handleBackToDashboard}
              onCreateProject={handleCreateProject}
            />
          )}

          {currentView === 'project' && (
            <ProjectDetails 
              projectId={selectedProjectId} 
              onBack={handleGoBack}
              previousView={previousView}
              onInviteMembers={handleInviteMembers}
              onViewTeamMembers={handleViewTeamMembers}
              onViewAllTickets={handleViewAllTickets}
            />
          )}

          {currentView === 'invite' && (
            <InviteMembers 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout} 
            />
          )}

          {currentView === 'create-project' && (
            <CreateProject 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout}
              onProjectCreated={handleProjectCreated}
            />
          )}

          {currentView === 'create-ticket' && (
            <CreateTicket 
              onBack={handleGoBack}
              previousView={previousView}
              onLogout={handleLogout} 
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
