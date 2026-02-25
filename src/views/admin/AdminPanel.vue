<template>
  <div class="admin-wrap">
    <div class="admin-header">
      <h2>⚙️ 管理后台</h2>
      <el-tag type="warning">管理员</el-tag>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 帖子管理 -->
      <el-tab-pane label="帖子管理" name="posts">
        <div class="filter-row">
          <el-input v-model="postSearch" placeholder="搜索帖子标题..." style="width: 300px" clearable @input="fetchAdminPosts" />
        </div>
        <el-table :data="adminPosts" border stripe v-loading="loadingPosts">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="{ row }">
              <router-link :to="`/post/${row.id}`" class="post-link">{{ row.title }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="作者" width="120" />
          <el-table-column prop="view_count" label="浏览" width="80" />
          <el-table-column prop="comment_count" label="评论" width="80" />
          <el-table-column prop="like_count" label="点赞" width="80" />
          <el-table-column label="发布时间" width="150">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" @click="$router.push(`/post/${row.id}/edit`)">编辑</el-button>
              <el-button text type="danger" @click="deletePost(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination v-model:current-page="postsPage" :page-size="15" :total="postsTotal" layout="prev, pager, next" background @current-change="fetchAdminPosts" />
        </div>
      </el-tab-pane>

      <!-- 评论管理 -->
      <el-tab-pane label="评论管理" name="comments">
        <el-table :data="adminComments" border stripe v-loading="loadingComments">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="内容" min-width="300">
            <template #default="{ row }">
              <div class="comment-preview" v-html="stripHtml(row.content)"></div>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="作者" width="120" />
          <el-table-column label="所属帖子" min-width="200">
            <template #default="{ row }">
              <router-link :to="`/post/${row.post_id}`" class="post-link">帖子 #{{ row.post_id }}</router-link>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="150">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button text type="danger" @click="deleteComment(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination v-model:current-page="commentsPage" :page-size="20" :total="commentsTotal" layout="prev, pager, next" background @current-change="fetchAdminComments" />
        </div>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="adminUsers" border stripe v-loading="loadingUsers">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="用户" min-width="200">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:10px">
                <el-avatar :size="32" :src="row.avatar">{{ row.username?.[0]?.toUpperCase() }}</el-avatar>
                <span>{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'warning' : 'info'" size="small">
                {{ row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册时间" width="150">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { postApi, commentApi } from '@/api'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const activeTab = ref('posts')

// Posts
const adminPosts = ref([])
const postsPage = ref(1)
const postsTotal = ref(0)
const loadingPosts = ref(false)
const postSearch = ref('')

// Comments
const adminComments = ref([])
const commentsPage = ref(1)
const commentsTotal = ref(0)
const loadingComments = ref(false)

// Users
const adminUsers = ref([])
const loadingUsers = ref(false)

function formatDate(t) { return dayjs(t).format('YYYY-MM-DD HH:mm') }

function stripHtml(html) {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent?.substring(0, 100) || ''
}

async function fetchAdminPosts() {
  loadingPosts.value = true
  try {
    const res = await postApi.list({ page: postsPage.value, limit: 15, search: postSearch.value })
    adminPosts.value = res.data.posts.map(p => ({ ...p, username: p.username }))
    postsTotal.value = res.data.total
  } finally {
    loadingPosts.value = false
  }
}

async function deletePost(row) {
  try {
    await ElMessageBox.confirm(`确定删除帖子「${row.title}」吗？`, '确认删除', { type: 'warning' })
    await postApi.delete(row.id)
    ElMessage.success('帖子已删除')
    fetchAdminPosts()
  } catch {}
}

async function fetchAdminComments() {
  loadingComments.value = true
  try {
    const res = await api.get('/comments/admin/list', { params: { page: commentsPage.value, limit: 20 } })
    adminComments.value = res.data.comments
    commentsTotal.value = res.data.total
  } catch {
    // fallback: use post comments
    loadingComments.value = false
  } finally {
    loadingComments.value = false
  }
}

async function deleteComment(row) {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '确认', { type: 'warning' })
    await commentApi.delete(row.id)
    ElMessage.success('评论已删除')
    fetchAdminComments()
  } catch {}
}

async function fetchAdminUsers() {
  loadingUsers.value = true
  try {
    const res = await api.get('/users/admin/list')
    adminUsers.value = res.data.users
  } catch {} finally {
    loadingUsers.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'comments') fetchAdminComments()
  if (tab === 'users') fetchAdminUsers()
})

onMounted(fetchAdminPosts)
</script>

<style scoped>
.admin-wrap {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 28px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}
.admin-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.admin-header h2 { font-size: 22px; font-weight: 700; }

.filter-row { margin-bottom: 16px; }

.post-link { color: var(--primary); }
.post-link:hover { text-decoration: underline; }

.comment-preview { font-size: 13px; color: var(--text-secondary); }

.pagination { display: flex; justify-content: center; margin-top: 16px; }
</style>
