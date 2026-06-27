import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase.js'

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authMode, setAuthMode] = useState('check')

  useEffect(() => {
    console.log('AcceptInvitation mounted, token:', token)
    if (token) {
      fetchInvitation()
    } else {
      setError('Invalid invitation link - no token provided')
      setLoading(false)
    }
  }, [token])

  const fetchInvitation = async () => {
    try {
      console.log('Fetching invitation with token:', token)

      // Get ALL invitations with this token (don't filter by status yet)
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)

      console.log('Raw invitation data:', data)
      console.log('Error:', error)

      if (error) {
        console.error('Database error:', error)
        setError('Database error: ' + error.message)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        console.log('No invitation found with this token')
        setError('This invitation link is invalid or has expired')
        setLoading(false)
        return
      }

      const invitationData = data[0]
      console.log('Found invitation:', invitationData)

      // Check status
      if (invitationData.status === 'accepted') {
        console.log('Invitation already accepted')
        setError('This invitation has already been accepted. Please sign in to access the project.')
        setLoading(false)
        return
      }

      if (invitationData.status !== 'pending') {
        console.log('Invitation status:', invitationData.status)
        setError('This invitation is no longer valid (status: ' + invitationData.status + ')')
        setLoading(false)
        return
      }

      // Check if expired (7 days)
      const createdDate = new Date(invitationData.created_at)
      const now = new Date()
      const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24)

      console.log('Invitation age (days):', diffDays)

      if (diffDays > 7) {
        console.log('Invitation expired')
        setError('This invitation has expired. Please ask the project owner to send a new invitation.')
        setLoading(false)
        return
      }

      setInvitation(invitationData)
      setEmail(invitationData.email)

      // Check if user already exists with this email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', invitationData.email)
        .single()

      console.log('Existing user:', existingUser)

      if (existingUser) {
        setAuthMode('signin')
      } else {
        setAuthMode('signup')
      }

      setLoading(false)
    } catch (err) {
      console.error('Exception in fetchInvitation:', err)
      setError('Failed to load invitation: ' + err.message)
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Signing up with email:', email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { full_name: fullName }
        }
      })

      console.log('Sign up result:', authData, authError)

      if (authError) throw authError

      await joinProject(authData.user.id)
      setSuccess(true)
    } catch (err) {
      console.error('Error signing up:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Signing in with email:', email)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      console.log('Sign in result:', authData, authError)

      if (authError) throw authError

      await joinProject(authData.user.id)
      setSuccess(true)
    } catch (err) {
      console.error('Error signing in:', err)
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const joinProject = async (userId) => {
    try {
      console.log('Joining project:', invitation.project_id, 'for user:', userId)

      // Add user to project_members
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([{
          project_id: invitation.project_id,
          user_id: userId,
          email: email,
          role: invitation.role,
          status: 'active'
        }])

      console.log('Member insert result:', memberError)

      if (memberError) throw memberError

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      console.log('Invitation update result:', inviteError)

      if (inviteError) throw inviteError
    } catch (err) {
      console.error('Error joining project:', err)
      throw err
    }
  }

  const handleGoToLogin = () => {
    navigate('/login')
  }

  const handleGoToDashboard = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h1>
          <p className="text-gray-500 mb-6">
            You have successfully joined the project.
          </p>
          <button 
            onClick={handleGoToDashboard}
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={handleGoToLogin}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Project</h1>
          <p className="text-gray-500">
            You have been invited to join as a <strong>{invitation?.role}</strong>
          </p>
        </div>

        {authMode === 'signup' ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account & Join'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <button type="button" onClick={() => setAuthMode('signin')} className="text-purple-600 hover:underline">
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In & Join Project'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button type="button" onClick={() => setAuthMode('signup')} className="text-purple-600 hover:underline">
                Create Account
              </button>
            </p>
          </form>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default AcceptInvitation
