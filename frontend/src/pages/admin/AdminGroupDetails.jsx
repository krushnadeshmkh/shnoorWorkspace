import React, { useState, useEffect,useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { chatAPI } from '../../api/chat'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiUserPlus, FiUserMinus, FiMic, FiMicOff, FiUserCheck, FiUserX, FiEdit, FiSave, FiX, FiSearch } from 'react-icons/fi'

const AdminGroupDetails = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [addingMember, setAddingMember] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const searchRef = useRef(null)

  useEffect(() => {
    fetchGroupDetails()
    fetchAllUsers()
  }, [groupId])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(user => 
        user.is_active !== false &&
        !members.some(member => member.id === user.id) &&
        (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers([])
    }
  }, [searchTerm, allUsers, members])

  const fetchGroupDetails = async () => {
    try {
      const response = await chatAPI.getGroup(groupId)
      setGroup(response)
      setMembers(response.members || [])
      setEditData({
        name: response.name || '',
        description: response.description || '',
        isActive: response.is_active !== undefined ? response.is_active : true
      })
    } catch (error) {
      console.error('Error fetching group details:', error)
      toast.error('Failed to load group details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const users = await adminAPI.getUsers()
      setAllUsers(users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }

    setAddingMember(true)
    try {
      await adminAPI.addMember(groupId, selectedUser.email, false)
      toast.success('Member added successfully')
      setSelectedUser(null)
      setSearchTerm('')
      setShowAddMember(false)
      fetchGroupDetails()
    } catch (error) {
      toast.error('Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await adminAPI.removeMember(groupId, userId)
        toast.success('Member removed successfully')
        fetchGroupDetails()
      } catch (error) {
        toast.error('Failed to remove member')
      }
    }
  }

  const handleToggleMute = async (userId, currentMute) => {
    try {
      await adminAPI.toggleMute(groupId, userId, !currentMute)
      toast.success(`Member ${currentMute ? 'unmuted' : 'muted'} successfully`)
      fetchGroupDetails()
    } catch (error) {
      toast.error('Failed to toggle mute status')
    }
  }

  const handleToggleAdmin = async (userId, currentAdmin) => {
    try {
      await adminAPI.toggleAdmin(groupId, userId, !currentAdmin)
      toast.success(`Admin status ${currentAdmin ? 'removed' : 'granted'} successfully`)
      fetchGroupDetails()
    } catch (error) {
      toast.error('Failed to toggle admin status')
    }
  }

  const handleUpdateGroup = async () => {
    try {
      await adminAPI.updateGroup(groupId, editData)
      toast.success('Group updated successfully')
      setEditing(false)
      fetchGroupDetails()
    } catch (error) {
      toast.error('Failed to update group')
    }
  }

  const handleSelectUser = (user) => {
    setSelectedUser(user)
    setSearchTerm(user.email)
    setFilteredUsers([])
  }

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
      <button
        onClick={() => navigate('/admin/groups')}
        className="flex items-center text-gray-600 hover:text-navy mb-4 md:mb-6 text-sm md:text-base"
      >
        <FiArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
        Back to Groups
      </button>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2 md:space-y-3">
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="input-field text-sm md:text-base"
                  placeholder="Group name"
                />
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="input-field min-h-[50px] md:min-h-[60px] text-sm md:text-base"
                  placeholder="Description"
                />
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <label className="flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editData.isActive}
                      onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                      className="w-3.5 h-3.5 md:w-4 md:h-4 rounded text-navy"
                    />
                    <span>Active</span>
                  </label>
                  <button
                    onClick={handleUpdateGroup}
                    className="btn-primary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
                  >
                    <FiSave className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="btn-secondary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
                  >
                    <FiX className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl md:text-2xl font-bold text-navy truncate">{group?.name}</h1>
                {group?.description && (
                  <p className="text-sm md:text-base text-gray-500 mt-0.5 md:mt-1 break-words">{group.description}</p>
                )}
                <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                  Created by {group?.created_by_name} • {members.length} members
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
              >
                <FiEdit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Edit Group
              </button>
            )}
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-primary flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2"
            >
              <FiUserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Members</h2>
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-navy font-semibold text-xs md:text-sm">{member.full_name?.charAt(0) || 'U'}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-navy text-sm md:text-base truncate">{member.full_name}</p>
                  <p className="text-xs md:text-sm text-gray-500 truncate">{member.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {member.is_admin && (
                    <span className="px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                      Admin
                    </span>
                  )}
                  {member.is_muted && (
                    <span className="px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                      Muted
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 md:p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Remove Member"
                >
                  <FiUserMinus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-white rounded-xl shadow-soft p-4 md:p-6 max-w-md w-full mx-2 md:mx-4">
            <h3 className="text-base md:text-lg font-semibold text-navy mb-3 md:mb-4">Add Member</h3>
            <div className="relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 text-sm md:text-base"
                  ref={searchRef}
                />
              </div>
              {filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-navy font-semibold text-sm">{user.full_name?.charAt(0) || 'U'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-navy text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-navy font-semibold text-xs">{selectedUser.full_name?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-navy text-sm truncate">{selectedUser.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                      setSearchTerm('')
                    }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowAddMember(false)
                  setSelectedUser(null)
                  setSearchTerm('')
                  setFilteredUsers([])
                }}
                className="btn-secondary text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedUser || addingMember}
                className="btn-primary text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminGroupDetails