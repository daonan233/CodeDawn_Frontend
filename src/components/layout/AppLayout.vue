<template>
  <div class="app-wrapper">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="page-container navbar-inner">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <img src = "@/assets/favicon.svg" alt = "smallogo" style="width:8%;user-select:none"/>
          <span class="navi-logo-text">CodeDawn</span>
        </router-link>

        <!-- 搜索栏 -->
        <div class="search-wrap">
          <el-input
              v-model="searchKeyword"
              placeholder="搜索帖子..."
              :prefix-icon="Search"
              clearable
              @keyup.enter="doSearch"
              @clear="clearSearch"
              class="search-input"
          />
        </div>

        <!-- 右侧操作区 -->
        <div class="nav-actions">
          <template v-if="auth.isLoggedIn">
            <!-- 发帖按钮 -->
            <el-button type="primary" @click="$router.push('/post/create')" class="post-btn">
              <el-icon><EditPen /></el-icon>
              <span>发帖</span>
            </el-button>

            <!-- 消息通知 -->
            <el-badge :value="unreadCount" :hidden="!unreadCount" class="notif-badge">
              <el-button circle @click="$router.push('/notifications')" class="icon-btn">
                <el-icon size="18"><Bell /></el-icon>
              </el-button>
            </el-badge>

            <!-- 管理员入口 -->
            <el-button v-if="auth.isAdmin" circle @click="$router.push('/admin')" class="icon-btn admin-btn" title="管理后台">
              <el-icon size="18"><Setting /></el-icon>
            </el-button>

            <!-- 用户头像菜单 -->
            <el-dropdown trigger="click" @command="handleUserCommand">
              <div class="user-avatar-wrap">
                <el-avatar :size="36" :src="auth.user.avatar" class="cursor-pointer">
                  {{ auth.user.username?.[0]?.toUpperCase() }}
                </el-avatar>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon> 个人主页
                  </el-dropdown-item>
                  <el-dropdown-item command="my-profile">
                    <el-icon><Edit /></el-icon> 编辑资料
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon> 退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>

          <template v-else>
            <el-button @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="page-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="page-container footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <router-link to="/" class="footer-logo">
              <img src = "@/assets/favicon.svg" alt = "smallogo" style="width:20%;user-select:none"/>
              <span class="footer-logo-text">CodeDawn</span>
            </router-link>
            <p class="footer-slogan">分享知识，连接思想，共同成长</p>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <h4>论坛</h4>
              <router-link to="/">首页</router-link>
              <router-link to="/?sort=hot">热门帖子</router-link>
              <router-link to="/post/create" v-if="auth.isLoggedIn">发布帖子</router-link>
              <router-link to="/login" v-else>登录发帖</router-link>
            </div>
            <div class="footer-col">
              <h4>账号</h4>
              <template v-if="auth.isLoggedIn">
                <router-link :to="`/user/${auth.user.id}`">个人主页</router-link>
                <router-link to="/profile">编辑资料</router-link>
                <router-link to="/notifications">消息通知</router-link>
              </template>
              <template v-else>
                <router-link to="/login">登录</router-link>
                <router-link to="/register">注册</router-link>
              </template>
            </div>
            <div class="footer-col" v-if="auth.isAdmin">
              <h4>管理</h4>
              <router-link to="/admin">管理后台</router-link>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© {{ currentYear }} xmyulj保留所有权利</span>
          <span class="footer-tech">Powered by Vue3 + Node.js + PostgreSQL</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { notifApi } from '@/api'
import { Search, Bell, Setting, User, Edit, SwitchButton, EditPen } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const auth = useAuthStore()
const currentYear = new Date().getFullYear()
const router = useRouter()
const route = useRoute()
const searchKeyword = ref(route.query.search || '')
const unreadCount = ref(0)
let notifTimer = null

function doSearch() {
  router.push({ name: 'Home', query: { search: searchKeyword.value } })
}
function clearSearch() {
  router.push({ name: 'Home' })
}

async function fetchUnreadCount() {
  if (!auth.isLoggedIn) return
  try {
    const res = await notifApi.getUnreadCount()
    unreadCount.value = res.data.count
  } catch {}
}

function handleUserCommand(cmd) {
  if (cmd === 'profile') router.push(`/user/${auth.user.id}`)
  else if (cmd === 'my-profile') router.push('/profile')
  else if (cmd === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
        .then(() => { auth.logout(); router.push('/') })
        .catch(() => {})
  }
}

onMounted(() => {
  fetchUnreadCount()
  if (auth.isLoggedIn) {
    notifTimer = setInterval(fetchUnreadCount, 30000)
  }
})
onUnmounted(() => clearInterval(notifTimer))
</script>

<style scoped>
.app-wrapper { display: flex; flex-direction: column; min-height: 100vh; }

.navi-logo-text{
  font-size: larger;
  margin-left: 0.5vw;
  font-weight: bolder;
  color:#4f46e5;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.navbar-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  text-decoration: none;
}
.logo-icon { font-size: 24px; }
.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-wrap { flex: 1; max-width: 400px; }
.search-input :deep(.el-input__wrapper) { border-radius: 20px !important; }

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.post-btn { border-radius: 20px; }

.icon-btn {
  background: var(--secondary) !important;
  border: none !important;
  color: var(--text-secondary) !important;
}
.icon-btn:hover {
  background: var(--primary) !important;
  color: white !important;
}
.admin-btn:hover { background: #f59e0b !important; }

.notif-badge :deep(.el-badge__content) { background: var(--danger); }

.user-avatar-wrap { cursor: pointer; }
.user-avatar-wrap :deep(.el-avatar) { border: 2px solid var(--primary-light); transition: transform 0.2s; }
.user-avatar-wrap:hover :deep(.el-avatar) { transform: scale(1.05); }

.main-content { flex: 1; padding: 24px 0 40px; }

.cursor-pointer { cursor: pointer; }

/* Footer */
.footer {
  background: #1e293b;
  color: #94a3b8;
  margin-top: auto;
}

.footer-inner { padding: 40px 16px 0; }

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #334155;
}

.footer-brand { max-width: 240px; }

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  margin-bottom: 12px;
}
.footer-logo-icon { font-size: 22px; }
.footer-logo-text {
  font-size: larger;
  font-weight: bolder;
  background: linear-gradient(135deg, #818cf8, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.footer-slogan {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  gap: 48px;
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 80px;
}
.footer-col h4 {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.footer-col a {
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-col a:hover { color: #818cf8; }

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 12px;
  color: #475569;
  flex-wrap: wrap;
  gap: 8px;
}
.footer-tech { color: #334155; }

@media (max-width: 768px) {
  .footer-top { flex-direction: column; gap: 24px; }
  .footer-links { gap: 24px; flex-wrap: wrap; }
  .footer-bottom { justify-content: center; text-align: center; }
}

</style>