import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username, password) {
    const res = await authApi.login({ username, password })
    setAuth(res.data)
    return res
  }

  async function register(username, password) {
    const res = await authApi.register({ username, password })
    setAuth(res.data)
    return res
  }

  function setAuth({ user: u, token: t }) {
    user.value = u
    token.value = t
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('token', t)
  }

  function updateUser(u) {
    user.value = { ...user.value, ...u }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return { user, token, isLoggedIn, isAdmin, login, register, setAuth, updateUser, logout }
})
