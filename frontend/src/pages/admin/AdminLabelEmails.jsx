import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { emailAPI } from '../../api/emails'
import { formatDistanceToNow } from 'date-fns'
import { 
  FiInbox, FiPaperclip, FiTag, FiStar, FiArchive, 
  FiTrash2, FiAlertCircle, FiFlag, FiChevronLeft
} from 'react-icons/fi'
import { toast } from 'react-toastify'

const AdminLabelEmails = () => {
  const { labelId } = useParams()
  const navigate = useNavigate()
  const [emails, setEmails] = useState([])
  const [label, setLabel] = useState(null)
  const [allLabels, setAllLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [containerHeight, setContainerHeight] = useState('100%')
  const containerRef = useRef(null)

  useEffect(() => {
    fetchData()
    calculateHeight()
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [labelId])

  const calculateHeight = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const parentRect = containerRef.current.parentElement?.getBoundingClientRect()
      if (parentRect) {
        const availableHeight = window.innerHeight - rect.top - 20
        setContainerHeight(`${availableHeight}px`)
      }
    }
  }

  const fetchData = async () => {
    try {
      const labels = await emailAPI.getLabels()
      setAllLabels(labels)
      
      const foundLabel = labels.find(l => l.id === parseInt(labelId))
      setLabel(foundLabel)
      
      const response = await emailAPI.getInbox({ limit: 100 })
      const filtered = response.emails.filter(e => 
        e.labels && e.labels.some(l => l.id === parseInt(labelId))
      )
      setEmails(filtered)
    } catch (error) {
      console.error('Error fetching label emails:', error)
      toast.error('Failed to load emails')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStar = async (emailId, isStarred) => {
    try {
      await emailAPI.toggleStarred(emailId)
      setEmails(prev => prev.map(email =>
        email.id === emailId ? { ...email, is_starred: !isStarred } : email
      ))
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleToggleImportant = async (emailId, isImportant) => {
    try {
      await emailAPI.toggleImportant(emailId)
      setEmails(prev => prev.map(email =>
        email.id === emailId ? { ...email, is_important: !isImportant } : email
      ))
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const handleArchive = async (emailId) => {
    try {
      await emailAPI.toggleArchive(emailId)
      setEmails(prev => prev.filter(email => email.id !== emailId))
      toast.success('Email archived')
    } catch (error) {
      toast.error('Failed to archive')
    }
  }

  const handleDelete = async (emailId) => {
    try {
      await emailAPI.deleteEmail(emailId)
      setEmails(prev => prev.filter(email => email.id !== emailId))
      toast.success('Email moved to trash')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const handleSpam = async (emailId) => {
    try {
      await emailAPI.toggleSpam(emailId)
      setEmails(prev => prev.filter(email => email.id !== emailId))
      toast.success('Marked as spam')
    } catch (error) {
      toast.error('Failed to mark as spam')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div ref={containerRef} className="bg-white rounded-xl shadow-card overflow-hidden flex flex-col" style={{ height: containerHeight }}>
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center space-x-1.5 md:space-x-3 min-w-0">
            <button
              onClick={() => navigate('/admin/inbox')}
              className="p-1.5 md:p-2 text-gray-500 hover:text-navy rounded-lg hover:bg-gray-100 flex-shrink-0"
              title="Back to Inbox"
            >
              <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {label && (
              <div
                className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: label.color }}
              ></div>
            )}
            <h2 className="text-base md:text-xl font-semibold text-navy truncate">
              {label?.name || 'Label'}
            </h2>
            <span className="text-xs md:text-sm text-gray-500 flex-shrink-0">({emails.length})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 md:py-16 text-gray-500">
                <div className="text-4xl md:text-6xl mb-3 md:mb-4">📭</div>
                <p className="text-base md:text-lg font-medium">No conversations with this label</p>
                <p className="text-xs md:text-sm">Emails with this label will appear here</p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  className={`flex flex-wrap items-start md:items-center px-3 md:px-6 py-3 md:py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !email.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => navigate(`/admin/email/${email.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStar(email.id, email.is_starred)
                        }}
                        className={`text-base md:text-xl ${
                          email.is_starred ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                        } flex-shrink-0`}
                      >
                        ★
                      </button>
                      <span className={`font-medium truncate text-sm md:text-base ${!email.is_read ? 'font-semibold' : ''}`}>
                        {email.sender_name}
                      </span>
                      {!email.is_read && (
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                      )}
                      {email.is_important && (
                        <span className="px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                          <FiFlag className="w-2 h-2 md:w-3 md:h-3" />
                          Important
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                      <span className={`truncate text-sm ${!email.is_read ? 'font-medium' : 'text-gray-600'}`}>
                        {email.subject || '(no subject)'}
                      </span>
                      <span className="text-xs md:text-sm text-gray-400 truncate">
                        - {email.content?.replace(/<[^>]*>/g, '').substring(0, 60)}
                      </span>
                    </div>
                    {email.labels && email.labels.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                        {email.labels.map((l, idx) => (
                          <span 
                            key={idx}
                            className="px-1 md:px-2 py-0.5 text-[8px] md:text-xs rounded-full flex items-center gap-0.5 md:gap-1"
                            style={{ 
                              backgroundColor: `${l.color}20`,
                              color: l.color 
                            }}
                          >
                            <FiTag className="w-2 h-2 md:w-3 md:h-3" />
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1.5 md:space-x-3 ml-2 md:ml-4 flex-shrink-0">
                    {email.has_attachments && (
                      <FiPaperclip className="text-gray-400 text-[10px] md:text-sm" />
                    )}
                    <span className="text-[10px] md:text-sm text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 md:gap-1 ml-1 md:ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleImportant(email.id, email.is_important)
                      }}
                      className={`p-1 md:p-1.5 rounded-lg hover:bg-gray-100 ${
                        email.is_important ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                      }`}
                      title={email.is_important ? 'Remove from important' : 'Mark as important'}
                    >
                      <FiFlag className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(email.id)}
                      className="p-1 md:p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Archive"
                    >
                      <FiArchive className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleSpam(email.id)}
                      className="p-1 md:p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Mark as spam"
                    >
                      <FiAlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(email.id)}
                      className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminLabelEmails