<div className="space-y-4">
  {projects.length > 0 ? projects.map((project, i) => (
    <div 
      key={project.id} 
      onClick={() => onViewProject(project.id)}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-xl ${getProjectColor(i)} bg-opacity-10 flex items-center justify-center text-2xl`}>
        {getProjectIcon(i)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{project.name}</h3>
        <p className="text-sm text-gray-500 truncate">{project.description}</p>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${getProjectColor(i)}`} style={{ width: `${project.progress}%` }}></div>
          </div>
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
            +{5}
          </div>
        </div>
      </div>
      <div className="text-center min-w-[60px]">
        <p className="text-lg font-bold text-gray-900">{24 - i * 3}</p>
        <p className="text-xs text-gray-500">Tickets</p>
      </div>
      <button className="p-2 hover:bg-gray-100 rounded-lg">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  )) : (
    // Mock data with onClick
    [
      { name: 'Nudge Platform', desc: 'Manage all platform development tasks', progress: 75, tickets: 24 },
      { name: 'Website Redesign', desc: 'Redesign and improve user experience', progress: 60, tickets: 18 },
      { name: 'Mobile App', desc: 'Build and maintain mobile application', progress: 45, tickets: 15 },
      { name: 'Marketing Site', desc: 'Marketing website and landing pages', progress: 90, tickets: 9 },
      { name: 'Internal Tools', desc: 'Internal tools and utilities', progress: 30, tickets: 7 },
    ].map((project, i) => (
      <div 
        key={i} 
        onClick={() => onViewProject(i + 1)}
        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-xl ${getProjectColor(i)} bg-opacity-10 flex items-center justify-center text-2xl`}>
          {getProjectIcon(i)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 truncate">{project.desc}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${getProjectColor(i)}`} style={{ width: `${project.progress}%` }}></div>
            </div>
            <span className="text-xs text-gray-500">{project.progress}%</span>
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
          <p className="text-lg font-bold text-gray-900">{project.tickets}</p>
          <p className="text-xs text-gray-500">Tickets</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    ))
  )}
</div>