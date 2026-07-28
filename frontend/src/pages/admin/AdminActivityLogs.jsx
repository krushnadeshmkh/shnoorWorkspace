import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { formatDistanceToNow } from 'date-fns'
import { FiActivity, FiSearch, FiFilter, FiUser, FiLogIn, FiMail, FiMessageSquare } from 'react-icons/fi'

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await adminAPI.getActivityLogs()
      setLogs(response || [])
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'login': return FiLogIn
      case 'email': return FiMail
      case 'chat': return FiMessageSquare
      default: return FiUser
    }
  }

  const getColor = (type) => {
    switch (type) {
      case 'login': return 'text-green-600 bg-green-100'
      case 'email': return 'text-blue-600 bg-blue-100'
      case 'chat': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return logs
    return logs.filter((log) =>
      (log.user_name || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.details || '').toLowerCase().includes(term)
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
        <h1 className="text-xl md:text-2xl font-bold text-navy">Activity Logs</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Complete audit trail of all user activities</p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="relative flex-1">
            <label htmlFor="activity-log-search" className="sr-only">Search activities</label>
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="activity-log-search"
              type="text"
              placeholder="Search activities..."
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

        <ul className="space-y-3 md:space-y-4">
          {filteredLogs.length === 0 ? (
            <li className="text-center py-8 md:py-12 text-gray-500 list-none">
              <FiActivity className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-sm md:text-base">No activity logs found</p>
            </li>
          ) : (
            filteredLogs.map((log, index) => {
              const Icon = getIcon(log.type)
              const color = getColor(log.type)
              return (
                <li key={index} className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors list-none">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`} aria-hidden="true">
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 break-words">
                      <span className="font-medium">{log.user_name}</span> {log.action}
                      {log.details && <span className="text-gray-500"> {log.details}</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
                      <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                      {log.ip && <span className="hidden xs:inline">• IP: {log.ip}</span>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap sm:mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </AdminLayout>
  )
}

export default AdminActivityLogs