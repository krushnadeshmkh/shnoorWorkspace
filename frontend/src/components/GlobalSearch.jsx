import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiSearch, FiX, FiMail, FiMessageCircle, FiUser } from 'react-icons/fi'
import { searchAPI } from '../api/search'
import { formatDistanceToNow } from 'date-fns'

const GlobalSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ emails: [], chats: [], users: [] })
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      const delay = setTimeout(() => {
        performSearch()
      }, 300)
      return () => clearTimeout(delay)
    } else {
      setResults({ emails: [], chats: [], users: [] })
      setShowResults(false)
    }
  }, [query])

  const performSearch = async () => {
    setLoading(true)
    try {
      const response = await searchAPI.globalSearch(query)
      setResults(response)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result) => {
    setShowResults(false)
    setQuery('')
    setResults({ emails: [], chats: [], users: [] })
    
    const basePath = location.pathname.includes('/admin') ? '/admin' : '/employee'
    
    if (result.type === 'email') {
      navigate(`${basePath}/email/${result.id}`)
    } else if (result.type === 'chat' || result.type === 'private_chat') {
      if (result.group_name) {
        navigate(`${basePath}/chat/group/${result.group_id}`)
      } else if (result.contact_id) {
        navigate(`${basePath}/chat/private/${result.contact_id}`)
      } else if (result.sender_id && result.sender_id !== userId) {
        navigate(`${basePath}/chat/private/${result.sender_id}`)
      } else if (result.receiver_id) {
        navigate(`${basePath}/chat/private/${result.receiver_id}`)
      } else {
        console.error('No valid user ID found for private chat:', result)
      }
    } else if (result.type === 'user') {
      navigate(`${basePath}/chat/private/${result.id}`)
    }
  }

  const totalResults = results.emails.length + results.chats.length + results.users.length

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search emails, chats, contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt bg-gray-50 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-soft border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-cobalt border-t-transparent"></div>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.emails.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Emails</p>
                  {results.emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleResultClick(email)}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiMail className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{email.subject || 'No subject'}</p>
                        <p className="text-xs text-gray-500 truncate">{email.sender_name} • {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.chats.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chats</p>
                  {results.chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleResultClick(chat)}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiMessageCircle className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {chat.group_name || chat.sender_name}
                          {chat.type === 'private_chat' && !chat.group_name && ' (Private)'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{chat.content} • {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.users.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">People</p>
                  {results.users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleResultClick(user)}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs text-cobalt">Chat</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch