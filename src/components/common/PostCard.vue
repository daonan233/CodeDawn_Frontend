<template>
  <div class="post-card" @click="$router.push(`/post/${post.id}`)">
    <div class="post-main">
      <div class="post-author">
        <el-avatar :size="32" :src="post.avatar">{{ post.username?.[0]?.toUpperCase() }}</el-avatar>
        <span class="username">{{ post.username }}</span>
        <span class="time">{{ formatTime(post.updated_at) }}</span>
      </div>
      <h3 class="post-title">{{ post.title }}</h3>
      <p class="post-excerpt" v-html="stripHtml(post.excerpt)"></p>
    </div>
    <div class="post-stats">
      <span class="stat"><el-icon><View /></el-icon> {{ post.view_count }}</span>
      <span class="stat"><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
      <span class="stat"><el-icon><Star /></el-icon> {{ post.like_count }}</span>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { View, ChatDotRound, Star } from '@element-plus/icons-vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

defineProps({ post: Object })

function formatTime(t) {
  const d = dayjs(t)
  if (dayjs().diff(d, 'day') < 7) return d.fromNow()
  return d.format('YYYY-MM-DD')
}

function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent?.substring(0, 150) || ''
}
</script>

<style scoped>
.post-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 20px;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.25s;
  box-shadow: var(--shadow);
}
.post-card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.post-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.username { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.time { font-size: 12px; color: var(--text-muted); margin-left: auto; }
.post-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.post-excerpt {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
}
.post-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted);
}
.stat .el-icon { font-size: 14px; }
</style>
