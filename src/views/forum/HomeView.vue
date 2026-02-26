<template>
  <div class="home-layout">
    <!-- 主内容 -->
    <div class="main-col">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="tabs">
          <button :class="['tab-btn', sort === 'latest' && 'active']" @click="sort='latest'; fetchPosts()">
            <el-icon><Clock /></el-icon> 最新
          </button>
          <button :class="['tab-btn', sort === 'hot' && 'active']" @click="sort='hot'; fetchPosts()">
            <el-icon><TrendCharts /></el-icon> 热门
          </button>
        </div>
        <el-button v-if="auth.isLoggedIn" type="primary" @click="$router.push('/post/create')" round>
          <el-icon><EditPen /></el-icon> 发布新帖
        </el-button>
      </div>

      <!-- 搜索结果提示 -->
      <div v-if="searchQuery" class="search-tip">
        搜索 "<strong>{{ searchQuery }}</strong>" 的结果
        <el-button text @click="clearSearch">清除</el-button>
      </div>

      <!-- 帖子列表 -->
      <transition-group name="slide-up" tag="div" class="post-list">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </transition-group>

      <!-- 骨架屏 -->
      <div v-if="loading" class="post-list">
        <el-skeleton v-for="i in 5" :key="i" :rows="3" animated class="skeleton-card" />
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && posts.length === 0" class="empty-state">
        <el-icon><ChatDotSquare /></el-icon>
        <p>{{ searchQuery ? '没有找到相关帖子' : '还没有帖子，来发第一贴吧！' }}</p>
        <el-button v-if="auth.isLoggedIn && !searchQuery" type="primary" @click="$router.push('/post/create')">
          立即发帖
        </el-button>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next, jumper"
          background
          @current-change="fetchPosts"
        />
      </div>
    </div>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 欢迎卡片 -->
      <div class="sidebar-card welcome-card">
        <template v-if="auth.isLoggedIn">
          <el-avatar :size="56" :src="auth.user.avatar" class="mb-2">
            {{ auth.user.username?.[0]?.toUpperCase() }}
          </el-avatar>
          <h3>{{ auth.user.username }}</h3>
          <p class="text-muted">{{ auth.user.bio || '这个人很神秘，什么都没写' }}</p>
          <el-button type="primary" round @click="$router.push('/post/create')" style="width:100%;margin-top:12px">
            发布新帖子
          </el-button>
        </template>
        <template v-else>
          <img src= "@/assets/favicon.svg" alt="smalllogo" style="width:30%;user-select: none;"/>
          <h3>欢迎来到CodeDawn</h3>
          <p class="text-muted">登录后参与讨论，发表您的见解</p>
          <div style="display:flex;gap:8px;margin-top:12px">
            <el-button @click="$router.push('/login')" style="flex:1">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')" style="flex:1">注册</el-button>
          </div>
        </template>
      </div>

      <!-- 统计信息 -->
      <div class="sidebar-card stats-card">
        <h4>论坛统计</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-num">{{ total }}</span>
            <span class="stat-label">帖子总数</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { postApi } from '@/api'
import PostCard from '@/components/common/PostCard.vue'
import { Clock, TrendCharts, EditPen, ChatDotSquare } from '@element-plus/icons-vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const posts = ref([])
const total = ref(0)
const page = ref(1)
const limit = 10
const sort = ref('latest')
const loading = ref(false)
const searchQuery = ref('')

async function fetchPosts() {
  loading.value = true
  try {
    const res = await postApi.list({ page: page.value, limit, sort: sort.value, search: searchQuery.value })
    posts.value = res.data.posts
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  router.push('/')
  fetchPosts()
}

watch(() => route.query.search, (v) => {
  searchQuery.value = v || ''
  page.value = 1
  fetchPosts()
}, { immediate: false })

onMounted(() => {
  searchQuery.value = route.query.search || ''
  fetchPosts()
})
</script>

<style scoped>
.home-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}

.main-col { display: flex; flex-direction: column; gap: 12px; }

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 12px 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.tabs { display: flex; gap: 4px; }
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.tab-btn:hover, .tab-btn.active {
  background: var(--primary);
  color: white;
}

.search-tip {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-list { display: flex; flex-direction: column; gap: 12px; }

.skeleton-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 20px;
  border: 1px solid var(--border);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

/* 侧边栏 */
.sidebar { display: flex; flex-direction: column; gap: 16px; }

.sidebar-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 20px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  text-align: center;
}

.welcome-card h3 { font-size: 16px; font-weight: 600; margin: 8px 0 4px; }
.welcome-icon { font-size: 40px; margin-bottom: 8px; }
.text-muted { font-size: 13px; color: var(--text-muted); }
.mb-2 { margin-bottom: 8px; }

.stats-card h4 { font-size: 14px; font-weight: 600; margin-bottom: 12px; text-align: left; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-item { text-align: center; }
.stat-num { display: block; font-size: 22px; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 12px; color: var(--text-muted); }

@media (max-width: 768px) {
  .home-layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
}
</style>
