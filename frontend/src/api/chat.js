import api from './axios'

export const chatAPI = {
  getGroups: async () => {
    const response = await api.get('/chat/groups')
    return response.data
  },

  createGroup: async (data) => {
    const response = await api.post('/chat/groups', data)
    return response.data
  },

  getGroup: async (id) => {
    const response = await api.get(`/chat/groups/${id}`)
    return response.data
  },

  getGroupMessages: async (groupId, params) => {
    const response = await api.get(`/chat/groups/${groupId}/messages`, { params })
    return response.data
  },

  sendGroupMessage: async (groupId, data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'attachments') {
        data.attachments.forEach(file => {
          formData.append('attachments', file)
        })
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await api.post(`/chat/groups/${groupId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deleteMessage: async (groupId, messageId, deleteForEveryone) => {
    const response = await api.delete(`/chat/groups/${groupId}/messages/${messageId}`, {
      params: { deleteForEveryone }
    })
    return response.data
  },

  toggleReaction: async (messageId, emoji) => {
    const response = await api.post(`/chat/messages/${messageId}/reactions`, { emoji })
    return response.data
  },

  joinGroup: async (groupId) => {
    const response = await api.post(`/chat/groups/${groupId}/join`)
    return response.data
  },

  leaveGroup: async (groupId) => {
    const response = await api.post(`/chat/groups/${groupId}/leave`)
    return response.data
  },

  addGroupMembers: async (groupId, memberIds) => {
    const response = await api.post(`/chat/groups/${groupId}/members`, { memberIds })
    return response.data
  },

  removeGroupMember: async (groupId, memberId) => {
    const response = await api.delete(`/chat/groups/${groupId}/members/${memberId}`)
    return response.data
  },

  getPrivateUsers: async () => {
    const response = await api.get('/chat/private/users')
    return response.data
  },

  getPrivateMessages: async (userId, params) => {
    const response = await api.get(`/chat/private/messages/${userId}`, { params })
    return response.data
  },

  sendPrivateMessage: async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'attachments') {
        data.attachments.forEach(file => {
          formData.append('attachments', file)
        })
      } else if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await api.post('/chat/private/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  deletePrivateMessage: async (messageId) => {
    const response = await api.delete(`/chat/private/messages/${messageId}`)
    return response.data
  },

  searchChats: async (query) => {
    const response = await api.get('/chat/search', {
      params: { q: query }
    })
    return response.data
  },

  advancedSearch: async (query, filters) => {
    const response = await api.get('/chat/advanced-search', {
      params: {
        q: query,
        person: filters.person || false,
        message: filters.message || false,
        file: filters.file || false,
        date: filters.date || false,
        space: filters.space || false,
        conversation: filters.conversation || false,
        attachment: filters.attachment || false
      }
    })
    return response.data
  }
}