import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { emailAPI } from '../../api/emails'
import { 
  FiHome, FiInbox, FiEdit, FiSend, FiFileText, FiArchive, 
  FiAlertCircle, FiTrash2, FiStar, FiMessageCircle,
  FiSettings, FiLogOut, FiUser, FiBell, FiSearch,
  FiChevronDown, FiChevronRight, FiPlus, FiMenu, FiX,
  FiTag
} from 'react-icons/fi'
import GlobalSearch from '../../components/GlobalSearch'

const EmployeeLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [labels, setLabels] = useState([])
  const [showLabels, setShowLabels] = useState(true)
  const [loadingLabels, setLoadingLabels] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchLabels()
  }, [])

  const fetchLabels = async () => {
    try {
      const response = await emailAPI.getLabels()
      setLabels(response || [])
    } catch (error) {
      console.error('Error fetching labels:', error)
    } finally {
      setLoadingLabels(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const emailNav = [
    { path: '/employee/inbox', icon: FiInbox, label: 'Inbox' },
    { path: '/employee/sent', icon: FiSend, label: 'Sent' },
    { path: '/employee/drafts', icon: FiFileText, label: 'Drafts' },
    { path: '/employee/archive', icon: FiArchive, label: 'Archive' },
    { path: '/employee/spam', icon: FiAlertCircle, label: 'Spam' },
    { path: '/employee/trash', icon: FiTrash2, label: 'Trash' },
    { path: '/employee/important', icon: FiStar, label: 'Important' },
    { path: '/employee/starred', icon: FiStar, label: 'Starred' },
  ]

  const mainNav = [
    { path: '/employee/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/employee/chat', icon: FiMessageCircle, label: 'Chat' },
  ]

  const bottomNav = [
    { path: '/profile', icon: FiUser, label: 'Profile' }
  ]

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-paper overflow-hidden">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-2.5 left-3 z-50 p-2 bg-navy text-white rounded-lg shadow-lg"
          aria-label="Open sidebar navigation"
        >
          <FiMenu className="w-4 h-4" />
        </button>
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-navy text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Workspace</h1>
            <p className="text-white/50 text-[10px] md:text-xs mt-0.5">Employee Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close sidebar navigation"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-2 md:px-3 py-3 md:py-4 overflow-y-auto">
          {mainNav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}

          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
            <p className="px-3 md:px-4 text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 md:mb-2">
              My Email
            </p>
            {emailNav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 md:mr-3" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}

            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/10">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className="flex items-center w-full px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white/70"
                aria-expanded={showLabels}
              >
                {showLabels ? <FiChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-1" aria-hidden="true" /> : <FiChevronRight className="w-3 h-3 md:w-4 md:h-4 mr-1" aria-hidden="true" />}
                Labels
              </button>

              {showLabels && (
                <div className="mt-1 space-y-0.5">
                  {loadingLabels ? (
                    <div className="px-3 md:px-4 py-1 text-[10px] md:text-xs text-white/30">Loading...</div>
                  ) : labels.length > 0 ? (
                    labels.map((label) => (
                      <Link
                        key={label.id}
                        to={`/employee/labels/${label.id}`}
                        onClick={closeSidebar}
                        className="flex items-center px-3 md:px-4 py-1 md:py-1.5 rounded-lg transition-colors text-xs text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        <div
                          className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mr-2 md:mr-3 flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                          aria-hidden="true"
                        ></div>
                        {label.name}
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 md:px-4 py-1 text-[10px] md:text-xs text-white/30">No labels created</div>
                  )}
                  
                  <Link
                    to="/employee/labels"
                    onClick={closeSidebar}
                    className="flex items-center px-3 md:px-4 py-1 md:py-1.5 rounded-lg transition-colors text-xs text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    <FiPlus className="w-3 h-3 md:w-4 md:h-4 mr-2 md:mr-3" aria-hidden="true" />
                    Create new label
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="p-2 md:p-3 border-t border-white/10">
          {bottomNav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-colors text-xs md:text-sm font-medium text-red-400 hover:bg-white/5 hover:text-red-300"
          >
            <FiLogOut className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 ml-10 lg:ml-0">
              <GlobalSearch />
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button className="relative text-gray-600 hover:text-navy transition-colors p-1.5 md:p-2 hover:bg-gray-100 rounded-lg" aria-label="Notifications, 3 unread">
                <FiBell className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                <span className="absolute top-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-red-500 text-white text-[7px] md:text-[8px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">3</span>
              </button>
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-navy/10 flex items-center justify-center" aria-hidden="true">
                  <span className="text-navy font-semibold text-xs md:text-sm">{user?.fullName?.charAt(0) || 'E'}</span>
                </div>
                <span className="text-xs md:text-sm font-medium hidden sm:block truncate max-w-[100px]">{user?.fullName}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}

export default EmployeeLayout