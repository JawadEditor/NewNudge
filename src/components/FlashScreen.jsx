import { useState, useEffect } from 'react'

const FlashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setFadeOut(true)
            setTimeout(onComplete, 600)
          }, 400)
          return 100
        }
        return prev + Math.random() * 12 + 4
      })
    }, 180)
    return () => clearInterval(interval)
  }, [onComplete])

  const fadeClass = fadeOut ? 'opacity-0' : 'opacity-100'

  return (
    <div 
      className={'fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ' + fadeClass}
      style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #ffffff 50%, #f0fdfa 100%)' }}
    >
      {/* Top-left purple blob */}
      <div 
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-40"
        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}
      ></div>
      
      {/* Top-right light blob */}
      <div 
        className="absolute -top-10 -right-10 w-60 h-60 rounded-full opacity-30"
        style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}
      ></div>

      {/* Bottom-right teal blob */}
      <div 
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-30"
        style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #5eead4 100%)' }}
      ></div>

      {/* Bottom-left light blob */}
      <div 
        className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-25"
        style={{ background: 'linear-gradient(135deg, #ddd6fe 0%, #e9d5ff 100%)' }}
      ></div>

      {/* Floating dots */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-purple-400 opacity-60 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-teal-400 opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-purple-300 opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-1 h-1 rounded-full bg-teal-300 opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-1/4 right-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 opacity-40 animate-pulse" style={{ animationDelay: '0.8s' }}></div>

      {/* Dotted pattern top-right */}
      <div className="absolute top-20 right-20 grid grid-cols-4 gap-2 opacity-20">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-purple-400"></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        
       {/* Logo Icon */}
        <div className="mb-6 relative">
          <img src="/logo.png" alt="Nudge" className="w-100 h-auto mx-auto" />
        </div>



      
        {/* Loading dots */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-300 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Progress Bar */}
        <div className="w-72">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)'
              }}
            ></div>
          </div>
        </div>

        {/* Loading text */}
        <p className="mt-4 text-sm" style={{ color: '#6b7280' }}>
          Loading <span className="font-semibold" style={{ color: '#7c3aed' }}>Nudge</span> ...
        </p>
      </div>
    </div>
  )
}

export default FlashScreen