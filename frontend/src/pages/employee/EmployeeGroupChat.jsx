import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import EmployeeLayout from '../../components/layout/EmployeeLayout'
import { chatAPI } from '../../api/chat'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'
import {
  FiSend, FiPaperclip, FiArrowLeft, FiMoreVertical,
  FiSmile, FiFile, FiX, FiTrash2, FiCornerUpLeft,
  FiUsers, FiLogOut, FiImage, FiDownload
} from 'react-icons/fi'
import { toast } from 'react-toastify'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const EmployeeGroupChat = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { socket, sendMessage, deleteMessage, sendTyping, addReaction, joinGroup } = useSocket()
  const [messages, setMessages] = useState([])
  const [group, setGroup] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [attachments, setAttachments] = useState([])
  const [replyTo, setReplyTo] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [showMembers, setShowMembers] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [uploading, setUploading] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const emojiPickerRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const msgId = params.get('messageId')
    if (msgId) {
      setHighlightedMessageId(msgId)
      setTimeout(() => {
        const element = document.getElementById(`message-${msgId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.style.backgroundColor = '#fef3c7'
          element.style.transition = 'background-color 0.5s'
          setTimeout(() => {
            element.style.backgroundColor = 'transparent'
          }, 3000)
        }
      }, 500)
    }
  }, [location.search])

  useEffect(() => {
    if (groupId) {
      fetchGroup()
      fetchMessages()
      joinGroup(groupId)
    }
  }, [groupId])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message) => {
      if (String(message.group_id) === String(groupId)) {
        setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message])
      }
    }

    const handleDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    }

    const handleReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, reactions } : msg))
    }

    const handleTyping = ({ groupId: gId, userId, isTyping }) => {
      if (String(gId) !== String(groupId) || userId === user?.id) return
      setTypingUsers(prev => {
        const next = { ...prev }
        if (isTyping) next[userId] = true
        else delete next[userId]
        return next
      })
    }

    socket.on('new-message', handleNewMessage)
    socket.on('message-deleted', handleDeleted)
    socket.on('reaction-updated', handleReaction)
    socket.on('user-typing', handleTyping)

    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('message-deleted', handleDeleted)
      socket.off('reaction-updated', handleReaction)
      socket.off('user-typing', handleTyping)
    }
  }, [socket, groupId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (showEmojiPicker === null) return

    const handleOutsideClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showEmojiPicker])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const fetchGroup = async () => {
    try {
      const data = await chatAPI.getGroup(groupId)
      setGroup(data)
    } catch (error) {
      toast.error('Group not found')
      navigate('/employee/chat')
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await chatAPI.getGroupMessages(groupId, { limit: 100 })
      setMessages(response || [])
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (filePath, fileName) => {
    let cleanPath = filePath
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }
    const baseUrl = 'http://localhost:5000'
    const downloadUrl = `${baseUrl}${cleanPath}`
    window.open(downloadUrl, '_blank')
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() && attachments.length === 0) return

    if (attachments.length > 0) {
      setUploading(true)
      try {
        const saved = await chatAPI.sendGroupMessage(groupId, {
          content: inputMessage,
          parentMessageId: replyTo?.id || null,
          attachments
        })
        setMessages(prev => prev.some(m => m.id === saved.id) ? prev : [...prev, saved])
        setAttachments([])
        setReplyTo(null)
        setInputMessage('')
      } catch (error) {
        toast.error('Failed to send attachment')
      } finally {
        setUploading(false)
      }
      return
    }

    sendMessage({
      groupId,
      content: inputMessage,
      parentMessageId: replyTo?.id || null,
      attachments: []
    })

    setInputMessage('')
    setAttachments([])
    setReplyTo(null)
    sendTyping({ groupId, isTyping: false })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed')
      return
    }
    setAttachments([...attachments, ...files])
    e.target.value = ''
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Delete this message?')) {
      deleteMessage({ messageId, groupId })
      setSelectedMessage(null)
    }
  }

  const handleReaction = (messageId, emoji) => {
    addReaction({ messageId, emoji, groupId })
    setShowEmojiPicker(null)
  }

  const handleReply = (message) => {
    setReplyTo(message)
    inputRef.current?.focus()
  }

  const handleTyping = (e) => {
    setInputMessage(e.target.value)
    sendTyping({ groupId, isTyping: true })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping({ groupId, isTyping: false })
    }, 2000)
  }

  const handleLeaveGroup = async () => {
    if (!window.confirm('Leave this group?')) return
    try {
      await chatAPI.leaveGroup(groupId)
      navigate('/employee/chat')
    } catch (error) {
      toast.error('Failed to leave group')
    }
  }

  const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatDate = (date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  const isOwnMessage = (message) => message.sender_id === user?.id

  const typingLabel = () => {
    const ids = Object.keys(typingUsers)
    if (ids.length === 0) return null
    const names = ids
      .map(id => group?.members?.find(m => String(m.id) === id)?.full_name)
      .filter(Boolean)
    if (names.length === 0) return 'typing...'
    return `${names.join(', ')} typing...`
  }

  const groupMessagesByDate = () => {
    const groups = {}
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </EmployeeLayout>
    )
  }

  if (!group) return null

  const groupedMessages = groupMessagesByDate()

  return (
    <EmployeeLayout>
      <div className="flex flex-col flex-1 min-h-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
        <div className="relative flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-white border-b border-slate-200 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                <button
                  onClick={() => navigate('/employee/chat')}
                  className="p-1 md:p-1.5 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                >
                  <FiArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                </button>
                <div
                  onClick={() => setShowMembers(!showMembers)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white cursor-pointer flex-shrink-0"
                >
                  <FiUsers className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="cursor-pointer min-w-0" onClick={() => setShowMembers(!showMembers)}>
                  <p className="font-semibold text-slate-800 text-sm md:text-base truncate">{group.name}</p>
                  <p className="text-[10px] md:text-xs text-slate-400 truncate">
                    {typingLabel() || `${group.member_count || 0} members`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
              >
                <FiMoreVertical className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 md:p-4 space-y-1.5 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
                  <p className="text-base md:text-lg font-medium">No messages yet</p>
                  <p className="text-xs md:text-sm">Start the conversation in {group.name}</p>
                </div>
              ) : (
                Object.keys(groupedMessages).map((dateKey) => {
                  const dateLabel = formatDate(dateKey)
                  const dayMessages = groupedMessages[dateKey]
                  return (
                    <div key={dateKey}>
                      <div className="flex items-center justify-center my-3 md:my-4">
                        <span className="text-[10px] md:text-xs font-medium text-slate-400 bg-white px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-sm border border-slate-200">
                          {dateLabel}
                        </span>
                      </div>
                      {dayMessages.map((message) => {
                        const isOwn = isOwnMessage(message)
                        const isReply = message.parent_message_id
                        const parentMessage = message.parent_message || (isReply ? messages.find(m => m.id === message.parent_message_id) : null)
                        const showReactions = message.reactions && message.reactions.length > 0
                        const showSender = !isOwn && (dayMessages.indexOf(message) === 0 || dayMessages[dayMessages.indexOf(message) - 1]?.sender_id !== message.sender_id)
                        const isHighlighted = highlightedMessageId === String(message.id)

                        return (
                          <div
                            key={message.id}
                            id={`message-${message.id}`}
                            ref={showEmojiPicker === message.id ? emojiPickerRef : null}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group ${isHighlighted ? 'bg-amber-50 rounded-lg' : ''}`}
                            onMouseEnter={() => setSelectedMessage(message.id)}
                            onMouseLeave={() => setSelectedMessage(null)}
                          >
                            <div className={`max-w-[88%] sm:max-w-[80%] md:max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                              {!isOwn && showSender && (
                                <span className="text-[10px] md:text-xs font-medium text-indigo-500 mb-0.5 ml-1">{message.sender_name}</span>
                              )}

                              {isReply && parentMessage && (
                                <div className="mb-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs border-l-4 border-indigo-500 bg-slate-100 max-w-[180px] sm:max-w-[220px] md:max-w-sm">
                                  <p className="font-medium text-slate-600 truncate">{parentMessage.sender_name}</p>
                                  <p className="text-slate-500 truncate">{parentMessage.content || 'Attachment'}</p>
                                </div>
                              )}

                              <div className={`flex items-end gap-1 md:gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div
                                  className={`relative px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-2xl max-w-full ${
                                    isOwn
                                      ? 'bg-emerald-500 text-white rounded-br-md'
                                      : 'bg-white text-slate-800 rounded-bl-md shadow-sm'
                                  }`}
                                >
                                  {message.content && (
                                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                  )}

                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                      {message.attachments.map((att, idx) => {
                                        const fileUrl = att.file_path || att.file_url
                                        const isImage = att.mime_type?.startsWith('image/')
                                        const isVideo = att.mime_type?.startsWith('video/')
                                        const isAudio = att.mime_type?.startsWith('audio/')
                                        const displayUrl = `http://localhost:5000${fileUrl}`;

                                        return (
                                          <div key={idx} className={`flex items-center gap-1 p-1 rounded-lg ${
                                            isOwn ? 'bg-emerald-600/30' : 'bg-slate-100'
                                          }`}>
                                            {isImage ? (
                                              <div className="relative group">
                                                <img 
                                                  src={displayUrl}
                                                  alt={att.file_name}
                                                  className="max-w-[130px] sm:max-w-[150px] md:max-w-[200px] max-h-[110px] sm:max-h-[120px] md:max-h-[150px] rounded-lg cursor-pointer object-cover"
                                                  onClick={() => window.open(displayUrl, '_blank')}
                                                  onError={(e) => {
                                                    e.target.onerror = null
                                                    e.target.src = ''
                                                    e.target.alt = 'Image not available'
                                                  }}
                                                />
                                                <button
                                                  onClick={() => handleDownload(fileUrl, att.file_name)}
                                                  className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                  <FiDownload className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                                </button>
                                              </div>
                                            ) : isVideo ? (
                                              <div className="relative group">
                                                <video 
                                                  src={displayUrl}
                                                  className="max-w-[130px] sm:max-w-[150px] md:max-w-[200px] max-h-[110px] sm:max-h-[120px] md:max-h-[150px] rounded-lg cursor-pointer"
                                                  controls
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              </div>
                                            ) : isAudio ? (
                                              <audio 
                                                src={displayUrl}
                                                className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px]"
                                                controls
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            ) : (
                                              <div className="flex items-center justify-between w-full gap-1 md:gap-2">
                                                <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                                                  <FiFile className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                                  <span className="text-[10px] md:text-sm truncate">{att.file_name}</span>
                                                  {att.file_size && (
                                                    <span className="text-[8px] md:text-[10px] text-slate-400 flex-shrink-0">
                                                      {(att.file_size / 1024).toFixed(1)} KB
                                                    </span>
                                                  )}
                                                </div>
                                                <button
                                                  onClick={() => handleDownload(fileUrl, att.file_name)}
                                                  className="text-slate-500 hover:text-emerald-600 p-1 rounded-full hover:bg-emerald-50 flex-shrink-0"
                                                >
                                                  <FiDownload className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-end mt-0.5 md:mt-1">
                                    <span className={`text-[8px] md:text-[10px] ${isOwn ? 'text-emerald-100' : 'text-slate-400'}`}>
                                      {formatTime(message.created_at)}
                                    </span>
                                  </div>
                                </div>

                                {selectedMessage === message.id && (
                                  <div className="flex gap-0.5 bg-white rounded-full shadow-sm border border-slate-100 px-0.5 md:px-1">
                                    <button
                                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                                      className="text-slate-400 hover:text-slate-600 p-1 md:p-1.5 rounded-full hover:bg-slate-100"
                                    >
                                      <FiSmile className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReply(message)}
                                      className="text-slate-400 hover:text-slate-600 p-1 md:p-1.5 rounded-full hover:bg-slate-100"
                                    >
                                      <FiCornerUpLeft className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                    {isOwn && (
                                      <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-slate-400 hover:text-red-500 p-1 md:p-1.5 rounded-full hover:bg-slate-100"
                                      >
                                        <FiTrash2 className="w-3 h-3 md:w-4 md:h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {showEmojiPicker === message.id && (
                                <div className="flex gap-0.5 md:gap-1 mt-1 bg-white rounded-full shadow-lg border border-slate-200 px-1.5 md:px-2 py-0.5 md:py-1">
                                  {EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(message.id, emoji)}
                                      className="text-base md:text-lg hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {showReactions && (
                                <div className="flex flex-wrap gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                                  {Object.entries(
                                    message.reactions.reduce((acc, r) => {
                                      acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                      return acc
                                    }, {})
                                  ).map(([emoji, count]) => (
                                    <span key={emoji} className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-white border border-slate-200 shadow-sm">
                                      {emoji} {count > 1 && count}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {replyTo && (
              <div className="bg-white border-t border-slate-200 px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex-1 flex items-center gap-1.5 md:gap-2 min-w-0">
                  <FiCornerUpLeft className="text-slate-400 w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs font-medium text-indigo-600">Replying to {replyTo.sender_name}</p>
                    <p className="text-[10px] md:text-xs text-slate-500 truncate">{replyTo.content || 'Attachment'}</p>
                  </div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0">
                  <FiX className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            )}

            <div className="bg-white border-t border-slate-200 px-2 md:px-4 py-2 md:py-3 flex-shrink-0">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="bg-slate-100 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-sm flex items-center gap-1 md:gap-1.5">
                      {file.type?.startsWith('image/') ? (
                        <FiImage className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                      ) : (
                        <FiFile className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
                      )}
                      <span className="text-slate-600 truncate max-w-[60px] md:max-w-[100px]">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                        <FiX className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 md:gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="p-1.5 md:p-2 text-slate-500 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {uploading ? (
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiPaperclip className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={handleTyping}
                  placeholder={replyTo ? `Reply to ${replyTo.sender_name}...` : 'Message the group...'}
                  className="flex-1 px-3 md:px-4 py-1.5 md:py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-slate-50 text-xs md:text-sm transition-all min-w-0"
                />
                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && attachments.length === 0) || uploading}
                  className={`p-1.5 md:p-2.5 rounded-full transition-colors flex-shrink-0 ${
                    (inputMessage.trim() || attachments.length > 0) && !uploading
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FiSend className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </form>
            </div>
          </div>

          {showMembers && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                onClick={() => setShowMembers(false)}
              />
              <div className="fixed lg:absolute inset-y-0 right-0 w-full sm:w-72 md:w-72 border-l border-slate-200 bg-white flex flex-col shadow-lg lg:shadow-none z-30">
                <div className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm md:text-base">Members</h3>
                  <button onClick={() => setShowMembers(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <FiX className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 md:p-2">
                  {group.members?.map((member) => (
                    <div key={member.id} className="flex items-center px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-slate-50">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs md:text-sm font-semibold flex-shrink-0">
                        {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-2 md:ml-2.5 flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-slate-800 truncate">{member.full_name}</p>
                        {member.is_admin && <p className="text-[9px] md:text-[11px] text-indigo-500">Admin</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 md:p-3 border-t border-slate-100">
                  <button
                    onClick={handleLeaveGroup}
                    className="flex items-center justify-center gap-1.5 md:gap-2 w-full py-1.5 md:py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs md:text-sm font-medium transition-colors"
                  >
                    <FiLogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Leave group
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeGroupChat