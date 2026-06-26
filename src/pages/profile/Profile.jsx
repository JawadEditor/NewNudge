import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase.js'
import NotificationDropdown from "../../components/NotificationDropdown"
const Profile = ({ onBack, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    location: '',
    role: 'Member',
    status: 'Active',
    joinedDate: '',
    lastLogin: '',
    twoFactor: 'Disabled',
    avatar: 'https://i.pravatar.cc/150?img=11'
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    desktopNotifications: true,
    soundAlerts: false,
    weeklySummary: true
  })

  const [stats, setStats] = useState({
    totalTickets: 0,
    projects: 0,
    ticketsClosed: 0,
    responseTime: '0h'
  })

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch profile from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile({
            fullName: data.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            phone: data.phone || '',
            jobTitle: data.job_title || '',
            department: data.department || '',
            location: data.location || '',
            role: data.role || 'Member',
            status: 'Active',
            joinedDate: new Date(user.created_at).toLocaleDateString(),
            lastLogin: new Date(user.last_sign_in_at).toLocaleString(),
            twoFactor: user.app_metadata?.provider === 'email' ? 'Enabled' : 'Disabled',
            avatar: data.avatar_url || 'https://i.pravatar.cc/150?img=11'
          })
        } else {
          // Use auth user data if no profile
          setProfile(prev => ({
            ...prev,
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            joinedDate: new Date(user.created_at).toLocaleDateString(),
            lastLogin: new Date(user.last_sign_in_at).toLocaleString()
          }))
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Count tickets created by user
      const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

      // Count projects
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

      // Count completed tickets
      const { count: completedCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'Done')

      setStats({
        totalTickets: ticketsCount || 0,
        projects: projectsCount || 0,
        ticketsClosed: completedCount || 0,
        responseTime: '42h' // This would need more complex calculation
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: profile.fullName,
            phone: profile.phone,
            job_title: profile.jobTitle,
            department: profile.department,
            location: profile.location,
            updated_at: new Date().toISOString()
          })

        if (error) throw error

        setMessage('Profile updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      }

      setIsEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
      setMessage('Error saving profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage('Passwords do not match!')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (error) throw error

      setMessage('Password updated successfully!')
      setPasswords({ current: '', new: '', confirm: '' })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error updating password:', err)
      setMessage('Error updating password. Please try again.')
    }
  }

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const statItems = [
    { label: 'Total Tickets', value: stats.totalTickets.toString(), icon: '🎫', color: 'text-purple-600' },
    { label: 'Projects', value: stats.projects.toString(), icon: '📁', color: 'text-blue-600' },
    { label: 'Tickets Closed', value: stats.ticketsClosed.toString(), icon: '✅', color: 'text-green-600' },
    { label: 'Response Time', value: stats.responseTime, icon: '⏱️', color: 'text-orange-600' }
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

      <main className="p-6 max-w-5xl lg:ml-64">

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-600'}`}>
            {message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-500">View and manage your personal information and preferences.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={profile.avatar} alt={profile.fullName} className="w-20 h-20 rounded-full object-cover" />
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">{profile.fullName || 'User'}</h2>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{profile.role}</span>
                </div>
                <p className="text-gray-500 mb-1">{profile.email}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Joined on {profile.joinedDate}
                </div>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Online</span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
           </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {statItems.map((stat, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-6 mb-6">

          {/* Left Column - Personal Information */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Personal Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">✉️</span>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">📞</span>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">💼</span>
                  <input
                    type="text"
                    value={profile.jobTitle}
                    onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🏢</span>
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({...profile, department: e.target.value})}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">📍</span>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!isEditing ? 'bg-gray-50' : 'bg-white'}`}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <button 
                onClick={handleSaveChanges}
                disabled={saving}
                className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Right Column - Password & Preferences */}
          <div className="w-96 space-y-6">

            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      placeholder="Enter new password"
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      placeholder="Confirm new password"
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpdatePassword}
                className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
              >
                Update Password
              </button>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Preferences</h3>

              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email notifications for updates', icon: '✉️' },
                  { key: 'desktopNotifications', label: 'Desktop Notifications', desc: 'Receive desktop notifications', icon: '💻' },
                  { key: 'soundAlerts', label: 'Sound Alerts', desc: 'Play sound for notifications', icon: '🔊' },
                  { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Receive weekly activity summary', icon: '📅' },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{pref.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{pref.label}</p>
                        <p className="text-xs text-gray-500">{pref.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePreference(pref.key)}
                      className={`w-11 h-6 rounded-full transition ${preferences[pref.key] ? 'bg-purple-600' : 'bg-gray-200'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transform transition ${preferences[pref.key] ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Account Information</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account Role</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{profile.role}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{profile.status}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Last Login</span>
              <span className="text-sm text-gray-900">{profile.lastLogin}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">Two-Factor Authentication</span>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{profile.twoFactor}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>

          <button className="flex items-center gap-2 px-6 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
          </button>
        </div>

      </main>
    </div>
  )
}

export default Profile
