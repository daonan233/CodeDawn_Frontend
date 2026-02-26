<template>
  <div class="create-post-wrap">
    <div class="create-post-card">
      <div class="card-header">
        <h2>{{ isEdit ? '✏️ 编辑帖子' : '📝 发布新帖子' }}</h2>
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>

      <div class="form-body">
        <!-- 标题 -->
        <div class="form-item">
          <label class="form-label">标题 <span class="required">*</span></label>
          <el-input
            v-model="form.title"
            placeholder="请输入帖子标题（最多200字符）"
            maxlength="200"
            show-word-limit
            size="large"
          />
        </div>

        <!-- 标签 -->
        <div class="form-item">
          <label class="form-label">分区标签</label>
          <div class="tag-selector">
            <button
              v-for="tag in POST_TAGS"
              :key="tag.value"
              type="button"
              :class="['tag-btn', form.tags.includes(tag.value) && 'selected']"
              :style="form.tags.includes(tag.value) ? { background: tag.color, borderColor: tag.color, color: '#fff' } : { borderColor: tag.color, color: tag.color }"
              @click="toggleTag(tag.value)"
            >
              {{ tag.label }}
            </button>
          </div>
          <p class="form-hint">可多选，不选则显示为"未分类"</p>
        </div>

        <!-- 内容 -->
        <div class="form-item">
          <label class="form-label">内容 <span class="required">*</span></label>
          <RichEditor ref="editorRef" v-model="form.content" placeholder="分享您的想法、问题或知识..." />
        </div>

        <div class="form-footer">
          <el-button size="large" @click="$router.back()">取消</el-button>
          <el-button type="primary" size="large" :loading="submitting" @click="submit">
            {{ isEdit ? '💾 保存修改' : '🚀 发布帖子' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { postApi, POST_TAGS } from '@/api'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import RichEditor from '@/components/common/RichEditor.vue'

const route = useRoute()
const router = useRouter()
const editorRef = ref(null)

const isEdit = computed(() => !!route.params.id && route.name === 'EditPost')
const form = reactive({ title: '', content: '', tags: [] })
const submitting = ref(false)

function toggleTag(val) {
  const idx = form.tags.indexOf(val)
  if (idx === -1) form.tags.push(val)
  else form.tags.splice(idx, 1)
}

async function loadPost() {
  if (!isEdit.value) return
  try {
    const res = await postApi.get(route.params.id)
    form.title = res.data.title
    form.content = res.data.content
    form.tags = res.data.tags || []
    setTimeout(() => editorRef.value?.setContent(res.data.content), 100)
  } catch {
    router.push('/')
  }
}

async function submit() {
  if (!form.title.trim()) return ElMessage.warning('请输入标题')
  const textContent = form.content.replace(/<[^>]*>/g, '').trim()
  if (!textContent) return ElMessage.warning('请输入内容')

  submitting.value = true
  try {
    if (isEdit.value) {
      await postApi.update(route.params.id, form)
      ElMessage.success('帖子已更新')
      router.push(`/post/${route.params.id}`)
    } else {
      const res = await postApi.create(form)
      ElMessage.success('帖子发布成功！')
      router.push(`/post/${res.data.id}`)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadPost)
</script>

<style scoped>
.create-post-wrap { max-width: 800px; margin: 0 auto; }
.create-post-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 32px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.card-header h2 { font-size: 20px; font-weight: 700; }

.form-body { display: flex; flex-direction: column; gap: 20px; }
.form-item { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--danger); }
.form-hint { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.tag-selector { display: flex; flex-wrap: wrap; gap: 10px; }
.tag-btn {
  padding: 6px 18px;
  border-radius: 20px;
  border: 1.5px solid;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.tag-btn:hover { opacity: 0.8; transform: translateY(-1px); }
.tag-btn.selected { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

.form-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 8px; }
</style>
