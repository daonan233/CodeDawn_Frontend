<template>
  <div class="app-wrapper">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="page-container navbar-inner">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <div class="logo-icon">🌠</div>
          <span class="logo-text">翼道同行</span>
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
</style>
