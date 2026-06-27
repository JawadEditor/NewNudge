import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AcceptInvitation from './pages/team/AcceptInvitation.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
)
