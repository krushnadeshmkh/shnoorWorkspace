import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import EmployeeLayout from '../../components/layout/EmployeeLayout'
import { chatAPI } from '../../api/chat'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import { FiMessageSquare, FiUsers, FiSearch, FiUser, FiX, FiClock, FiFilter, FiCalendar, FiFile, FiPaperclip, FiHash, FiUserCheck } from 'react-icons/fi'
import { toast } from 'react-toastify'

const EmployeeChat = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { socket, isUserOnline } = useSocket()
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('chats')
  const [groupUnread, setGroupUnread] = useState({})
  const [privateUnread, setPrivateUnread] = useState({})
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchFilters, setSearchFilters] = useState({
    person: true,
    message: true,
    file: true,
    date: false,
    space: false,
    conversation: true,
    attachment: true
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [highlightedMessageId, setHighlightedMessageId] = useState(null)
  const searchTimeoutRef = useRef(null)
  const searchInputRef = useRef(null)
  const resultsRef = useRef(null)
  const filterRef = useRef(null)

  useEffect(() => {
    fetchData()
    loadSearchHistory()
    
    const params = new URLSearchParams(location.search)
    const msgId = params.get('messageId')
    if (msgId) {
      setHighlightedMessageId(msgId)
      setTimeout(() => {
        const element = document.getElementById(`message-${msgId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.style.backgroundColor = '#fef3c7'
          setTimeout(() => {
            element.style.backgroundColor = 'transparent'
          }, 3000)
        }
      }, 500)
    }
  }, [location])

  useEffect(() => {
    if (!socket) return

    const handleNewGroupMessage = (message) => {
      const isOwn = message.sender_id === user?.id
      setGroups(prev => prev.map(g => g.id === message.group_id
        ? { ...g, last_message: message.content || (message.attachments?.length ? 'Attachment' : g.last_message), last_message_at: message.created_at }
        : g
      ))
      if (!isOwn) {
        setGroupUnread(prev => ({
          ...prev,
          [message.group_id]: (prev[message.group_id] || 0) + 1
        }))
      }
    }

    const handleNewPrivateMessage = (message) => {
      const isOwn = message.sender_id === user?.id
      const otherId = isOwn ? message.receiver_id : message.sender_id
      setUsers(prev => prev.map(u => u.id === otherId
        ? { ...u, last_message: message.content || (message.attachments?.length ? 'Attachment' : u.last_message), last_message_at: message.created_at }
        : u
      ))
      if (!isOwn) {
        setPrivateUnread(prev => ({
          ...prev,
          [otherId]: (prev[otherId] || 0) + 1
        }))
      }
    }

    socket.on('new-message', handleNewGroupMessage)
    socket.on('new-private-message', handleNewPrivateMessage)

    return () => {
      socket.off('new-message', handleNewGroupMessage)
      socket.off('new-private-message', handleNewPrivateMessage)
    }
  }, [socket, user])

  const fetchData = async () => {
    try {
      const [groupsRes, usersRes] = await Promise.all([
        chatAPI.getGroups(),
        chatAPI.getPrivateUsers()
      ])
      setGroups(groupsRes || [])
      setUsers(usersRes || [])
      const initialPrivateUnread = {}
      ;(usersRes || []).forEach(u => {
        if (u.unread_count > 0) initialPrivateUnread[u.id] = Number(u.unread_count)
      })
      setPrivateUnread(initialPrivateUnread)
    } catch (error) {
      toast.error('Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('chatSearchHistory') || '[]')
      setSearchHistory(history.slice(0, 10))
    } catch (e) {
      setSearchHistory([])
    }
  }

  const saveSearchHistory = (query) => {
    if (!query.trim()) return
    try {
      const history = JSON.parse(localStorage.getItem('chatSearchHistory') || '[]')
      const filtered = history.filter(h => h !== query)
      const updated = [query, ...filtered].slice(0, 10)
      localStorage.setItem('chatSearchHistory', JSON.stringify(updated))
      setSearchHistory(updated)
    } catch (e) {}
  }

  const handleGroupClick = (groupId, messageId = null) => {
    setGroupUnread(prev => ({ ...prev, [groupId]: 0 }))
    setShowSearchResults(false)
    setSearch('')
    setSelectedIndex(-1)
    if (messageId) {
      navigate(`/employee/chat/group/${groupId}?messageId=${messageId}`)
    } else {
      navigate(`/employee/chat/group/${groupId}`)
    }
  }

  const handlePrivateChat = (userId, messageId = null) => {
    setPrivateUnread(prev => ({ ...prev, [userId]: 0 }))
    setShowSearchResults(false)
    setSearch('')
    setSelectedIndex(-1)
    if (messageId) {
      navigate(`/employee/chat/private/${userId}?messageId=${messageId}`)
    } else {
      navigate(`/employee/chat/private/${userId}`)
    }
  }

  const handleSearch = (query) => {
    setSearch(query)
    setSelectedIndex(-1)
    setShowHistory(false)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await chatAPI.advancedSearch(query, searchFilters)
        const grouped = groupSearchResults(response || [])
        setSearchResults(grouped)
        if (response && response.length > 0) {
          saveSearchHistory(query)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const groupSearchResults = (results) => {
    const grouped = []
    const messageMap = new Map()

    results.forEach(result => {
      if (result.type === 'message' || result.type === 'file') {
        const key = result.message_id || result.id
        if (!messageMap.has(key)) {
          messageMap.set(key, {
            ...result,
            occurrences: 1,
            previews: [result.content || result.file_name]
          })
        } else {
          const existing = messageMap.get(key)
          existing.occurrences += 1
          if (result.content && !existing.previews.includes(result.content)) {
            existing.previews.push(result.content)
          }
          if (result.file_name && !existing.previews.includes(result.file_name)) {
            existing.previews.push(result.file_name)
          }
        }
      } else {
        grouped.push(result)
      }
    })

    messageMap.forEach((value) => {
      grouped.push(value)
    })

    return grouped.sort((a, b) => {
      const dateA = a.message_date || a.last_message_at || a.created_at
      const dateB = b.message_date || b.last_message_at || b.created_at
      if (dateA && dateB) {
        return new Date(dateB) - new Date(dateA)
      }
      if (dateA) return -1
      if (dateB) return 1
      return 0
    })
  }

  const clearSearch = () => {
    setSearch('')
    setSearchResults([])
    setShowSearchResults(false)
    setIsSearching(false)
    setSelectedIndex(-1)
    setShowHistory(false)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchInputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!showSearchResults || searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % searchResults.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const result = searchResults[selectedIndex]
      handleResultClick(result)
    } else if (e.key === 'Escape') {
      clearSearch()
    }
  }

  const handleResultClick = (result) => {
    if (result.type === 'private') {
      handlePrivateChat(result.id, result.message_id)
    } else if (result.type === 'group') {
      handleGroupClick(result.id, result.message_id)
    } else if (result.type === 'message' || result.type === 'file') {
      if (result.group_id) {
        handleGroupClick(result.group_id, result.message_id || result.id)
      } else if (result.sender_id) {
        const otherId = result.sender_id === user?.id ? result.receiver_id : result.sender_id
        if (otherId) handlePrivateChat(otherId, result.message_id || result.id)
      }
    }
  }

  const getHighlightedText = (text, query) => {
    if (!text || !query) return text
    try {
      const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
      return parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? 
          <mark key={i} className="bg-emerald-200/60 text-emerald-800 rounded px-0.5">{part}</mark> : 
          part
      )
    } catch {
      return text
    }
  }

  const getSearchTypeIcon = (type) => {
    switch(type) {
      case 'private': return <FiUser className="w-3 h-3" />
      case 'group': return <FiUsers className="w-3 h-3" />
      case 'message': return <FiMessageSquare className="w-3 h-3" />
      case 'file': return <FiFile className="w-3 h-3" />
      case 'attachment': return <FiPaperclip className="w-3 h-3" />
      default: return <FiSearch className="w-3 h-3" />
    }
  }

  const getSearchTypeLabel = (type) => {
    switch(type) {
      case 'private': return 'Person'
      case 'group': return 'Group'
      case 'message': return 'Message'
      case 'file': return 'File'
      case 'attachment': return 'Attachment'
      case 'space': return 'Space'
      default: return 'Result'
    }
  }

  const renderSearchResultItem = (result, index) => {
    const isSelected = index === selectedIndex
    const isPrivate = result.type === 'private'
    const isGroup = result.type === 'group'
    const isMessage = result.type === 'message' || result.type === 'file'
    
    if (isPrivate) {
      const unread = privateUnread[result.id] || 0
      const online = isUserOnline(result.id)
      return (
        <div
          key={`private-${result.id}`}
          onClick={() => handleResultClick(result)}
          className={`flex items-center px-4 py-3 cursor-pointer transition-all ${
            isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'
          }`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
              {result.full_name?.charAt(0)?.toUpperCase() || result.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800 truncate text-sm">
                {getHighlightedText(result.full_name || result.name, search)}
                {result.match_field && result.match_field !== 'name' && (
                  <span className="ml-2 text-[10px] text-emerald-600 font-normal bg-emerald-50 px-1.5 py-0.5 rounded">
                    {result.match_field === 'email' ? 'Email' : 'Name'}
                  </span>
                )}
                {result.search_type && result.search_type !== 'private' && (
                  <span className="ml-2 text-[10px] text-indigo-600 font-normal bg-indigo-50 px-1.5 py-0.5 rounded">
                    {getSearchTypeLabel(result.search_type)}
                  </span>
                )}
              </p>
              {online && (
                <span className="text-[10px] text-emerald-500 font-medium flex-shrink-0 ml-2">Online</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 truncate">
                {result.last_message || result.email || 'No messages'}
              </p>
              {unread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] min-w-[18px] text-center bg-emerald-500 text-white rounded-full flex-shrink-0">
                  {unread}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    } else if (isGroup) {
      const unread = groupUnread[result.id] || 0
      return (
        <div
          key={`group-${result.id}`}
          onClick={() => handleResultClick(result)}
          className={`flex items-center px-4 py-3 cursor-pointer transition-all ${
            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
            <FiUsers className="w-5 h-5" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800 truncate text-sm">
                {getHighlightedText(result.name, search)}
                <span className="ml-2 text-[10px] text-indigo-600 font-normal bg-indigo-50 px-1.5 py-0.5 rounded">
                  Group
                </span>
                {result.search_type && result.search_type !== 'group' && (
                  <span className="ml-2 text-[10px] text-indigo-600 font-normal bg-indigo-50 px-1.5 py-0.5 rounded">
                    {getSearchTypeLabel(result.search_type)}
                  </span>
                )}
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {result.last_message || `${result.member_count || 0} members`}
            </p>
          </div>
          {unread > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] min-w-[18px] text-center bg-emerald-500 text-white rounded-full flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
      )
    } else if (isMessage) {
      return (
        <div
          key={`message-${result.id}`}
          onClick={() => handleResultClick(result)}
          className={`flex items-center px-4 py-3 cursor-pointer transition-all ${
            isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white flex-shrink-0">
            {result.search_type === 'file' ? <FiFile className="w-4 h-4" /> : <FiMessageSquare className="w-4 h-4" />}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800 truncate text-sm">
                {getHighlightedText(result.title || result.content || result.file_name, search)}
                <span className="ml-2 text-[10px] text-amber-600 font-normal bg-amber-50 px-1.5 py-0.5 rounded">
                  {result.search_type === 'file' ? 'File' : 'Message'}
                </span>
                {result.occurrences > 1 && (
                  <span className="ml-2 text-[10px] text-slate-400">
                    {result.occurrences} matches
                  </span>
                )}
              </p>
              {result.message_id && (
                <span className="text-[10px] text-emerald-500 font-medium flex-shrink-0 ml-2">
                  Jump to message →
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-slate-500 truncate">
                {result.sender_name && <span className="text-slate-600">From: {result.sender_name}</span>}
                {result.content && result.content !== result.title && (
                  <span className="ml-2 text-slate-500">
                    {getHighlightedText(result.content, search)}
                  </span>
                )}
                {result.file_name && result.file_name !== result.title && (
                  <span className="ml-2 text-slate-500">
                    <FiFile className="inline w-2.5 h-2.5 mr-0.5" />
                    {getHighlightedText(result.file_name, search)}
                  </span>
                )}
              </p>
              {result.previews && result.previews.length > 1 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {result.previews.slice(0, 3).map((preview, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                      {getHighlightedText(preview, search)}
                    </span>
                  ))}
                  {result.previews.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{result.previews.length - 3} more</span>
                  )}
                </div>
              )}
              {result.message_date && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  <FiClock className="inline w-2.5 h-2.5 mr-0.5" />
                  {formatDistanceToNow(new Date(result.message_date), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div
          key={`result-${result.id}-${index}`}
          onClick={() => handleResultClick(result)}
          className={`flex items-center px-4 py-3 cursor-pointer transition-all ${
            isSelected ? 'bg-slate-100' : 'hover:bg-slate-50'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white flex-shrink-0">
            {getSearchTypeIcon(result.search_type || 'message')}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-800 truncate text-sm">
                {getHighlightedText(result.title || result.content || result.name, search)}
                <span className="ml-2 text-[10px] text-slate-600 font-normal bg-slate-100 px-1.5 py-0.5 rounded">
                  {getSearchTypeLabel(result.search_type || 'message')}
                </span>
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {result.preview || result.content || result.last_message}
            </p>
            {result.message_date && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                <FiClock className="inline w-2.5 h-2.5 mr-0.5" />
                {formatDistanceToNow(new Date(result.message_date), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      )
    }
  }

  const filteredGroups = useMemo(() => groups.filter(group =>
    (group.name || '').toLowerCase().includes(search.toLowerCase())
  ), [groups, search])

  const filteredUsers = useMemo(() => users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  ), [users, search])

  const formatTimestamp = (date) => {
    if (!date) return ''
    return formatDistanceToNow(new Date(date), { addSuffix: false })
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

  return (
    <EmployeeLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 relative">
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col min-h-0 relative z-10">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg md:text-xl font-semibold text-slate-800">Messages</h2>
          </div>

          <div className="px-3 md:px-4 py-2 md:py-3 flex-shrink-0 relative">
            <div className="relative">
              <FiSearch className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-4 md:h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search people, groups, messages, files..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (!search.trim() && searchHistory.length > 0) {
                    setShowHistory(true)
                  }
                  if (search.trim() && searchResults.length > 0) {
                    setShowSearchResults(true)
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowHistory(false), 200)
                }}
                className="w-full pl-9 md:pl-10 pr-16 md:pr-20 py-2 md:py-2.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-slate-50 text-sm transition-all"
              />
              <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 rounded-full hover:bg-slate-200 transition-colors ${showFilters ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400'}`}
                >
                  <FiFilter className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                {search && (
                  <button
                    onClick={clearSearch}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                  >
                    <FiX className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                )}
                {isSearching && (
                  <div className="p-1">
                    <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {showFilters && (
              <div 
                ref={filterRef}
                className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(searchFilters).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => setSearchFilters(prev => ({
                          ...prev,
                          [key]: !prev[key]
                        }))}
                        className="w-3.5 h-3.5 text-emerald-500 rounded focus:ring-emerald-500"
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => {
                      const allTrue = Object.values(searchFilters).every(v => v === true)
                      const newFilters = {}
                      Object.keys(searchFilters).forEach(k => {
                        newFilters[k] = !allTrue
                      })
                      setSearchFilters(newFilters)
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    {Object.values(searchFilters).every(v => v === true) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            )}

            {showHistory && searchHistory.length > 0 && !search.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-[200px] overflow-y-auto z-50">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent Searches</span>
                </div>
                {searchHistory.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearch(item)
                      handleSearch(item)
                      setShowHistory(false)
                    }}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-50"
                  >
                    <FiSearch className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
                <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50 rounded-b-xl text-center">
                  <button
                    onClick={() => {
                      localStorage.removeItem('chatSearchHistory')
                      setSearchHistory([])
                      setShowHistory(false)
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}

            {showSearchResults && search.trim() && (
              <div 
                ref={resultsRef}
                className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-[450px] overflow-y-auto z-50"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs text-slate-400 mt-1">Try different keywords or filters</p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Search Results ({searchResults.length})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {searchResults.filter(r => r.type === 'private').length} people · {searchResults.filter(r => r.type === 'group').length} groups · {searchResults.filter(r => r.type === 'message' || r.type === 'file').length} messages
                      </span>
                    </div>
                    {searchResults.map((result, index) => renderSearchResultItem(result, index))}
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl text-[10px] text-slate-400 text-center">
                      Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↵</kbd> to open selected · <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↑↓</kbd> to navigate · <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> to close
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {!showSearchResults && (
            <>
              <div className="flex px-3 md:px-4 gap-1.5 md:gap-2 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-colors ${
                    activeTab === 'chats'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-full transition-colors ${
                    activeTab === 'groups'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Groups
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mt-2">
                {activeTab === 'chats' ? (
                  filteredUsers.length === 0 ? (
                    <div className="text-center py-12 md:py-16 text-slate-400">
                      <FiUser className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 opacity-40" />
                      <p className="text-xs md:text-sm font-medium">No contacts found</p>
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const unread = privateUnread[u.id] || 0
                      const online = isUserOnline(u.id)
                      return (
                        <div
                          key={u.id}
                          onClick={() => handlePrivateChat(u.id)}
                          className="flex items-center px-3 md:px-4 py-2.5 md:py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                              {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            {online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div className="ml-2 md:ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-800 truncate text-sm md:text-base">{u.full_name}</p>
                              {online && (
                                <span className="text-[10px] md:text-[11px] text-emerald-500 font-medium flex-shrink-0 ml-1 md:ml-2">Online</span>
                              )}
                              {!online && (
                                <span className="text-[10px] md:text-[11px] text-slate-400 flex-shrink-0 ml-1 md:ml-2 hidden xs:inline">Offline</span>
                              )}
                              {u.last_message_at && !online && (
                                <span className="text-[10px] md:text-[11px] text-slate-400 flex-shrink-0 ml-1 md:ml-2 hidden xs:inline">
                                  {formatTimestamp(u.last_message_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs md:text-sm text-slate-500 truncate">
                                {u.last_message || u.email}
                              </p>
                              {unread > 0 && (
                                <span className="ml-1 md:ml-2 px-1.5 py-0.5 text-[10px] md:text-[11px] min-w-[16px] md:min-w-[18px] text-center bg-emerald-500 text-white rounded-full flex-shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )
                ) : (
                  filteredGroups.length === 0 ? (
                    <div className="text-center py-12 md:py-16 text-slate-400">
                      <FiUsers className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 opacity-40" />
                      <p className="text-xs md:text-sm font-medium">No groups available</p>
                    </div>
                  ) : (
                    filteredGroups.map((group) => {
                      const unread = groupUnread[group.id] || 0
                      return (
                        <div
                          key={group.id}
                          onClick={() => handleGroupClick(group.id)}
                          className="flex items-center px-3 md:px-4 py-2.5 md:py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                            <FiUsers className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                          <div className="ml-2 md:ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-800 truncate text-sm md:text-base">{group.name}</p>
                              {group.last_message_at && (
                                <span className="text-[10px] md:text-[11px] text-slate-400 flex-shrink-0 ml-1 md:ml-2 hidden xs:inline">
                                  {formatTimestamp(group.last_message_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs md:text-sm text-slate-500 truncate">
                                {group.last_message || `${group.member_count || 0} members`}
                              </p>
                              {unread > 0 && (
                                <span className="ml-1 md:ml-2 px-1.5 py-0.5 text-[10px] md:text-[11px] min-w-[16px] md:min-w-[18px] text-center bg-emerald-500 text-white rounded-full flex-shrink-0">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )
                )}
              </div>
            </>
          )}
        </div>

        <div className="hidden md:flex flex-1 flex-col bg-slate-50">
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center p-4">
              <FiMessageSquare className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 text-slate-300" />
              <p className="text-base md:text-lg font-medium text-slate-500">Pick up a conversation</p>
              <p className="text-xs md:text-sm text-slate-400">Select a contact or group from the list</p>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeChat