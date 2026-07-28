import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { formatDistanceToNow } from 'date-fns'
import { FiMessageSquare, FiSearch, FiFilter } from 'react-icons/fi'

const AdminChatLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await adminAPI.getChatLogs()
      setLogs(response || [])
    } catch (error) {
      console.error('Error fetching chat logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return logs
    return logs.filter((log) =>
      (log.sender_name || '').toLowerCase().includes(term) ||
      (log.content || '').toLowerCase().includes(term) ||
      (log.group_name || '').toLowerCase().includes(term)
    )
  }, [logs, search])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-navy">Chat Monitoring</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Monitor all chat activity in real-time</p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-1">
            <label htmlFor="chat-log-search" className="sr-only">Search chat logs</label>
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="chat-log-search"
              type="text"
              placeholder="Search chat logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt text-sm"
            />
          </div>
          <button className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm md:text-base">
            <FiFilter className="w-4 h-4" aria-hidden="true" />
            Filter
          </button>
        </div>

        <ul className="space-y-3">
          {filteredLogs.length === 0 ? (
            <li className="text-center py-8 md:py-12 text-gray-500 list-none">
              <FiMessageSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-sm md:text-base">No chat logs found</p>
            </li>
          ) : (
            filteredLogs.map((log, index) => (
              <li key={index} className="p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors list-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-start sm:items-center space-x-2 md:space-x-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
                      <FiMessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-navy text-sm md:text-base truncate">{log.sender_name}</p>
                      <p className="text-xs md:text-sm text-gray-600 break-words">{log.content}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2 break-words">
                  Group: {log.group_name || 'Private Chat'} • {log.group_id ? 'Group' : 'Private'}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </AdminLayout>
  )
}

export default AdminChatLogs