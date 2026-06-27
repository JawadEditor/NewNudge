import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase.js'

const TicketComments = ({ ticketId, currentUser }) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const fileInputRef = useRef(null)
  const commentsEndRef = useRef(null)

  useEffect(() => {
    fetchComments()
  }, [ticketId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:user_id (email),
          attachments:ticket_attachments (*)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() && attachments.length === 0) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const commentData = {
        ticket_id: ticketId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo?.id || null
      }

      const { data: comment, error } = await supabase
        .from('ticket_comments')
        .insert(commentData)
        .select()
        .single()

      if (error) throw error

      // Upload attachments if any
      if (attachments.length > 0) {
        await uploadAttachments(comment.id, attachments)
      }

      // Add to local state
      setComments(prev => [...prev, { ...comment, user: { email: user.email }, attachments: [] }])
      setNewComment('')
      setAttachments([])
      setReplyTo(null)
      scrollToBottom()
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadAttachments = async (commentId, files) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      for (const file of files) {
        const filePath = `tickets/${ticketId}/comments/${commentId}/${Date.now()}_${file.name}`
        
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(filePath)

        await supabase
          .from('ticket_attachments')
          .insert({
            comment_id: commentId,
            ticket_id: ticketId,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user.id
          })
      }
    } catch (error) {
      console.error('Error uploading attachments:', error)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setAttachments(prev => [...prev, ...files])
    fileInputRef.current.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('ticket_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    }
  }

  const handleEditComment = async (commentId, newContent) => {
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: newContent, updated_at: new Date().toISOString() } : c
      ))
      setEditingComment(null)
    } catch (error) {
      console.error('Error editing comment:', error)
      alert('Failed to edit comment')
    }
  }

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.startsWith('video/')) return '🎬'
    if (fileType.startsWith('audio/')) return '🎵'
    return '📎'
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Comments</h3>

      {/* Comment List */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No comments yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {comment.user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.user?.email?.split('@')[0] || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {comment.user_id === currentUser?.id && (
                        <>
                          <button
                            onClick={() => setEditingComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-blue-500 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setReplyTo(comment)}
                        className="p-1 text-gray-400 hover:text-purple-500 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {editingComment === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        defaultValue={comment.content}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingComment(null)
                          if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault()
                            handleEditComment(comment.id, e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            const textarea = e.target.parentElement.previousElementSibling
                            handleEditComment(comment.id, textarea.value)
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  )}

                  {/* Attachments */}
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comment.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
                        >
                          <span>{getFileIcon(attachment.file_type)}</span>
                          <span className="text-gray-700">{attachment.file_name}</span>
                          <span className="text-xs text-gray-400">({formatFileSize(attachment.file_size)})</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {reply.user?.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">
                              {reply.user?.email?.split('@')[0] || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded-lg">
          <span className="text-sm text-purple-600">Replying to {replyTo.user?.email?.split('@')[0]}</span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment... (Shift+Enter for new line)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmitComment(e)
              }
            }}
          />
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <span>{getFileIcon(file.type)}</span>
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="text-xs text-gray-400">Max 10MB per file</span>
          </div>
          <button
            type="submit"
            disabled={submitting || (!newComment.trim() && attachments.length === 0)}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TicketComments