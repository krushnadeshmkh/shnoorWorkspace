import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmployeeLayout from '../../components/layout/EmployeeLayout'
import { adminAPI } from '../../api/admin'
import { chatAPI } from '../../api/chat'
import { toast } from 'react-toastify'
import { FiX, FiUsers, FiPlus, FiMinus } from 'react-icons/fi'

const EmployeeCreateGroup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberEmails: [],
  })
  const [emailInput, setEmailInput] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddEmail = () => {
    if (emailInput && !formData.memberEmails.includes(emailInput)) {
      setFormData({
        ...formData,
        memberEmails: [...formData.memberEmails, emailInput],
      })
      setEmailInput('')
    }
  }

  const handleRemoveEmail = (email) => {
    setFormData({
      ...formData,
      memberEmails: formData.memberEmails.filter(e => e !== email),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Group name is required')
      return
    }

    setLoading(true)
    try {
      await adminAPI.createGroup(formData)
      toast.success('Group created successfully!')
      navigate('/employee/chat')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <EmployeeLayout>
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-navy">Create New Group</h2>
            <button
              onClick={() => navigate('/employee/chat')}
              className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <FiX className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="input-label text-sm md:text-base">Group Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field text-sm md:text-base"
                placeholder="Enter group name"
                required
              />
            </div>

            <div>
              <label className="input-label text-sm md:text-base">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[80px] md:min-h-[100px] text-sm md:text-base"
                placeholder="What is this group about?"
              />
            </div>

            <div>
              <label className="input-label text-sm md:text-base">Add Members</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="input-field flex-1 text-sm md:text-base"
                  placeholder="Enter email address"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-sm md:text-base"
                >
                  <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Add
                </button>
              </div>
              {formData.memberEmails.length > 0 && (
                <div className="mt-2 md:mt-3 flex flex-wrap gap-1.5 md:gap-2">
                  {formData.memberEmails.map((email, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm">
                      <span className="text-gray-700 truncate max-w-[120px] sm:max-w-none">{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-1.5 md:ml-2 text-gray-500 hover:text-red-500 flex-shrink-0"
                      >
                        <FiMinus className="w-2.5 h-2.5 md:w-3 md:h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2">
                Members will receive an invitation to join the group
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 md:pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/employee/chat')}
                className="btn-secondary text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <FiUsers className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EmployeeLayout>
  )
}

export default EmployeeCreateGroup