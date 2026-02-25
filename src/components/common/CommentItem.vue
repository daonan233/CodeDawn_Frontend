<template>
  <div :class="['comment-item', comment.is_featured && 'is-featured']">
    <!-- 精选标签 -->
    <div v-if="comment.is_featured" class="featured-badge">
      <el-icon><StarFilled /></el-icon> 精选回复
    </div>

    <div class="comment-main">
      <el-avatar :size="38" :src="comment.avatar" class="flex-shrink" @click="$router.push(`/user/${comment.author_id}`)">
        {{ comment.username?.[0]?.toUpperCase() }}
      </el-avatar>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-author" @click="$router.push(`/user/${comment.author_id}`)">{{ comment.username }}</span>
          <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
          <div class="comment-ops">
            <!-- 精选操作（帖子作者可操作，且只针对顶级评论） -->
            <button
              v-if="isPostAuthor && !comment.parent_id"
              type="button"
              :class="['feature-btn', comment.is_featured && 'featured']"
              @click="toggleFeature"
              :title="comment.is_featured ? '取消精选' : '设为精选'"
            >
              <el-icon><Star /></el-icon>
              {{ comment.is_featured ? '取消精选' : '设精选' }}
            </button>
            <!-- 删除 -->
            <button v-if="canDelete" type="button" class="delete-btn" @click="deleteComment">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>

        <!-- 回复引用提示 -->
        <div v-if="comment.reply_to_username" class="reply-to">
          回复 <strong>@{{ comment.reply_to_username }}</strong>
        </div>

        <div class="comment-content post-content" v-html="comment.content"></div>

        <div class="comment-footer">
          <button type="button" :class="['like-btn', comment.liked && 'liked']" @click="toggleLike">
            <el-icon><component :is="comment.liked ? StarFilled : Star" /></el-icon>
            {{ comment.like_count || 0 }}
          </button>
          <button v-if="auth.isLoggedIn && !comment.parent_id" type="button" class="reply-btn" @click="toggleReply">
            <el-icon><ChatDotRound /></el-icon> 回复
            <span v-if="replyCount > 0" class="reply-count">{{ replyCount }} 条</span>
          </button>
          <button v-if="auth.isLoggedIn && comment.parent_id" type="button" class="reply-btn" @click="toggleReply">
            <el-icon><ChatDotRound /></el-icon> 回复
          </button>
        </div>

        <!-- 回复输入框 -->
        <div v-if="showReplyEditor" class="reply-editor">
          <RichEditor v-model="replyContent" :placeholder="`回复 @${comment.username}...`" />
          <div class="reply-footer">
            <el-button size="small" type="plain" @click="cancelReply">取消</el-button>
            <el-button type="primary" size="small" :loading="submitting" @click="submitReply">发布回复</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 子回复区（仅顶级评论展示） -->
    <div v-if="!comment.parent_id && replyCount > 0" class="sub-comments-wrap">
      <div v-if="showReplies" class="sub-comments">
        <CommentItem
          v-for="reply in visibleReplies"
          :key="reply.id"
          :comment="reply"
          :post-id="postId"
          :post-author-id="postAuthorId"
          :parent-id="comment.id"
          @deleted="onReplyDeleted"
          @replied="onSubReply"
        />

        <!-- 子评论分页 -->
        <div v-if="replyCount > replyPageSize" class="reply-pagination">
          <el-button
            v-if="replyPage > 1"
            text
            size="small"
            @click="replyPage--"
          >上一页</el-button>
          <span class="reply-page-info">
            {{ replyPage }} / {{ Math.ceil(replyCount / replyPageSize) }}
          </span>
          <el-button
            v-if="replyPage * replyPageSize < replyCount"
            text
            size="small"
            @click="replyPage++"
          >下一页</el-button>
        </div>
      </div>

      <!-- 展开/折叠按钮 -->
      <button type="button" class="toggle-replies-btn" @click="showReplies = !showReplies">
        <el-icon><component :is="showReplies ? ArrowUp : ArrowDown" /></el-icon>
        {{ showReplies ? '收起' : '展开' }} {{ replyCount }} 条回复
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { commentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, StarFilled, ChatDotRound, Delete, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import RichEditor from './RichEditor.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  comment: Object,
  postId: [Number, String],
  postAuthorId: [Number, String],
  parentId: { type: Number, default: null }
})
const emit = defineEmits(['deleted', 'replied'])

const auth = useAuthStore()
const router = useRouter()

const showReplyEditor = ref(false)
const replyContent = ref('')
const submitting = ref(false)
const showReplies = ref(false)

// 子评论分页
const replyPageSize = 5
const replyPage = ref(1)

const replyCount = computed(() => parseInt(props.comment.reply_count || 0) + (props.comment.replies?.length || 0) - parseInt(props.comment.reply_count || 0) + (props.comment.replies?.length || 0))
// 简化：直接用 replies.length
const allReplies = computed(() => props.comment.replies || [])
const realReplyCount = computed(() => allReplies.value.length)
const visibleReplies = computed(() => {
  const start = (replyPage.value - 1) * replyPageSize
  return allReplies.value.slice(start, start + replyPageSize)
})

const isPostAuthor = computed(() => {
  return auth.isLoggedIn && (String(auth.user.id) === String(props.postAuthorId) || auth.isAdmin)
})

const canDelete = computed(() => {
  if (!auth.isLoggedIn) return false
  return props.comment.author_id === auth.user.id || auth.isAdmin
})

function formatTime(t) {
  const d = dayjs(t)
  return dayjs().diff(d, 'day') < 7 ? d.fromNow() : d.format('MM-DD HH:mm')
}

function toggleReply() {
  showReplyEditor.value = !showReplyEditor.value
  if (showReplyEditor.value) showReplies.value = true
}

function cancelReply() {
  showReplyEditor.value = false
  replyContent.value = ''
}

async function toggleLike() {
  if (!auth.isLoggedIn) return ElMessage.warning('请先登录')
  const res = await commentApi.like(props.comment.id)
  props.comment.liked = res.liked
  props.comment.like_count = Math.max(0, (props.comment.like_count || 0) + (res.liked ? 1 : -1))
}

async function toggleFeature() {
  try {
    const res = await commentApi.feature(props.comment.id)
    props.comment.is_featured = res.is_featured
    ElMessage.success(res.message)
    emit('feature-changed')
  } catch {}
}

async function deleteComment() {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '确认', { type: 'warning' })
    await commentApi.delete(props.comment.id)
    ElMessage.success('评论已删除')
    emit('deleted', props.comment.id)
  } catch {}
}

async function submitReply() {
  const text = replyContent.value.replace(/<[^>]*>/g, '').trim()
  if (!text) return ElMessage.warning('请输入回复内容')
  submitting.value = true
  try {
    const res = await commentApi.create({
      postId: props.postId,
      content: replyContent.value,
      parentId: props.parentId || props.comment.id,
      replyToUserId: props.comment.author_id
    })
    const newReply = { ...res.data, reply_to_username: props.comment.username }
    emit('replied', newReply)
    replyContent.value = ''
    showReplyEditor.value = false
    showReplies.value = true
    ElMessage.success('回复成功')
  } finally {
    submitting.value = false
  }
}

function onReplyDeleted(id) {
  emit('deleted', id)
}

function onSubReply(reply) {
  emit('replied', reply)
}
</script>

<style scoped>
.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s;
}
.comment-item:last-child { border-bottom: none; }

.comment-item.is-featured {
  background: linear-gradient(135deg, #fef9ec, #fff);
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 4px;
}

.featured-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #d97706;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 20px;
  padding: 2px 10px;
  margin-bottom: 10px;
}

.comment-main { display: flex; gap: 12px; }
.flex-shrink { flex-shrink: 0; cursor: pointer; }

.comment-body { flex: 1; min-width: 0; }

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.comment-author {
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-primary);
}
.comment-author:hover { color: var(--primary); }
.comment-time { font-size: 12px; color: var(--text-muted); }
.comment-ops { display: flex; align-items: center; gap: 6px; margin-left: auto; }

.feature-btn {
  display: flex; align-items: center; gap: 3px;
  font-size: 12px; padding: 2px 8px; border-radius: 20px;
  border: 1px solid #fde68a; background: #fef9ec; color: #d97706;
  cursor: pointer; transition: all 0.2s;
}
.feature-btn:hover, .feature-btn.featured {
  background: #fbbf24; color: white; border-color: #fbbf24;
}

.delete-btn {
  display: flex; align-items: center; padding: 4px 6px; border-radius: 6px;
  border: none; background: transparent; color: var(--text-muted); cursor: pointer;
  transition: all 0.2s;
}
.delete-btn:hover { background: #fee2e2; color: var(--danger); }

.reply-to {
  font-size: 12px; color: var(--text-muted); margin-bottom: 4px;
}
.reply-to strong { color: var(--primary); }

.comment-content { font-size: 14px; line-height: 1.7; }

.comment-footer { display: flex; align-items: center; gap: 12px; margin-top: 10px; }

.like-btn, .reply-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: var(--text-muted);
  background: none; border: none; cursor: pointer;
  padding: 4px 10px; border-radius: 20px; transition: all 0.2s;
}
.like-btn:hover, .reply-btn:hover { background: var(--secondary); color: var(--primary); }
.like-btn.liked { color: #f59e0b; }

.reply-count { font-size: 12px; color: var(--text-muted); }

.reply-editor { margin-top: 12px; }
.reply-footer {
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;
}

/* 子回复区 */
.sub-comments-wrap {
  margin-left: 50px;
  margin-top: 8px;
}

.toggle-replies-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13px; color: var(--primary);
  background: none; border: none; cursor: pointer;
  padding: 6px 12px; border-radius: 20px;
  transition: background 0.2s;
}
.toggle-replies-btn:hover { background: #f0ebff; }

.sub-comments {
  padding-left: 16px;
  border-left: 2px solid var(--border);
  margin-bottom: 6px;
}

.reply-pagination {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0 4px;
  font-size: 13px; color: var(--text-muted);
}
.reply-page-info { font-size: 12px; }
</style>
