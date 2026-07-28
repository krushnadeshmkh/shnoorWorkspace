import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { emailAPI } from '../../api/emails'
import { format } from 'date-fns'
import { 
  FiArrowLeft, FiCornerLeftUp, FiCornerUpRight, FiStar, 
  FiArchive, FiTrash2, FiAlertCircle, FiPaperclip, FiDownload,
  FiFlag, FiMail, FiTag, FiPlus, FiX
} from 'react-icons/fi'
import { toast } from 'react-toastify'

const AdminEmailView = () => {
  const { emailId } = useParams()
  const navigate = useNavigate()
  const [email, setEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [labels, setLabels] = useState([])
  const [showLabelModal, setShowLabelModal] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState([])

  useEffect(() => {
    fetchEmail()
    fetchLabels()
  }, [emailId])

  const fetchEmail = async () => {
    try {
      const response = await emailAPI.getEmail(emailId)
      setEmail(response)
      if (response.labels) {
        setSelectedLabels(response.labels.map(l => l.id))
      }
    } catch (error) {
      console.error('Error fetching email:', error)
      toast.error('Failed to load email')
      navigate('/admin/inbox')
    } finally {
      setLoading(false)
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await emailAPI.getLabels()
      setLabels(response || [])
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }

  const handleToggleLabel = async (labelId) => {
    try {
      if (selectedLabels.includes(labelId)) {
        await emailAPI.removeLabel(emailId, labelId)
        setSelectedLabels(prev => prev.filter(id => id !== labelId))
        toast.success('Label removed')
      } else {
        await emailAPI.applyLabel(emailId, labelId)
        setSelectedLabels(prev => [...prev, labelId])
        toast.success('Label applied')
      }
      fetchEmail()
    } catch (error) {
      toast.error('Failed to update label')
    }
  }

  const handleReply = () => {
    navigate(`/admin/compose?replyTo=${emailId}`)
  }

  const handleReplyAll = () => {
    navigate(`/admin/compose?replyAll=${emailId}`)
  }

  const handleForward = () => {
    navigate(`/admin/compose?forward=${emailId}`)
  }

  const handleToggleStar = async () => {
    try {
      await emailAPI.toggleStarred(emailId)
      setEmail(prev => ({ ...prev, is_starred: !prev.is_starred }))
      toast.success(email.is_starred ? 'Removed from starred' : 'Starred')
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleToggleImportant = async () => {
    try {
      await emailAPI.toggleImportant(emailId)
      setEmail(prev => ({ ...prev, is_important: !prev.is_important }))
      toast.success(email.is_important ? 'Removed from important' : 'Marked as important')
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleMarkUnread = async () => {
    try {
      await emailAPI.markAsUnread(emailId)
      toast.success('Marked as unread')
      navigate('/admin/inbox')
    } catch (error) {
      toast.error('Failed to mark as unread')
    }
  }

  const handleArchive = async () => {
    try {
      await emailAPI.toggleArchive(emailId)
      toast.success('Email archived')
      navigate('/admin/inbox')
    } catch (error) {
      toast.error('Failed to archive')
    }
  }

  const handleDelete = async () => {
    try {
      await emailAPI.deleteEmail(emailId)
      toast.success('Email moved to trash')
      navigate('/admin/inbox')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleSpam = async () => {
    try {
      await emailAPI.toggleSpam(emailId)
      toast.success('Marked as spam')
      navigate('/admin/inbox')
    } catch (error) {
      toast.error('Failed to mark as spam')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!email) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-gray-500">Email not found</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1 md:space-x-2 min-w-0">
            <button
              onClick={() => navigate('/admin/inbox')}
              className="p-1.5 md:p-2 text-gray-500 hover:text-navy rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <FiArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h2 className="text-base md:text-xl font-semibold text-navy truncate">{email.subject || '(no subject)'}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-0.5 md:gap-1">
            <button
              onClick={handleToggleStar}
              className={`p-1.5 md:p-2 rounded-lg hover:bg-gray-100 ${email.is_starred ? 'text-yellow-400' : 'text-gray-400'}`}
            >
              <FiStar className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
            <button
              onClick={handleToggleImportant}
              className={`p-1.5 md:p-2 rounded-lg hover:bg-gray-100 ${email.is_important ? 'text-red-500' : 'text-gray-400'}`}
            >
              <FiFlag className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setShowLabelModal(true)}
              className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Manage labels"
            >
              <FiTag className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
            <button
              onClick={handleMarkUnread}
              className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Mark as unread"
            >
              <FiMail className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
            <button
              onClick={handleArchive}
              className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <FiArchive className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
            <button
              onClick={handleSpam}
              className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <FiAlertCircle className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
            >
              <FiTrash2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                <span className="text-navy font-semibold text-xs md:text-base">
                  {email.sender_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-navy text-sm md:text-base truncate">{email.sender_name}</p>
                <p className="text-xs md:text-sm text-gray-500 truncate">{email.sender_email}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs md:text-sm text-gray-500">
                {format(new Date(email.created_at), 'PPP')}
              </p>
              <p className="text-[10px] md:text-xs text-gray-400">
                {format(new Date(email.created_at), 'p')}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs md:text-sm text-gray-500 break-all">
            To: {email.receiver_email}
          </div>
          {email.is_important && (
            <div className="mt-2">
              <span className="px-2 py-0.5 text-[10px] md:text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1 w-fit">
                <FiFlag className="w-2.5 h-2.5 md:w-3 md:h-3" />
                Important
              </span>
            </div>
          )}
          {email.labels && email.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {email.labels.map((label) => (
                <span
                  key={label.id}
                  className="px-1.5 md:px-2 py-0.5 text-[9px] md:text-xs rounded-full"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-3 md:px-6 py-3 md:py-4">
          <div 
            className="prose prose-sm md:prose max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: email.content || '<p class="text-gray-500">No content</p>' }}
          />
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200">
            <p className="text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Attachments</p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {email.attachments.map((att, index) => (
                <div key={index} className="flex items-center space-x-1.5 md:space-x-2 bg-gray-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                  <FiPaperclip className="text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm text-gray-600 truncate max-w-[80px] md:max-w-[150px]">{att.file_name}</span>
                  <button className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                    <FiDownload className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {email.replies && email.replies.length > 0 && (
          <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200">
            <p className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">Replies</p>
            <div className="space-y-3 md:space-y-4">
              {email.replies.map((reply, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 md:mb-2 gap-1">
                    <div className="flex items-center space-x-1.5 md:space-x-2">
                      <span className="font-medium text-navy text-sm md:text-base">{reply.sender_name}</span>
                      <span className="text-[10px] md:text-xs text-gray-400">
                        {format(new Date(reply.created_at), 'PPp')}
                      </span>
                    </div>
                  </div>
                  <div 
                    className="text-xs md:text-sm prose max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: reply.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={handleReply}
            className="btn-primary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
          >
            <FiCornerLeftUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Reply
          </button>
          <button
            onClick={handleReplyAll}
            className="btn-secondary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
          >
            <FiCornerLeftUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Reply All
          </button>
          <button
            onClick={handleForward}
            className="btn-secondary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
          >
            <FiCornerUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Forward
          </button>
        </div>
      </div>

      {showLabelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-soft p-4 md:p-6 max-w-md w-full mx-2 md:mx-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-navy">Manage Labels</h3>
              <button
                onClick={() => setShowLabelModal(false)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FiX className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="space-y-1.5 md:space-y-2 max-h-48 md:max-h-60 overflow-y-auto">
              {labels.length === 0 ? (
                <p className="text-center text-gray-500 py-3 md:py-4 text-sm">No labels created yet</p>
              ) : (
                labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleToggleLabel(label.id)}
                    className={`flex items-center space-x-2 md:space-x-3 w-full p-2 md:p-3 rounded-lg transition-colors text-sm ${
                      selectedLabels.includes(label.id)
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex-shrink-0 ${
                        selectedLabels.includes(label.id) ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: label.color }}
                    ></div>
                    <span className="flex-1 text-left text-xs md:text-sm font-medium text-gray-700">
                      {label.name}
                    </span>
                    {selectedLabels.includes(label.id) && (
                      <span className="text-primary-600 text-xs md:text-sm">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/admin/labels')}
                className="text-xs md:text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Manage Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminEmailView