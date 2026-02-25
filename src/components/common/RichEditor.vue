<template>
  <div class="rich-editor">
    <!-- 工具栏：所有按钮必须 type="button"，防止触发表单 submit -->
    <div class="toolbar">
      <button type="button" @mousedown.prevent="exec('bold')" :class="{active: states.bold}" title="加粗"><b>B</b></button>
      <button type="button" @mousedown.prevent="exec('italic')" :class="{active: states.italic}" title="斜体"><i>I</i></button>
      <button type="button" @mousedown.prevent="exec('underline')" :class="{active: states.underline}" title="下划线"><u>U</u></button>
      <button type="button" @mousedown.prevent="exec('strikeThrough')" title="删除线"><s>S</s></button>
      <div class="sep"></div>
      <button type="button" @mousedown.prevent="formatHeading(2)" title="H2标题"><b>H2</b></button>
      <button type="button" @mousedown.prevent="formatHeading(3)" title="H3标题"><b>H3</b></button>
      <div class="sep"></div>
      <button type="button" @mousedown.prevent="exec('insertUnorderedList')" title="无序列表">≡</button>
      <button type="button" @mousedown.prevent="exec('insertOrderedList')" title="有序列表">1.</button>
      <button type="button" @mousedown.prevent="insertBlockquote" title="引用">"</button>
      <button type="button" @mousedown.prevent="insertCode" title="代码块">&lt;/&gt;</button>
      <div class="sep"></div>
      <button type="button" @mousedown.prevent="insertLink" title="插入链接">🔗</button>
      <button type="button" @mousedown.prevent="triggerImageUpload" title="插入图片">🖼️</button>
      <div class="sep"></div>
      <button type="button" @mousedown.prevent="exec('undo')" title="撤销">↩</button>
      <button type="button" @mousedown.prevent="exec('redo')" title="重做">↪</button>
    </div>

    <!-- 编辑区 -->
    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="onInput"
      @paste="onPaste"
      @keyup="updateStates"
      @mouseup="updateStates"
    ></div>

    <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFileChange" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { uploadApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入内容...' }
})
const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
const fileInput = ref(null)
const states = reactive({ bold: false, italic: false, underline: false })

// 使用 mousedown.prevent 阻止 blur，保留选区，再执行命令
function exec(cmd, val = null) {
  document.execCommand(cmd, false, val)
  editorRef.value?.focus()
  updateStates()
  emitChange()
}

function formatHeading(level) {
  document.execCommand('formatBlock', false, `h${level}`)
  emitChange()
}

function insertBlockquote() {
  document.execCommand('formatBlock', false, 'blockquote')
  emitChange()
}

function insertCode() {
  const sel = window.getSelection()
  const text = sel?.toString()
  if (text) {
    document.execCommand('insertHTML', false, `<code>${text}</code>`)
  } else {
    document.execCommand('insertHTML', false, '<pre><code>在此输入代码</code></pre>')
  }
  emitChange()
}

async function insertLink() {
  // 先保存选区
  const sel = window.getSelection()
  const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
  try {
    const { value: url } = await ElMessageBox.prompt('请输入链接地址', '插入链接', {
      inputPlaceholder: 'https://...',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    if (url) {
      // 恢复选区再执行
      if (range) {
        sel.removeAllRanges()
        sel.addRange(range)
      }
      editorRef.value?.focus()
      exec('createLink', url)
    }
  } catch {}
}

function triggerImageUpload() {
  fileInput.value.click()
}

async function onFileChange(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    await uploadAndInsertImage(file)
  }
  e.target.value = ''
}

async function onPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      await uploadAndInsertImage(file)
    }
  }
}

async function uploadAndInsertImage(file) {
  const fd = new FormData()
  fd.append('image', file)
  try {
    const res = await uploadApi.image(fd)
    const url = res.data.url
    editorRef.value?.focus()
    document.execCommand('insertImage', false, url)
    emitChange()
  } catch {
    ElMessage.error('图片上传失败')
  }
}

function updateStates() {
  states.bold = document.queryCommandState('bold')
  states.italic = document.queryCommandState('italic')
  states.underline = document.queryCommandState('underline')
}

function onInput() {
  emitChange()
}

function emitChange() {
  emit('update:modelValue', editorRef.value?.innerHTML || '')
}

function setContent(html) {
  if (editorRef.value) {
    editorRef.value.innerHTML = html || ''
  }
}

// 初始化内容
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})

// 外部重置时同步（比如切换帖子）
watch(() => props.modelValue, (val) => {
  if (editorRef.value && val === '') {
    editorRef.value.innerHTML = ''
  }
}, { immediate: false })

defineExpose({ setContent })
</script>

<style scoped>
.sep {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 2px;
  align-self: center;
}
[contenteditable]:empty:before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
  display: block;
}
</style>
