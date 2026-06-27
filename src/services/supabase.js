import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Critical Error: Missing Supabase configuration')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file')
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// ============================================
// NOTIFICATION HELPER FUNCTIONS
// ============================================

/**
 * Send a notification to all members of a project
 */
export const notifyProjectMembers = async (projectId, title, message, type, senderId, data = {}) => {
  try {
    // 1. Get all members of the project
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)

    if (membersError) throw membersError

    // 2. Get the project owner (creator)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

    // 3. Combine members + owner (remove duplicates)
    const userIds = new Set()
    members.forEach(m => userIds.add(m.user_id))
    if (project?.created_by) userIds.add(project.created_by)
    
    // Remove the sender (they don't need to be notified of their own action)
    if (senderId) userIds.delete(senderId)

    // 4. Create notifications for each user
    const notifications = Array.from(userIds).map(userId => ({
      user_id: userId,
      project_id: projectId,
      type: type || 'general',
      title: title,
      message: message,
      data: data,
      read: false,
      created_at: new Date().toISOString()
    }))

    if (notifications.length === 0) return

    // 5. Insert notifications
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) throw insertError

    console.log(`✅ Notifications sent to ${notifications.length} users for project ${projectId}`)
  } catch (error) {
    console.error('Error sending notifications:', error)
  }
}

/**
 * Send a notification to a single user
 */
export const notifyUser = async (userId, projectId, title, message, type, data = {}) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        project_id: projectId,
        type: type || 'general',
        title: title,
        message: message,
        data: data,
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) throw error
    console.log(`✅ Notification sent to user ${userId}`)
  } catch (error) {
    console.error('Error sending notification:', error)
  }
}

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        projects:project_id (id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

/**
 * Get unread count for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}