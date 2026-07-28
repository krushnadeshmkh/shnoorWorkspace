import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import AdminLayout from '../components/layout/AdminLayout'
import EmployeeLayout from '../components/layout/EmployeeLayout'
import { toast } from 'react-toastify'
import { FiUser, FiMail, FiBriefcase, FiLock, FiSave } from 'react-icons/fi'

const Profile = () => {
  const { user, updateProfile, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    organization: user?.organization || '',
    password: '',
    confirmPassword: '',
  })

  const Layout = isAdmin() ? AdminLayout : EmployeeLayout

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const updateData = {
      full_name: formData.full_name,
      organization: formData.organization,
    }
    
    if (formData.password) {
      updateData.password = formData.password
    }

    const result = await updateProfile(updateData)
    console.log(result)
    
    if (result.success) {
      toast.success('Profile updated successfully')
      setFormData({ ...formData, password: '', confirmPassword: '' })
    } else {
      toast.error(result.error || 'Failed to update profile')
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-2 sm:px-0">
        <div className="bg-white rounded-xl shadow-card p-4 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 md:mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0 self-start sm:self-auto">
              <span className="text-2xl md:text-3xl font-bold text-navy">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-navy truncate">{user?.full_name}</h2>
              <p className="text-gray-500 text-sm md:text-base truncate">{user?.email}</p>
              <span className="inline-block mt-1 px-2 md:px-3 py-0.5 md:py-1 bg-navy/10 text-navy text-[10px] md:text-xs font-medium rounded-full capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="input-label text-sm md:text-base">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-2.5 md:top-3 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="input-field pl-8 md:pl-10 text-sm md:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label text-sm md:text-base">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-2.5 md:top-3 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="input-field pl-8 md:pl-10 bg-gray-50 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="input-label text-sm md:text-base">Organization</label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-2.5 md:top-3 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                <input
                  type="text"
                  name="organization"
                  value={formData.organization || ''}
                  onChange={handleChange}
                  className="input-field pl-8 md:pl-10 text-sm md:text-base"
                  placeholder="Enter your organization name"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 md:pt-6">
              <h3 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="input-label text-sm md:text-base">New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-2.5 md:top-3 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field pl-8 md:pl-10 text-sm md:text-base"
                      placeholder="Enter new password"
                      minLength="6"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label text-sm md:text-base">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-2.5 md:top-3 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-field pl-8 md:pl-10 text-sm md:text-base"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 md:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-1.5 md:space-x-2 text-sm md:text-base px-4 md:px-6 py-2 md:py-2.5"
              >
                <FiSave className="w-4 h-4 md:w-5 md:h-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default Profile