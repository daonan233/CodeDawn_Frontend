<template>
  <div class="notif-wrap">
    <div class="notif-card">
      <div class="notif-header">
        <h2>消息通知</h2>
        <el-button v-if="notifications.length > 0" text @click="markAllRead">全部标为已读</el-button>
      </div>

      <div v-if="loading" class="loading-tip">加载中...</div>
      <div v-else-if="notifications.length === 0" class="empty-state">
        <el-icon><Bell /></el-icon>
        <p>暂无消息通知</p>
      </div>
      <div v-else class="notif-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          :class="['notif-item', !n.is_read && 'unread']"
          @click="handleNotifClick(n)"
        >
          <el-avatar :size="40" :src="n.sender_avatar">{{ n.sender_username?.[0]?.toUpperCase() }}</el-avatar>
          <div class="notif-content">
            <div class="notif-text">
              <strong>{{ n.sender_username }}</strong>
              <span>{{ getNotifText(n.type) }}</span>
              <span v-if="n.post_title" class="notif-post-title">《{{ n.post_title }}》</span>
            </div>
            <div class="notif-time">{{ formatTime(n.created_at) }}</div>
          </div>
          <el-badge v-if="!n.is_read" is-dot class="unread-dot" />
        </div>
      </div>

      <div class="pagination" v-if="total > limit">
        <el-pagination v-model:current-page="page" :page-size="limit" :total="total" layout="prev, pager, next" background @current-change="fetchNotifs" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notifApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const notifications = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const loading = ref(false)

function getNotifText(type) {
  const map = {
    comment_reply: ' 回复了你的评论',
    post_comment: ' 评论了你的帖子',
    like_post: ' 点赞了你的帖子',
    like_comment: ' 点赞了你的评论'
  }
  return map[type] || ' 与你互动'
}

function formatTime(t) {
  return dayjs(t).fromNow()
}

async function fetchNotifs() {
  loading.value = true
  try {
    const res = await notifApi.list({ page: page.value, limit })
    notifications.value = res.data.notifications
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function markAllRead() {
  await notifApi.readAll()
  notifications.value.forEach(n => n.is_read = true)
  ElMessage.success('已全部标记为已读')
}

async function handleNotifClick(n) {
  if (!n.is_read) {
    await notifApi.read(n.id)
    n.is_read = true
  }
  if (n.post_id) router.push(`/post/${n.post_id}`)
}

onMounted(fetchNotifs)
</script>

<style scoped>
.notif-wrap { max-width: 680px; margin: 0 auto; }
.notif-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 28px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}
.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.notif-header h2 { font-size: 20px; font-weight: 700; }

.notif-list { display: flex; flex-direction: column; }
.notif-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}
.notif-item:hover { background: var(--secondary); }
.notif-item.unread { background: #f5f3ff; }
.notif-item.unread:hover { background: #ede9fe; }

.notif-content { flex: 1; }
.notif-text { font-size: 14px; line-height: 1.5; }
.notif-post-title { color: var(--primary); font-style: italic; }
.notif-time { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.unread-dot { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }

.loading-tip { text-align: center; padding: 40px; color: var(--text-muted); }
.pagination { display: flex; justify-content: center; margin-top: 16px; }
</style>
