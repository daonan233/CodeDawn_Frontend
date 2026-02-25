<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api'

const auth = useAuthStore()

onMounted(async () => {
  if (auth.token) {
    try {
      const res = await authApi.getMe()
      auth.updateUser(res.data)
    } catch {}
  }
})
</script>
