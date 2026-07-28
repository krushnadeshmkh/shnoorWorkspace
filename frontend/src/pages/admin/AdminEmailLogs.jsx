import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { formatDistanceToNow } from 'date-fns'
import { FiMail, FiSearch } from 'react-icons/fi'

const AdminEmailLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await adminAPI.getEmailLogs()
      setLogs(response || [])
    } catch (error) {
      console.error('Error fetching email logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return logs
    return logs.filter((log) =>
      (log.subject || '').toLowerCase().includes(term) ||
      (log.sender_email || '').toLowerCase().includes(term) ||
      (log.receiver_email || '').toLowerCase().includes(term)
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
        <h1 className="text-xl md:text-2xl font-bold text-navy">Email Monitoring</h1>
        <p className="text-gray-500 mt-0.5 md:mt-1 text-sm md:text-base">View all email activity across the workspace</p>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 md:mb-6">
          <div className="relative flex-1">
            <label htmlFor="email-log-search" className="sr-only">Search email logs</label>
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="email-log-search"
              type="text"
              placeholder="Search email logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt text-sm"
            />
          </div>
        </div>

        <ul className="space-y-3">
          {filteredLogs.length === 0 ? (
            <li className="text-center py-8 md:py-12 text-gray-500 list-none">
              <FiMail className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-300" aria-hidden="true" />
              <p className="font-medium text-sm md:text-base">No email logs found</p>
            </li>
          ) : (
            filteredLogs.map((log, index) => (
              <li key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 sm:gap-0 list-none">
                <div className="flex items-start sm:items-center space-x-2 md:space-x-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
                    <FiMail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-navy truncate text-sm md:text-base">{log.subject || 'No Subject'}</p>
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      From: {log.sender_email} • To: {log.receiver_email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-0 sm:flex-col sm:items-end">
                  <span className={`px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium rounded-full ${
                    log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status || 'sent'}
                  </span>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </AdminLayout>
  )
}

export default AdminEmailLogs