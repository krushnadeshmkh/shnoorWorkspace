import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../../components/layout/EmployeeLayout'
import { emailAPI } from '../../api/emails'
import { chatAPI } from '../../api/chat'
import { useAuth } from '../../hooks/useAuth'
import { FiMail, FiMessageSquare, FiUsers, FiStar } from 'react-icons/fi'

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    unreadCount: 0,
    totalGroups: 0,
    importantCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [unread, groups, important] = await Promise.all([
        emailAPI.getUnreadCount(),
        chatAPI.getGroups(),
        emailAPI.getImportant()
      ])

      setStats({
        unreadCount: unread.unreadCount || 0,
        totalGroups: groups.length || 0,
        importantCount: important.length || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = useMemo(() => ([
    {
      title: 'Unread Emails',
      value: stats.unreadCount,
      icon: FiMail,
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      onClick: () => navigate('/employee/inbox'),
      ariaLabel: `View unread emails, ${stats.unreadCount} unread`
    },
    {
      title: 'Active Groups',
      value: stats.totalGroups,
      icon: FiUsers,
      color: 'text-green-700',
      bg: 'bg-green-100',
      onClick: () => navigate('/employee/chat'),
      ariaLabel: `View active groups, ${stats.totalGroups} groups`
    },
    {
      title: 'Important Emails',
      value: stats.importantCount,
      icon: FiStar,
      color: 'text-yellow-700',
      bg: 'bg-yellow-100',
      onClick: () => navigate('/employee/important'),
      ariaLabel: `View important emails, ${stats.importantCount} important`
    },
  ]), [stats, navigate])

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="sr-only">Loading dashboard</span>
        </div>
      </EmployeeLayout>
    )
  }

  return (
    <EmployeeLayout>
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-navy">Welcome back, {user?.fullName}!</h1>
        <p className="text-gray-600 text-sm md:text-base mt-0.5 md:mt-1">Here's what's happening in your workspace today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-card p-4 md:p-6 hover:shadow-soft transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={stat.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  stat.onClick()
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={stat.ariaLabel}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-bold text-navy mt-1" aria-hidden="true">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-2.5 md:p-3 rounded-xl flex-shrink-0 ml-2`} aria-hidden="true">
                  <Icon className={`${stat.color} text-xl md:text-2xl`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/employee/compose')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Compose a new email"
            >
              <div className="bg-blue-600 p-2.5 md:p-3 rounded-xl text-white mb-2 md:mb-3" aria-hidden="true">
                <FiMail className="text-xl md:text-2xl" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-800">Compose Email</span>
            </button>
            <button
              onClick={() => navigate('/employee/chat')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Start a new chat"
            >
              <div className="bg-green-600 p-2.5 md:p-3 rounded-xl text-white mb-2 md:mb-3" aria-hidden="true">
                <FiMessageSquare className="text-xl md:text-2xl" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-800">Start Chat</span>
            </button>
            <button
              onClick={() => navigate('/employee/important')}
              className="flex flex-col items-center justify-center p-4 md:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              aria-label="View important emails"
            >
              <div className="bg-yellow-600 p-2.5 md:p-3 rounded-xl text-white mb-2 md:mb-3" aria-hidden="true">
                <FiStar className="text-xl md:text-2xl" />
              </div>
              <span className="text-xs md:text-sm font-medium text-gray-800">Important Emails</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Recent Activity</h2>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-2 rounded-full bg-green-500" aria-hidden="true"></div>
              <div>
                <p className="text-sm text-gray-700">No recent activity</p>
                <p className="text-xs text-gray-500">Check back later</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeDashboard