import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://shnoorworkspace.onrender.com/api';

export const emailAPI = {
sendEmail: async (data) => {
  const hasAttachments = data.attachments && data.attachments.length > 0;
  
  if (hasAttachments) {
    const formData = new FormData();
    formData.append('receiverEmail', data.receiverEmail);
    formData.append('subject', data.subject || '');
    formData.append('content', data.content || '');
    
    if (data.cc && data.cc.length > 0) {
      data.cc.forEach(email => formData.append('cc', email));
    }
    
    if (data.bcc && data.bcc.length > 0) {
      data.bcc.forEach(email => formData.append('bcc', email));
    }
    
    data.attachments.forEach(file => {
      formData.append('attachments', file);
    });
    
    const response = await axios.post(`${API_URL}/emails/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } else {
    const payload = {
      receiverEmail: data.receiverEmail,
      subject: data.subject || '',
      content: data.content || '',
      cc: data.cc || [],
      bcc: data.bcc || []
    };
    
    const response = await axios.post(`${API_URL}/emails/send`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }
},

  undoSend: async (emailId) => {
    const response = await axios.post(`${API_URL}/emails/${emailId}/undo-send`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  saveDraft: async (data) => {
    const formData = new FormData();
    formData.append('receiverEmail', data.receiverEmail || '');
    
    if (data.cc && data.cc.length > 0) {
      if (Array.isArray(data.cc)) {
        data.cc.forEach(email => formData.append('cc[]', email));
      } else {
        formData.append('cc', data.cc);
      }
    } else {
      formData.append('cc', '');
    }
    
    if (data.bcc && data.bcc.length > 0) {
      if (Array.isArray(data.bcc)) {
        data.bcc.forEach(email => formData.append('bcc[]', email));
      } else {
        formData.append('bcc', data.bcc);
      }
    } else {
      formData.append('bcc', '');
    }
    
    formData.append('subject', data.subject || '');
    formData.append('content', data.content || '');
    
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    const response = await axios.post(`${API_URL}/emails/drafts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  getDrafts: async (params = {}) => {
    const { limit = 20, page = 1 } = params;
    const response = await axios.get(`${API_URL}/emails/drafts`, {
      params: { limit, page },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  deleteDraft: async (draftId) => {
    const response = await axios.delete(`${API_URL}/emails/drafts/${draftId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getInbox: async (params = {}) => {
    const { limit = 20, page = 1, search = '', category = 'all' } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('page', page);
    if (search) queryParams.append('search', search);
    if (category && category !== 'all') queryParams.append('category', category);
    
    const response = await axios.get(`${API_URL}/emails/inbox?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getSent: async (params = {}) => {
    const { limit = 20, page = 1, search = '' } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    queryParams.append('page', page);
    if (search) queryParams.append('search', search);
    
    const response = await axios.get(`${API_URL}/emails/sent?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getArchived: async (params = {}) => {
    const { limit = 20, page = 1 } = params;
    const response = await axios.get(`${API_URL}/emails/archived`, {
      params: { limit, page },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getSpam: async (params = {}) => {
    const { limit = 20, page = 1 } = params;
    const response = await axios.get(`${API_URL}/emails/spam`, {
      params: { limit, page },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getImportant: async (params = {}) => {
    const { limit = 20, page = 1 } = params;
    const response = await axios.get(`${API_URL}/emails/important`, {
      params: { limit, page },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getStarred: async (params = {}) => {
    const { limit = 20, page = 1 } = params;
    const response = await axios.get(`${API_URL}/emails/starred`, {
      params: { limit, page },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getTrash: async (params = {}) => {
    const { limit = 20, page = 1 } = params;
    const response = await axios.get(`${API_URL}/emails/trash`, {
      params: { limit, page },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get(`${API_URL}/emails/unread`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getEmail: async (emailId) => {
    const response = await axios.get(`${API_URL}/emails/${emailId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  markAsRead: async (emailId) => {
    const response = await axios.put(`${API_URL}/emails/${emailId}/read`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  markAsUnread: async (emailId) => {
    const response = await axios.put(`${API_URL}/emails/${emailId}/unread`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  toggleArchive: async (emailId) => {
    const response = await axios.put(`${API_URL}/emails/${emailId}/archive`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  toggleSpam: async (emailId) => {
    const response = await axios.put(`${API_URL}/emails/${emailId}/spam`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  toggleImportant: async (emailId) => {
    const response = await axios.put(`${API_URL}/emails/${emailId}/important`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  toggleStarred: async (emailId) => {
    const response = await axios.put(`${API_URL}/emails/${emailId}/starred`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  deleteEmail: async (emailId) => {
    const response = await axios.delete(`${API_URL}/emails/${emailId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  restoreEmail: async (emailId) => {
    const response = await axios.post(`${API_URL}/emails/${emailId}/undo`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  createLabel: async (data) => {
    const response = await axios.post(`${API_URL}/emails/labels`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  getLabels: async () => {
    const response = await axios.get(`${API_URL}/emails/labels`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  deleteLabel: async (labelId) => {
    const response = await axios.delete(`${API_URL}/emails/labels/${labelId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  applyLabel: async (emailId, labelId) => {
    const response = await axios.post(`${API_URL}/emails/${emailId}/labels`, { labelId }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  removeLabel: async (emailId, labelId) => {
    const response = await axios.delete(`${API_URL}/emails/${emailId}/labels/${labelId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }
};