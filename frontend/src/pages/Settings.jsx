import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/layout/AdminLayout'
import EmployeeLayout from '../components/layout/EmployeeLayout'
import { toast } from 'react-toastify'
import { FiBell, FiMoon, FiGlobe, FiLock, FiUser, FiMail } from 'react-icons/fi'

const Settings = () => {
  const { user, isAdmin } = useAuth()
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'en',
    emailNotifications: true,
    chatNotifications: true,
  })

  const Layout = isAdmin() ? AdminLayout : EmployeeLayout

  const handleToggle = (key) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    })
    toast.success(`${key} updated`)
  }

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-2xl font-bold text-navy mb-6">Settings</h2>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiBell className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-700">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications for new messages</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('notifications')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications ? 'bg-navy' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FiMail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-700">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('emailNotifications')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-navy' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Appearance</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiMoon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-700">Dark Mode</p>
                    <p className="text-sm text-gray-500">Switch between light and dark theme</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('darkMode')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-navy' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Language</h3>
              <div className="flex items-center space-x-3">
                <FiGlobe className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Interface Language</p>
                  <p className="text-sm text-gray-500">Select your preferred language</p>
                </div>
                <select
                  name="language"
                  value={settings.language}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>

            {isAdmin() && (
              <div>
                <h3 className="text-lg font-semibold text-navy mb-4">Admin Settings</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    As an admin, you have full control over the workspace settings.
                    Additional admin settings can be configured in the admin panel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings