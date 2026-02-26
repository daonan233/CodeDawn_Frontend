<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <img src= "@/assets/fulllog.png" alt="fulllogo" style="width:80%;user-select: none;"/>
        <p>登录您的账号</p>
      </div>

      <el-form :model="form" label-position="top" @submit.prevent="submit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password :prefix-icon="Lock" @keyup.enter="submit" />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          style="width: 100%; margin-top: 8px; border-radius: 8px;"
          :loading="loading"
          @click="submit"
        >
          登录
        </el-button>
      </el-form>

      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>

      <div class="demo-tip">
        <strong>管理账号：</strong> rinko / 121380
      </div>
    </div>
    <div class="bg-decor"></div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function submit() {
  if (!form.username || !form.password) return ElMessage.warning('请填写用户名和密码')
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    ElMessage.success('登录成功！')
    router.push(route.query.redirect || '/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.bg-decor {
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.auth-card {
  position: relative; z-index: 1;
  background: white; border-radius: 20px; padding: 40px;
  width: 100%; max-width: 420px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.2);
}
.auth-logo { text-align: center; margin-bottom: 32px; }
.logo-icon-big { font-size: 48px; margin-bottom: 8px; }
.auth-logo h1 {
  font-size: 24px; font-weight: 700;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.auth-logo p { color: var(--text-muted); margin-top: 4px; }
.auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-muted); }
.auth-footer a { color: var(--primary); font-weight: 600; }
.demo-tip {
  margin-top: 16px; padding: 10px 14px;
  background: #f0f9ff; border: 1px solid #bae6fd;
  border-radius: 8px; font-size: 13px; color: #0369a1; text-align: center;
}
:deep(.el-form-item__label) { font-weight: 600; }
:deep(.el-input__wrapper) { border-radius: 8px !important; }
</style>
