import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { adminAPI } from '../../api/admin'
import { toast } from 'react-toastify'
import { FiEdit, FiTrash2, FiUserCheck, FiUserX, FiPlus, FiSearch } from 'react-icons/fi'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers()
      setUsers(response)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUserStatus(userId, !currentStatus)
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  const filteredUsers = useMemo(() => (
    users.filter(user =>
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    )
  ), [users, search])

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
          <h1 className="text-xl md:text-2xl font-bold text-navy">Employee Management</h1>
          <p className="text-gray-500 text-sm md:text-base mt-0.5 md:mt-1">Manage all employees and their access</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 md:p-6">
        <div className="relative mb-4 md:mb-6">
          <label htmlFor="user-search" className="sr-only">Search employees</label>
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="user-search"
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt/40 focus:border-cobalt text-sm"
          />
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[600px] md:min-w-0">
            <caption className="sr-only">List of employees with role, status and actions</caption>
            <thead>
              <tr className="border-b border-gray-200">
                <th scope="col" className="text-left py-2 md:py-3 px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="text-left py-2 md:py-3 px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="text-left py-2 md:py-3 px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="text-left py-2 md:py-3 px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="text-left py-2 md:py-3 px-3 md:px-4 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 md:py-3 px-3 md:px-4">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                        <span className="text-navy font-semibold text-[10px] md:text-sm">{user.full_name.charAt(0)}</span>
                      </div>
                      <span className="text-xs md:text-sm font-medium truncate max-w-[80px] md:max-w-[150px]">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm text-gray-600 truncate max-w-[100px] md:max-w-[200px]">{user.email}</td>
                  <td className="py-2 md:py-3 px-3 md:px-4">
                    <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-[8px] md:text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2 md:py-3 px-3 md:px-4">
                    <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-[8px] md:text-xs font-medium rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 md:py-3 px-3 md:px-4">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        className="p-1 md:p-1.5 text-gray-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        aria-label={user.is_active ? `Deactivate ${user.full_name}` : `Activate ${user.full_name}`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? <FiUserX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <FiUserCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-500">No employees match your search</p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminUsers