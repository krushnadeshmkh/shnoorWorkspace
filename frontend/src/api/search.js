import api from './axios'

export const searchAPI = {
  globalSearch: async (query) => {
    const response = await api.get('/search', { params: { q: query } })
    return response.data
  }
}