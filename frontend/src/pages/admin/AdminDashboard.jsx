import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { FiUsers, FiMail, FiMessageSquare, FiUserCheck, FiTrendingUp, FiClock } from 'react-icons/fi'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    totalEmails: 0,
    totalMessages: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats()
      setStats(response)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = useMemo(() => ([
    { 
      title: 'Total Employees', 
      value: stats.totalUsers, 
      icon: FiUsers, 
      color: 'text-blue-700', 
      bg: 'bg-blue-100',
      ariaLabel: `Total employees: ${stats.totalUsers}`
    },
    { 
      title: 'Active Users', 
      value: stats.activeUsers, 
      icon: FiUserCheck, 
      color: 'text-green-700', 
      bg: 'bg-green-100',
      ariaLabel: `Active users: ${stats.activeUsers}`
    },
    { 
      title: 'Total Groups', 
      value: stats.totalGroups, 
      icon: FiMessageSquare, 
      color: 'text-purple-700', 
      bg: 'bg-purple-100',
      ariaLabel: `Total groups: ${stats.totalGroups}`
    },
    { 
      title: 'Total Emails', 
      value: stats.totalEmails, 
      icon: FiMail, 
      color: 'text-orange-700', 
      bg: 'bg-orange-100',
      ariaLabel: `Total emails: ${stats.totalEmails}`
    },
  ]), [stats])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy border-t-transparent"></div>
          <span className="sr-only">Loading dashboard</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-gray-600 mt-0.5 md:mt-1 text-sm md:text-base">Welcome to your admin panel overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-card p-4 md:p-6 hover:shadow-soft transition-shadow"
              role="article"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Recent Activity</h2>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                <FiTrendingUp className="text-green-700 w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <div>
                <p className="text-sm text-gray-700">New user registered</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                <FiMessageSquare className="text-blue-700 w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <div>
                <p className="text-sm text-gray-700">New group created</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 md:space-x-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                <FiMail className="text-purple-700 w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <div>
                <p className="text-sm text-gray-700">Email sent by employee</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Quick Actions</h2>
          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => navigate('/admin/groups')}
              className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 bg-purple-50 text-purple-800 rounded-lg hover:bg-purple-100 transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="Create a new group"
            >
              Create New Group
            </button>
            <button
              onClick={() => navigate('/admin/email-logs')}
              className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition-colors text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="View email logs"
            >
              View Email Logs
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard