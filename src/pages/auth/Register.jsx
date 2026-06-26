import { useState } from 'react'
import { supabase } from '../../services/supabase.js'

const Register = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!fullName || !email || !username || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service')
      return
    }

    setLoading(true)

    // Sign up with Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        }
      }
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setError('✅ Account created successfully! You can now login.')
      // Clear form
      setFullName('')
      setEmail('')
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setAgreeTerms(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0fdfa 100%)' }}>
      
      {/* Background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-50" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 60%, #c4b5fd 100%)' }}></div>
      <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-40" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)' }}></div>
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full opacity-40" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #5eead4 50%, #99f6e4 100%)' }}></div>
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-30" style={{ background: 'linear-gradient(135deg, #ddd6fe 0%, #e9d5ff 100%)' }}></div>

      {/* Floating dots */}
      <div className="absolute top-[15%] left-[20%] w-3 h-3 rounded-full bg-purple-400 opacity-50 animate-pulse"></div>
      <div className="absolute top-[25%] right-[25%] w-2 h-2 rounded-full bg-teal-400 opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-[30%] left-[25%] w-3 h-3 rounded-full bg-purple-300 opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[40%] right-[20%] w-2 h-2 rounded-full bg-teal-300 opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10">
          
          {/* Error/Success message */}
          {error && (
            <div className={`px-4 py-3 rounded-xl mb-4 text-sm ${error.includes('✅') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {error.replace('✅ ', '')}
            </div>
          )}

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <svg width="80" height="70" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 30C15 21.7157 21.7157 15 30 15H85C93.2843 15 100 21.7157 100 30V55C100 63.2843 93.2843 70 85 70H75L55 90V70H30C21.7157 70 15 63.2843 15 55V30Z" fill="#7c3aed"/>
                <circle cx="100" cy="42.5" r="12" fill="#7c3aed"/>
                <rect x="32" y="32" width="44" height="5" rx="2.5" fill="white" opacity="0.85"/>
                <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" opacity="0.6"/>
                <rect x="32" y="56" width="28" height="5" rx="2.5" fill="white" opacity="0.4"/>
                <path d="M95 30C95 30 105 22 118 25C124 26 126 32 126 38C126 44 124 50 118 51C105 54 95 46 95 46" stroke="#14b8a6" strokeWidth="8" strokeLinecap="round" fill="none"/>
                <circle cx="126" cy="38" r="5" fill="#14b8a6"/>
                <path d="M133 28C136 31 138 35 138 38" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
                <path d="M133 48C136 45 138 41 138 38" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
                <path d="M140 22C144 27 146 33 146 38" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
                <path d="M140 54C144 49 146 43 146 38" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
              </svg>
            </div>
            <div className="relative">
              <span className="text-3xl font-bold tracking-tight" style={{ color: '#1e1b4b' }}>nudge</span>
              <span className="absolute -right-3 top-1 w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-0.5 rounded-full" style={{ background: '#a78bfa' }}></div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#6b7280' }}>Tickets Management System</p>
              <div className="w-6 h-0.5 rounded-full" style={{ background: '#a78bfa' }}></div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account 👋</h1>
            <p className="text-gray-500 text-sm">Join Nudge and start managing your projects</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                {showPassword ? (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>

            {/* Agree Terms */}
            <div className="flex items-center gap-2">
              <div 
                className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition ${agreeTerms ? 'bg-purple-600' : 'bg-gray-200'}`}
                onClick={() => setAgreeTerms(!agreeTerms)}
              >
                {agreeTerms && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600">
                I agree to the <a href="#" className="font-medium" style={{ color: '#7c3aed' }}>Terms of Service</a> and <a href="#" className="font-medium" style={{ color: '#7c3aed' }}>Privacy Policy</a>
              </span>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' }}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-400">or sign up with</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Login */}
          <div className="flex gap-3 justify-center">
            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:shadow-md transition hover:border-gray-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:shadow-md transition hover:border-gray-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                <path fill="#7fba00" d="M13 1h10v10H13z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:shadow-md transition hover:border-gray-300">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button 
                onClick={onSwitchToLogin}
                className="font-medium bg-transparent border-none cursor-pointer" 
                style={{ color: '#7c3aed' }}
              >
                Login
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Register