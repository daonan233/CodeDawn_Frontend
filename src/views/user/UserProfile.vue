<template>
  <div class="user-profile-layout" v-if="user">
    <div class="profile-header-card">
      <el-avatar :size="80" :src="user.avatar">{{ user.username?.[0]?.toUpperCase() }}</el-avatar>
      <div class="user-info">
        <div class="user-name-row">
          <h1>{{ user.username }}</h1>
          <el-tag v-if="user.role === 'admin'" type="warning" size="small">管理员</el-tag>
        </div>
        <p class="user-bio">{{ user.bio || '这个人很神秘，什么都没写~' }}</p>
        <p class="join-date">加入于 {{ formatDate(user.created_at) }}</p>
      </div>
      <el-button v-if="isOwn" @click="$router.push('/profile')" style="margin-left: auto">
        <el-icon><Edit /></el-icon> 编辑资料
      </el-button>
    </div>

    <div class="user-posts-card">
      <h3>Ta 的帖子</h3>
      <div v-if="loading" class="loading-tip">加载中...</div>
      <div v-else-if="posts.length === 0" class="empty-state">
        <el-icon><DocumentAdd /></el-icon>
        <p>还没有发帖</p>
      </div>
      <div v-else class="post-list">
        <div v-for="post in posts" :key="post.id" class="post-item" @click="$router.push(`/post/${post.id}`)">
          <div class="post-item-title">{{ post.title }}</div>
          <div class="post-item-meta">
            <span><el-icon><View /></el-icon> {{ post.view_count }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
            <span>{{ formatDate(post.created_at) }}</span>
          </div>
        </div>
      </div>
      <div class="pagination" v-if="total > limit">
        <el-pagination v-model:current-page="page" :page-size="limit" :total="total" layout="prev, pager, next" background @current-change="fetchPosts" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { userApi } from '@/api'
import { Edit, DocumentAdd, View, ChatDotRound } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const route = useRoute()
const auth = useAuthStore()

const user = ref(null)
const posts = ref([])
const total = ref(0)
const page = ref(1)
const limit = 10
const loading = ref(false)

const isOwn = computed(() => auth.isLoggedIn && auth.user.id === user.value?.id)

async function fetchUser() {
  const res = await userApi.get(route.params.id)
  user.value = res.data
}

async function fetchPosts() {
  loading.value = true
  try {
    const res = await userApi.getPosts(route.params.id, { page: page.value, limit })
    posts.value = res.data.posts
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function formatDate(t) { return dayjs(t).format('YYYY-MM-DD') }

watch(() => route.params.id, () => { fetchUser(); fetchPosts() })
onMounted(() => { fetchUser(); fetchPosts() })
</script>

<style scoped>
.user-profile-layout { display: flex; flex-direction: column; gap: 20px; max-width: 800px; margin: 0 auto; }

.profile-header-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 28px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 20px;
}
.user-name-row { display: flex; align-items: center; gap: 8px; }
.user-name-row h1 { font-size: 22px; font-weight: 700; }
.user-bio { color: var(--text-secondary); margin: 6px 0 4px; font-size: 14px; }
.join-date { font-size: 13px; color: var(--text-muted); }

.user-posts-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 24px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.user-posts-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }

.post-list { display: flex; flex-direction: column; gap: 8px; }
.post-item {
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}
.post-item:hover { border-color: var(--primary-light); transform: translateX(4px); }
.post-item-title { font-weight: 600; font-size: 15px; margin-bottom: 6px; }
.post-item-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); align-items: center; }
.post-item-meta span { display: flex; align-items: center; gap: 3px; }

.loading-tip { text-align: center; padding: 24px; color: var(--text-muted); }
.pagination { display: flex; justify-content: center; margin-top: 16px; }
</style>
