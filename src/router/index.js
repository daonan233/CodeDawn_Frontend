import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('@/views/forum/HomeView.vue') },
      { path: 'post/:id', name: 'PostDetail', component: () => import('@/views/forum/PostDetail.vue') },
      { path: 'post/create', name: 'CreatePost', component: () => import('@/views/forum/CreatePost.vue'), meta: { requiresAuth: true } },
      { path: 'post/:id/edit', name: 'EditPost', component: () => import('@/views/forum/CreatePost.vue'), meta: { requiresAuth: true } },
      { path: 'user/:id', name: 'UserProfile', component: () => import('@/views/user/UserProfile.vue') },
      { path: 'profile', name: 'MyProfile', component: () => import('@/views/user/MyProfile.vue'), meta: { requiresAuth: true } },
      { path: 'notifications', name: 'Notifications', component: () => import('@/views/user/Notifications.vue'), meta: { requiresAuth: true } },
      { path: 'admin', name: 'Admin', component: () => import('@/views/admin/AdminPanel.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    ]
  },
  { path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'Login', query: { redirect: to.fullPath } }
  if (to.meta.requiresAdmin && !auth.isAdmin) return { name: 'Home' }
  if ((to.name === 'Login' || to.name === 'Register') && auth.isLoggedIn) return { name: 'Home' }
})

export default router
