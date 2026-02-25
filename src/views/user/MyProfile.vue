<template>
  <div class="profile-wrap">
    <div class="profile-card">
      <h2>个人资料</h2>

      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="info">
          <div class="avatar-section">
            <el-avatar :size="80" :src="form.avatar">{{ auth.user.username?.[0]?.toUpperCase() }}</el-avatar>
            <div>
              <div class="avatar-url-row">
                <el-input v-model="form.avatar" placeholder="粘贴头像图片链接" size="small" style="width:300px" />
                <span class="or-divider">或</span>
                <el-button size="small" @click="triggerAvatarUpload">上传头像</el-button>
                <input ref="avatarInput" type="file" accept="image/*" hidden @change="onAvatarChange" />
              </div>
              <p class="hint">支持 JPG/PNG 格式，建议 200×200 以上</p>
            </div>
          </div>

          <el-form label-position="top" style="margin-top: 24px">
            <el-form-item label="用户名">
              <el-input v-model="form.username" placeholder="用户名（2-50字符）" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input v-model="form.bio" type="textarea" :rows="4" placeholder="介绍一下自己..." maxlength="200" show-word-limit />
            </el-form-item>
            <el-button type="primary" @click="saveProfile" :loading="savingProfile">保存修改</el-button>
          </el-form>
        </el-tab-pane>

        <!-- 修改密码 -->
        <el-tab-pane label="修改密码" name="password">
          <el-form :model="pwForm" label-position="top">
            <el-form-item label="当前密码">
              <el-input v-model="pwForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="pwForm.newPassword" type="password" show-password placeholder="至少6位" />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input v-model="pwForm.confirm" type="password" show-password />
            </el-form-item>
            <el-button type="primary" @click="changePassword" :loading="savingPassword">修改密码</el-button>
          </el-form>
        </el-tab-pane>

        <!-- 我的帖子 -->
        <el-tab-pane label="我的帖子" name="posts">
          <div v-if="myPosts.length === 0 && !loadingPosts" class="empty-state">
            <el-icon><DocumentAdd /></el-icon>
            <p>还没有发帖，<router-link to="/post/create">去发第一贴</router-link></p>
          </div>
          <div class="my-posts-list">
            <div v-for="post in myPosts" :key="post.id" class="my-post-item" @click="$router.push(`/post/${post.id}`)">
              <div class="my-post-title">{{ post.title }}</div>
              <div class="my-post-meta">
                <span><el-icon><View /></el-icon> {{ post.view_count }}</span>
                <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
                <span>{{ formatDate(post.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="pagination" v-if="postTotal > 10">
            <el-pagination v-model:current-page="postsPage" :page-size="10" :total="postTotal" layout="prev, pager, next" background @current-change="fetchMyPosts" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { userApi, uploadApi } from '@/api'
import { ElMessage } from 'element-plus'
import { DocumentAdd, View, ChatDotRound } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const auth = useAuthStore()
const activeTab = ref('info')
const avatarInput = ref(null)

const form = reactive({
  username: auth.user.username,
  bio: auth.user.bio || '',
  avatar: auth.user.avatar || ''
})

const pwForm = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const savingProfile = ref(false)
const savingPassword = ref(false)

const myPosts = ref([])
const postTotal = ref(0)
const postsPage = ref(1)
const loadingPosts = ref(false)

function triggerAvatarUpload() { avatarInput.value.click() }

async function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const fd = new FormData()
  fd.append('image', file)
  try {
    const res = await uploadApi.image(fd)
    form.avatar = res.data.url
    ElMessage.success('头像上传成功')
  } catch {}
  e.target.value = ''
}

async function saveProfile() {
  savingProfile.value = true
  try {
    const res = await userApi.updateProfile({ username: form.username, bio: form.bio, avatar: form.avatar })
    auth.updateUser(res.data)
    ElMessage.success('资料更新成功')
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (!pwForm.oldPassword || !pwForm.newPassword) return ElMessage.warning('请填写所有密码字段')
  if (pwForm.newPassword !== pwForm.confirm) return ElMessage.warning('两次密码不一致')
  savingPassword.value = true
  try {
    await userApi.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
    ElMessage.success('密码修改成功')
    pwForm.oldPassword = ''
    pwForm.newPassword = ''
    pwForm.confirm = ''
  } finally {
    savingPassword.value = false
  }
}

async function fetchMyPosts() {
  loadingPosts.value = true
  try {
    const res = await userApi.getPosts(auth.user.id, { page: postsPage.value, limit: 10 })
    myPosts.value = res.data.posts
    postTotal.value = res.data.total
  } finally {
    loadingPosts.value = false
  }
}

function formatDate(t) { return dayjs(t).format('YYYY-MM-DD') }

onMounted(fetchMyPosts)
</script>

<style scoped>
.profile-wrap { max-width: 720px; margin: 0 auto; }
.profile-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 32px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}
.profile-card h2 { font-size: 22px; font-weight: 700; margin-bottom: 24px; }

.avatar-section { display: flex; align-items: center; gap: 20px; padding: 16px 0; }
.avatar-url-row { display: flex; align-items: center; gap: 8px; }
.or-divider { color: var(--text-muted); font-size: 13px; }
.hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

.my-posts-list { display: flex; flex-direction: column; gap: 8px; }
.my-post-item {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
}
.my-post-item:hover { border-color: var(--primary-light); background: #f5f3ff; }
.my-post-title { font-weight: 600; margin-bottom: 6px; }
.my-post-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); align-items: center; }
.my-post-meta span { display: flex; align-items: center; gap: 3px; }

.pagination { display: flex; justify-content: center; margin-top: 16px; }

:deep(.el-tabs__item) { font-size: 15px; }
</style>
