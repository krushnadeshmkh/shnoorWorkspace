import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { chatAPI } from '../../api/chat'
import { toast } from 'react-toastify'
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiUsers, FiMessageSquare, FiEye, FiX } from 'react-icons/fi'

const AdminGroups = () => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberEmails: [],
  })
  const [emailInput, setEmailInput] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await chatAPI.getGroups()
      setGroups(response)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await adminAPI.deleteGroup(groupId)
        toast.success('Group deleted successfully')
        fetchGroups()
      } catch (error) {
        toast.error('Failed to delete group')
      }
    }
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

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Group name is required')
      return
    }

    setCreating(true)
    try {
      await adminAPI.createGroup(formData)
      toast.success('Group created successfully!')
      setShowCreateModal(false)
      setFormData({ name: '', description: '', memberEmails: [] })
      fetchGroups()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  const filteredGroups = useMemo(() => (
    groups.filter(group =>
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(search.toLowerCase()))
    )
  ), [groups, search])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">Group Management</h1>
          <p className="text-gray-500 mt-0.5 md:mt-1 text-sm md:text-base">Create and manage all chat groups</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2"
        >
          <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
          Create Group
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <div className="relative mb-4 md:mb-6">
          <label htmlFor="group-search" className="sr-only">Search groups</label>
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="group-search"
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filteredGroups.map((group) => (
            <div key={group.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-soft transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy text-sm md:text-base truncate">{group.name}</h3>
                  {group.description && (
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1 line-clamp-2 break-words">{group.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1.5 md:mt-2">
                    <span className="flex items-center text-[10px] md:text-xs text-gray-500">
                      <FiUsers className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" aria-hidden="true" />
                      {group.member_count || 0} members
                    </span>
                    <span className="flex items-center text-[10px] md:text-xs text-gray-500">
                      <FiMessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" aria-hidden="true" />
                      {group.created_by_name || 'Admin'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-0.5 md:space-x-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => navigate(`/admin/groups/${group.id}`)}
                    className="p-1 md:p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`View details for ${group.name}`}
                    title="View Details"
                  >
                    <FiEye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1 md:p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Delete ${group.name}`}
                    title="Delete Group"
                  >
                    <FiTrash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-10 md:py-12 text-gray-500">
            <div className="text-4xl md:text-6xl mb-3 md:mb-4" aria-hidden="true">📭</div>
            <p className="text-base md:text-lg font-medium">No groups found</p>
            <p className="text-xs md:text-sm">Create your first group to get started</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-group-title"
        >
          <div className="bg-white rounded-xl shadow-soft p-4 md:p-6 max-w-md w-full mx-2 md:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 id="create-group-title" className="text-base md:text-lg font-semibold text-navy">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 md:p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close create group dialog"
              >
                <FiX className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3 md:space-y-4">
              <div>
                <label htmlFor="group-name" className="input-label text-sm md:text-base">Group Name *</label>
                <input
                  id="group-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field text-sm md:text-base"
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div>
                <label htmlFor="group-description" className="input-label text-sm md:text-base">Description</label>
                <textarea
                  id="group-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[60px] md:min-h-[80px] text-sm md:text-base"
                  placeholder="What is this group about?"
                />
              </div>

              <div>
                <label htmlFor="member-email" className="input-label text-sm md:text-base">Add Members</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    id="member-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="input-field flex-1 text-sm md:text-base"
                    placeholder="Enter email address"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 text-sm md:text-base"
                  >
                    <FiPlus className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                    Add
                  </button>
                </div>
                {formData.memberEmails.length > 0 && (
                  <div className="mt-2 md:mt-3 flex flex-wrap gap-1.5 md:gap-2">
                    {formData.memberEmails.map((email, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm">
                        <span className="text-gray-700 truncate max-w-[100px] md:max-w-[150px]">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1.5 md:ml-2 text-gray-500 hover:text-red-500 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                          aria-label={`Remove ${email}`}
                        >
                          <FiTrash2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 md:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <FiUsers className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminGroups