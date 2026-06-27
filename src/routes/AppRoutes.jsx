import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks';

// Layouts
import MainLayout from '../layouts/MainLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ResetPassword from '../pages/auth/ResetPassword';

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard';

// Profile
import Profile from '../pages/profile/Profile';

// Projects
import Projects from '../pages/projects/Projects';
import ProjectsList from '../pages/projects/ProjectsList';
import CreateProject from '../pages/projects/CreateProject';
import ProjectDetails from '../pages/projects/ProjectDetails';
import TeamMembers from '../pages/projects/TeamMembers';
import InviteMembers from '../pages/projects/InviteMembers';

// Team / Invitations
import AcceptInvitation from '../pages/team/AcceptInvitation';

// Settings
import Settings from '../pages/settings/Settings';

// Tickets
import AllTickets from '../pages/tickets/AllTickets';
import CreateTicket from '../pages/tickets/CreateTicket';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes - No auth required */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Accept Invitation - Public route, must be OUTSIDE MainLayout */}
      <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

      {/* Protected Routes - Wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />

        {/* Projects */}
        <Route path="/projects" element={user ? <ProjectsList /> : <Navigate to="/login" />} />
        <Route path="/projects/create" element={user ? <CreateProject /> : <Navigate to="/login" />} />
        <Route path="/projects/:id" element={user ? <ProjectDetails /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/team" element={user ? <TeamMembers /> : <Navigate to="/login" />} />
        <Route path="/projects/:id/invite" element={user ? <InviteMembers /> : <Navigate to="/login" />} />

        {/* Tickets */}
        <Route path="/tickets" element={user ? <AllTickets /> : <Navigate to="/login" />} />
        <Route path="/tickets/create" element={user ? <CreateTicket /> : <Navigate to="/login" />} />

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Route>

      {/* 404 Fallback - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
