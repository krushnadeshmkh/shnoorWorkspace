import api from './axios'

export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/admin/users')
    return response.data
  },
  
  updateUserStatus: async (userId, isActive) => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive })
    return response.data
  },
  
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role })
    return response.data
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`)
    return response.data
  },
  
  createGroup: async (data) => {
    const response = await api.post('/admin/groups', data)
    return response.data
  },
  
  updateGroup: async (groupId, data) => {
    const response = await api.put(`/admin/groups/${groupId}`, data)
    return response.data
  },
  
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/admin/groups/${groupId}`)
    return response.data
  },
  
  addMember: async (groupId, userEmail, isAdmin) => {
    const response = await api.post(`/admin/groups/${groupId}/members`, { userEmail, isAdmin })
    return response.data
  },
  
  removeMember: async (groupId, userId) => {
    const response = await api.delete(`/admin/groups/${groupId}/members/${userId}`)
    return response.data
  },
  
  toggleMute: async (groupId, userId, muted) => {
    const response = await api.put(`/admin/groups/${groupId}/members/${userId}/mute`, { muted })
    return response.data
  },
  
  toggleAdmin: async (groupId, userId, isAdmin) => {
    const response = await api.put(`/admin/groups/${groupId}/members/${userId}/admin`, { isAdmin })
    return response.data
  },
  
  getStats: async () => {
    const response = await api.get('/admin/stats')
    return response.data
  },
  
  getEmailLogs: async () => {
    const response = await api.get('/admin/email-logs')
    console.log(response)
    return response.data
  },
  
  getChatLogs: async () => {
    const response = await api.get('/admin/chat-logs')
    return response.data
  },
  
  getActivityLogs: async () => {
    const response = await api.get('/admin/activity-logs')
    return response.data
  },
}