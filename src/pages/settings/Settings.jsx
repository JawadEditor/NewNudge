import { useState } from 'react'
import NotificationDropdown from "../../components/NotificationDropdown"

const Settings = ({ onBack, onLogout }) => {
  const [siteName, setSiteName] = useState('Nudge Platform')
  const [siteLanguage, setSiteLanguage] = useState('English (US)')
  const [dateFormat, setDateFormat] = useState('May 20, 2024 (MMM D, YYYY)')
  const [timeZone, setTimeZone] = useState('(GMT+05:00) Asia/Karachi')
  const [weekStartsOn, setWeekStartsOn] = useState('Monday')
  const [theme, setTheme] = useState('light')
  const [defaultLandingPage, setDefaultLandingPage] = useState('Dashboard')
  const [itemsPerPage, setItemsPerPage] = useState('25')
  const [enableSounds, setEnableSounds] = useState(true)

  const handleSaveChanges = () => {
    // Save to localStorage or Supabase
    alert('Settings saved successfully!')
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

      <main className="p-6 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-500">Manage your account, preferences and system settings.</p>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">General Settings</h2>
          
          <div className="space-y-6">
            {/* Site Name */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-4 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Site Name</p>
                  <p className="text-sm text-gray-500">This name will appear on the application.</p>
                </div>
              </div>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Site Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Site Language</p>
                  <p className="text-sm text-gray-500">Choose your preferred language.</p>
                </div>
              </div>
              <select
                value={siteLanguage}
                onChange={(e) => setSiteLanguage(e.target.value)}
                className="w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Urdu</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            {/* Date Format */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Date Format</p>
                  <p className="text-sm text-gray-500">Set the date format used across the application.</p>
                </div>
              </div>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option>May 20, 2024 (MMM D, YYYY)</option>
                <option>20/05/2024 (DD/MM/YYYY)</option>
                <option>05/20/2024 (MM/DD/YYYY)</option>
                <option>2024-05-20 (YYYY-MM-DD)</option>
              </select>
            </div>

            {/* Time Zone */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Time Zone</p>
                  <p className="text-sm text-gray-500">Set your default time zone.</p>
                </div>
              </div>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option>(GMT+05:00) Asia/Karachi</option>
                <option>(GMT+00:00) UTC</option>
                <option>(GMT-05:00) Eastern Time</option>
                <option>(GMT+01:00) Central European Time</option>
              </select>
            </div>

            {/* Week Starts On */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Week Starts On</p>
                  <p className="text-sm text-gray-500">Choose the day your week starts.</p>
                </div>
              </div>
              <select
                value={weekStartsOn}
                onChange={(e) => setWeekStartsOn(e.target.value)}
                className="w-64 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option>Monday</option>
                <option>Sunday</option>
                <option>Saturday</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveChanges}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Appearance</h2>
          <p className="text-sm text-gray-500 mb-6">Customize the look and feel of the application.</p>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Light */}
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                theme === 'light' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  theme === 'light' ? 'border-purple-500' : 'border-gray-300'
                }`}>
                  {theme === 'light' && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
                </div>
              </div>
              <p className="font-medium text-gray-900">Light</p>
              <p className="text-sm text-gray-500">Use light theme</p>
            </button>

            {/* Dark */}
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                theme === 'dark' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  theme === 'dark' ? 'border-purple-500' : 'border-gray-300'
                }`}>
                  {theme === 'dark' && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
                </div>
              </div>
              <p className="font-medium text-gray-900">Dark</p>
              <p className="text-sm text-gray-500">Use dark theme</p>
            </button>

            {/* System */}
            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                theme === 'system' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  theme === 'system' ? 'border-purple-500' : 'border-gray-300'
                }`}>
                  {theme === 'system' && <div className="w-3 h-3 rounded-full bg-purple-500"></div>}
                </div>
              </div>
              <p className="font-medium text-gray-900">System</p>
              <p className="text-sm text-gray-500">Use system theme</p>
            </button>
          </div>
        </div>

        {/* Other Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Other Preferences</h2>
          
          <div className="space-y-6">
            {/* Default Landing Page */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Default Landing Page</p>
                  <p className="text-sm text-gray-500">Choose your default landing page after logging in.</p>
                </div>
              </div>
              <select
                value={defaultLandingPage}
                onChange={(e) => setDefaultLandingPage(e.target.value)}
                className="w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option>Dashboard</option>
                <option>Projects</option>
              </select>
            </div>

            {/* Items Per Page */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Items Per Page</p>
                  <p className="text-sm text-gray-500">Choose how many items to show in lists.</p>
                </div>
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(e.target.value)}
                className="w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>

            {/* Enable Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Enable Sounds</p>
                  <p className="text-sm text-gray-500">Play sounds for notifications and updates.</p>
                </div>
              </div>
              <button
                onClick={() => setEnableSounds(!enableSounds)}
                className={`w-11 h-6 rounded-full transition ${enableSounds ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition ${enableSounds ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default Settings