<template>
  <div class="post-detail-layout" v-if="post">
    <div class="post-main-col">
      <!-- 帖子内容卡片 -->
      <div class="post-card">
        <div class="post-header">
          <div class="author-info" @click="$router.push(`/user/${post.author_id}`)">
            <el-avatar :size="44" :src="post.avatar">{{ post.username?.[0]?.toUpperCase() }}</el-avatar>
            <div>
              <div class="author-name">{{ post.username }}</div>
              <div class="post-time">{{ formatTime(post.created_at) }}</div>
            </div>
          </div>
          <div v-if="canEdit" class="post-actions">
            <el-button text @click="$router.push(`/post/${post.id}/edit`)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button text type="danger" @click="deletePost">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>
        </div>

        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-content" v-html="post.content"></div>

        <div class="post-footer">
          <div class="post-stats">
            <span><el-icon><View /></el-icon> {{ post.view_count }} 浏览</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }} 评论</span>
          </div>
          <el-button
            :type="post.liked ? 'primary' : 'default'"
            round @click="toggleLike"
            :disabled="!auth.isLoggedIn"
          >
            <el-icon><component :is="post.liked ? StarFilled : Star" /></el-icon>
            {{ post.liked ? '已点赞' : '点赞' }} ({{ post.like_count }})
          </el-button>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="comments-section">
        <h2 class="comments-title">
          <el-icon><ChatDotRound /></el-icon>
          评论 ({{ post.comment_count }})
        </h2>

        <!-- 发表评论 -->
        <div v-if="auth.isLoggedIn" class="comment-editor-wrap">
          <el-avatar :size="36" :src="auth.user.avatar">{{ auth.user.username?.[0]?.toUpperCase() }}</el-avatar>
          <div class="comment-editor">
            <RichEditor v-model="newComment" ref="commentEditorRef" placeholder="写下你的评论，支持图片和富文本..." />
            <div class="editor-footer">
              <el-button type="primary" @click="submitComment" :loading="submitting">发表评论</el-button>
            </div>
          </div>
        </div>
        <div v-else class="login-tip">
          <router-link to="/login">登录</router-link> 后参与评论
        </div>

        <!-- 精选评论区 -->
        <template v-if="featuredComments.length > 0">
          <div class="section-divider">
            <span><el-icon><StarFilled /></el-icon> 精选回复 ({{ featuredComments.length }})</span>
          </div>
          <div class="comment-list">
            <CommentItem
              v-for="comment in featuredComments"
              :key="comment.id"
              :comment="comment"
              :post-id="post.id"
              :post-author-id="post.author_id"
              @deleted="onCommentDeleted"
              @replied="onCommentReplied"
              @feature-changed="refreshComments"
            />
          </div>
        </template>

        <!-- 普通评论分隔线 -->
        <div v-if="featuredComments.length > 0" class="section-divider">
          <span><el-icon><ChatDotRound /></el-icon> 全部回复 ({{ commentTotal }})</span>
        </div>

        <!-- 骨架屏 -->
        <div v-if="loadingComments">
          <el-skeleton v-for="i in 3" :key="i" :rows="3" animated style="margin-bottom:12px" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="comments.length === 0 && featuredComments.length === 0" class="empty-state">
          <el-icon><ChatDotSquare /></el-icon>
          <p>还没有评论，来发第一条吧！</p>
        </div>

        <!-- 普通评论列表 -->
        <div v-else class="comment-list">
          <CommentItem
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            :post-id="post.id"
            :post-author-id="post.author_id"
            @deleted="onCommentDeleted"
            @replied="onCommentReplied"
            @feature-changed="refreshComments"
          />
        </div>

        <!-- 评论分页 -->
        <div v-if="commentTotal > commentLimit" class="pagination">
          <el-pagination
            v-model:current-page="commentPage"
            :page-size="commentLimit"
            :total="commentTotal"
            layout="prev, pager, next"
            background
            @current-change="fetchComments"
          />
        </div>
      </div>
    </div>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-card">
        <h4>发帖人</h4>
        <div class="author-profile" @click="$router.push(`/user/${post.author_id}`)">
          <el-avatar :size="56" :src="post.avatar">{{ post.username?.[0]?.toUpperCase() }}</el-avatar>
          <div class="s-author-name">{{ post.username }}</div>
          <p class="author-bio">{{ post.author_bio || '这个人很神秘~' }}</p>
        </div>
      </div>

      <div class="sidebar-card">
        <h4>帖子信息</h4>
        <div class="post-meta-list">
          <div class="meta-item"><span>发布时间</span><span>{{ dayjs(post.created_at).format('MM-DD HH:mm') }}</span></div>
          <div class="meta-item"><span>最近更新</span><span>{{ dayjs(post.updated_at).format('MM-DD HH:mm') }}</span></div>
          <div class="meta-item"><span>浏览次数</span><span>{{ post.view_count }}</span></div>
          <div class="meta-item"><span>评论数量</span><span>{{ post.comment_count }}</span></div>
        </div>
      </div>
    </aside>
  </div>

  <div v-else-if="loading" class="loading-wrap">
    <el-skeleton :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { postApi, commentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, View, ChatDotRound, Star, StarFilled, ChatDotSquare } from '@element-plus/icons-vue'
import RichEditor from '@/components/common/RichEditor.vue'
import CommentItem from '@/components/common/CommentItem.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const post = ref(null)
const loading = ref(true)
const featuredComments = ref([])
const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentLimit = 10
const loadingComments = ref(false)
const newComment = ref('')
const commentEditorRef = ref(null)
const submitting = ref(false)

const canEdit = computed(() => {
  if (!auth.isLoggedIn || !post.value) return false
  return post.value.author_id === auth.user.id || auth.isAdmin
})

function formatTime(t) {
  return dayjs(t).format('YYYY-MM-DD HH:mm')
}

async function fetchPost() {
  loading.value = true
  try {
    const res = await postApi.get(route.params.id)
    post.value = res.data
  } catch {
    router.push('/')
  } finally {
    loading.value = false
  }
}

async function fetchComments() {
  loadingComments.value = true
  try {
    const res = await commentApi.listByPost(route.params.id, { page: commentPage.value, limit: commentLimit })
    featuredComments.value = res.data.featured || []
    comments.value = res.data.comments
    commentTotal.value = res.data.total
  } finally {
    loadingComments.value = false
  }
}

async function refreshComments() {
  // 精选状态改变后刷新整个评论列表
  commentPage.value = 1
  await fetchComments()
}

async function toggleLike() {
  if (!auth.isLoggedIn) return ElMessage.warning('请先登录')
  const res = await postApi.like(post.value.id)
  post.value.liked = res.liked
  post.value.like_count += res.liked ? 1 : -1
}

async function deletePost() {
  try {
    await ElMessageBox.confirm('确定删除这篇帖子吗？删除后不可恢复。', '确认删除', { type: 'warning' })
    await postApi.delete(post.value.id)
    ElMessage.success('帖子已删除')
    router.push('/')
  } catch {}
}

async function submitComment() {
  const text = newComment.value.replace(/<[^>]*>/g, '').trim()
  if (!text) return ElMessage.warning('请输入评论内容')
  submitting.value = true
  try {
    const res = await commentApi.create({ postId: post.value.id, content: newComment.value })
    comments.value.push(res.data)
    post.value.comment_count++
    newComment.value = ''
    commentEditorRef.value?.setContent('')
    ElMessage.success('评论发布成功')
  } finally {
    submitting.value = false
  }
}

function onCommentDeleted(id) {
  // 从精选和普通列表中移除
  featuredComments.value = featuredComments.value.filter(c => {
    if (c.id === id) return false
    c.replies = (c.replies || []).filter(r => r.id !== id)
    return true
  })
  comments.value = comments.value.filter(c => {
    if (c.id === id) return false
    c.replies = (c.replies || []).filter(r => r.id !== id)
    return true
  })
  post.value.comment_count = Math.max(0, post.value.comment_count - 1)
}

function onCommentReplied(reply) {
  // 找父评论并追加回复
  const addReply = (list) => {
    const parent = list.find(c => c.id === reply.parent_id)
    if (parent) {
      if (!parent.replies) parent.replies = []
      parent.replies.push(reply)
      parent.reply_count = (parseInt(parent.reply_count) || 0) + 1
      post.value.comment_count++
      return true
    }
    return false
  }
  if (!addReply(featuredComments.value)) addReply(comments.value)
}

onMounted(() => {
  fetchPost()
  fetchComments()
})
</script>

<style scoped>
.post-detail-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: start;
}
.post-main-col { display: flex; flex-direction: column; gap: 20px; }

.post-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 28px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.post-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
}
.author-info {
  display: flex; align-items: center; gap: 12px; cursor: pointer;
}
.author-name { font-weight: 600; font-size: 15px; }
.post-time { font-size: 12px; color: var(--text-muted); }
.post-title { font-size: 24px; font-weight: 700; line-height: 1.4; margin-bottom: 20px; }
.post-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);
}
.post-stats { display: flex; gap: 16px; font-size: 14px; color: var(--text-muted); }
.post-stats span { display: flex; align-items: center; gap: 4px; }

/* 评论区 */
.comments-section {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 24px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.comments-title {
  font-size: 18px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
}

.section-divider {
  display: flex; align-items: center; gap: 10px;
  margin: 20px 0 12px; font-size: 14px; font-weight: 600; color: var(--text-secondary);
}
.section-divider::before, .section-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}
.section-divider span { display: flex; align-items: center; gap: 4px; white-space: nowrap; }

.comment-editor-wrap {
  display: flex; gap: 12px; margin-bottom: 20px;
}
.comment-editor { flex: 1; }
.editor-footer { margin-top: 8px; display: flex; justify-content: flex-end; }

.login-tip {
  text-align: center; padding: 16px; color: var(--text-muted);
  background: var(--secondary); border-radius: 8px; margin-bottom: 20px; font-size: 14px;
}
.login-tip a { color: var(--primary); font-weight: 600; }

.comment-list { display: flex; flex-direction: column; }
.loading-wrap { padding: 40px 0; }
.pagination { display: flex; justify-content: center; margin-top: 16px; }

/* 侧边栏 */
.sidebar { display: flex; flex-direction: column; gap: 16px; }
.sidebar-card {
  background: var(--card-bg); border-radius: var(--radius); padding: 20px;
  border: 1px solid var(--border); box-shadow: var(--shadow);
}
.sidebar-card h4 { font-size: 13px; font-weight: 600; margin-bottom: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.author-profile { text-align: center; cursor: pointer; }
.s-author-name { font-size: 16px; font-weight: 600; margin: 10px 0 6px; }
.author-bio { font-size: 13px; color: var(--text-muted); }

.post-meta-list { display: flex; flex-direction: column; gap: 8px; }
.meta-item { display: flex; justify-content: space-between; font-size: 13px; }
.meta-item span:first-child { color: var(--text-muted); }
.meta-item span:last-child { font-weight: 500; }

@media (max-width: 768px) {
  .post-detail-layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
}
</style>
