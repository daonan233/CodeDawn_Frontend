import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || '网络请求失败'
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else {
      ElMessage.error(msg)
    }
    return Promise.reject(err)
  }
)

export default api

export const POST_TAGS = [
  { label: '开发', value: '开发', color: '#6366f1' },
  { label: '经分', value: '经分', color: '#10b981' },
  { label: '受理', value: '受理', color: '#f59e0b' },
  { label: '稽核', value: '稽核', color: '#ef4444' },
  { label: '其他', value: '其他', color: '#94a3b8' },
]

// Auth
export const authApi = {
  login: data => api.post('/auth/login', data),
  register: data => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
}

// Posts
export const postApi = {
  list: params => api.get('/posts', { params }),
  get: id => api.get(`/posts/${id}`),
  create: data => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: id => api.delete(`/posts/${id}`),
  like: id => api.post(`/posts/${id}/like`),
}

// Comments
export const commentApi = {
  listByPost: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  create: data => api.post('/comments', data),
  delete: id => api.delete(`/comments/${id}`),
  like: id => api.post(`/comments/${id}/like`),
  feature: id => api.put(`/comments/${id}/feature`),
}

// Users
export const userApi = {
  get: id => api.get(`/users/${id}`),
  updateProfile: data => api.put('/users/profile/update', data),
  changePassword: data => api.put('/users/password/change', data),
  getPosts: (id, params) => api.get(`/users/${id}/posts`, { params }),
}

// Notifications
export const notifApi = {
  list: params => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  readAll: () => api.put('/notifications/read-all'),
  read: id => api.put(`/notifications/${id}/read`),
}

// Upload
export const uploadApi = {
  image: formData => api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
