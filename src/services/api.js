import { supabase } from './supabase.js'

// ============================================
// PROJECTS API
// ============================================
export const projectsApi = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getProject(id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async createProject(projectData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...projectData, created_by: user.id }])
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ============================================
// TICKETS API
// ============================================
export const ticketsApi = {
  async getAllTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getProjectTickets(projectId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async createTicket(ticketData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('tickets')
      .insert([{ ...ticketData, created_by: user.id }])
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ============================================
// MEMBERS API
// ============================================
export const membersApi = {
  async getProjectMembers(projectId) {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, profiles(*)')
      .eq('project_id', projectId)
      .eq('status', 'active')
    if (error) throw error
    return data || []
  },

  async getAllMembers() {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, profiles(*), projects(*)')
      .eq('status', 'active')
    if (error) throw error
    return data || []
  }
}

// ============================================
// DASHBOARD API
// ============================================
export const dashboardApi = {
  async getStats() {
    const { data: projects } = await supabase.from('projects').select('id')
    const { data: tickets } = await supabase.from('tickets').select('status, priority')
    const { data: recentTickets } = await supabase
      .from('tickets')
      .select('*, projects(id, name)')
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      totalProjects: projects?.length || 0,
      totalTickets: tickets?.length || 0,
      openTickets: tickets?.filter(t => t.status !== 'Done').length || 0,
      completedTickets: tickets?.filter(t => t.status === 'Done').length || 0,
      highPriorityTickets: tickets?.filter(t => t.priority === 'High').length || 0,
      recentTickets: recentTickets || []
    }
  }
}