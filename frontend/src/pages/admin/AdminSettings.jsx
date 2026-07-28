import React, { useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { toast } from 'react-toastify'
import { FiSave, FiGlobe, FiLock, FiMail, FiUsers, FiSettings as FiSettingsIcon } from 'react-icons/fi'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Workspace',
    siteUrl: 'https://workspace.com',
    supportEmail: 'support@workspace.com',
    maxUsers: 100,
    maxFileSize: 10,
    allowRegistration: true,
    requireVerification: true,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Settings saved successfully')
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-navy">System Settings</h1>
          <p className="text-gray-500 text-sm md:text-base mt-0.5 md:mt-1">Configure your workspace settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4 flex items-center gap-2">
              <FiSettingsIcon className="w-4 h-4 md:w-5 md:h-5" />
              General Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="input-label text-sm md:text-base">Site Name</label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">Site URL</label>
                <input
                  type="url"
                  name="siteUrl"
                  value={settings.siteUrl}
                  onChange={handleChange}
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">Support Email</label>
                <input
                  type="email"
                  name="supportEmail"
                  value={settings.supportEmail}
                  onChange={handleChange}
                  className="input-field text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4 flex items-center gap-2">
              <FiUsers className="w-4 h-4 md:w-5 md:h-5" />
              User Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="input-label text-sm md:text-base">Max Users</label>
                <input
                  type="number"
                  name="maxUsers"
                  value={settings.maxUsers}
                  onChange={handleChange}
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">Max File Size (MB)</label>
                <input
                  type="number"
                  name="maxFileSize"
                  value={settings.maxFileSize}
                  onChange={handleChange}
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <input
                  type="checkbox"
                  name="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-navy rounded focus:ring-navy"
                />
                <label className="text-xs md:text-sm text-gray-700">Allow User Registration</label>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <input
                  type="checkbox"
                  name="requireVerification"
                  checked={settings.requireVerification}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-navy rounded focus:ring-navy"
                />
                <label className="text-xs md:text-sm text-gray-700">Require Email Verification</label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4 flex items-center gap-2">
              <FiMail className="w-4 h-4 md:w-5 md:h-5" />
              Email Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="input-label text-sm md:text-base">SMTP Host</label>
                <input
                  type="text"
                  name="smtpHost"
                  placeholder="smtp.gmail.com"
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">SMTP Port</label>
                <input
                  type="number"
                  name="smtpPort"
                  placeholder="587"
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">SMTP Username</label>
                <input
                  type="email"
                  name="smtpUsername"
                  placeholder="your@email.com"
                  className="input-field text-sm md:text-base"
                />
              </div>
              <div>
                <label className="input-label text-sm md:text-base">SMTP Password</label>
                <input
                  type="password"
                  name="smtpPassword"
                  placeholder="••••••••"
                  className="input-field text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4 flex items-center gap-2">
              <FiLock className="w-4 h-4 md:w-5 md:h-5" />
              Security Settings
            </h2>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <input
                  type="checkbox"
                  name="twoFactorAuth"
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-navy rounded focus:ring-navy"
                />
                <label className="text-xs md:text-sm text-gray-700">Enable Two-Factor Authentication</label>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <input
                  type="checkbox"
                  name="sessionTimeout"
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-navy rounded focus:ring-navy"
                />
                <label className="text-xs md:text-sm text-gray-700">Auto-logout after 30 minutes of inactivity</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base px-4 md:px-6 py-2 md:py-2.5">
              <FiSave className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Save All Settings
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings