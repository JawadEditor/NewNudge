import { useState } from 'react'

const Sidebar = ({ activeItem = 'dashboard', userName = 'Jawad Ali', userRole = 'Admin', onLogout, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    id: 'all-tickets',
    label: 'All Tickets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    id: 'all-members',
    label: 'All Members',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  }
]

  return (
    <aside className={`bg-white border-r border-gray-100 min-h-screen hidden lg:flex flex-col fixed left-0 top-0 z-10 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo Section - CLICKABLE */}
      <div 
        className="px-6 py-5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => onNavigate && onNavigate('dashboard')}
      >
        <div className="flex items-center gap-2">
          {/* IMAGE LOGO - Notextlogo.png */}
          <div className="flex-shrink-0 w-60 h-50">
            <img 
              src="/Notextlogo.png" 
              alt="Nudge" 
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div>
             
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="px-4 py-4 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate && onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition ${
              activeItem === item.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
{/* Settings Button */}
<div className="px-4 py-2 border-t border-gray-100">
  <button
    onClick={() => onNavigate && onNavigate('settings')}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
      activeItem === 'settings'
        ? 'bg-purple-600 text-white'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    {!isCollapsed && <span className="font-medium">Settings</span>}
  </button>
</div>

{/* User */}
<div className="px-4 py-4 border-t border-gray-100"></div>
      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div 
  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer"
  onClick={() => onNavigate && onNavigate('profile')}
>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {userName.charAt(0)}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar