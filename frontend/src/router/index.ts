import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/club-square',
      },
      {
        path: 'club-square',
        name: 'ClubSquare',
        component: () => import('@/views/club-square/index.vue'),
        meta: { title: '社团广场' },
      },
      {
        path: 'club/:id',
        name: 'ClubDetail',
        component: () => import('@/views/club-detail/index.vue'),
        meta: { title: '社团详情' },
      },
      {
        path: 'events',
        name: 'Events',
        component: () => import('@/views/events/index.vue'),
        meta: { title: '活动列表' },
      },
      {
        path: 'event/:id',
        name: 'EventDetail',
        component: () => import('@/views/event-detail/index.vue'),
        meta: { title: '活动详情' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心' },
      },
      {
        path: 'points',
        name: 'Points',
        component: () => import('@/views/points/index.vue'),
        meta: { title: '我的积分' },
      },
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard.vue'),
        meta: { title: '管理员看板', requiresAdmin: true },
      },
      {
        path: 'admin/categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/categories.vue'),
        meta: { title: '分类管理', requiresAdmin: true },
      },
      {
        path: 'admin/applications',
        name: 'AdminApplications',
        component: () => import('@/views/admin/applications.vue'),
        meta: { title: '社团申请审核', requiresAdmin: true },
      },
      {
        path: 'my-clubs',
        name: 'MyClubs',
        component: () => import('@/views/my-clubs/index.vue'),
        meta: { title: '我的社团' },
      },
      {
        path: 'create-club',
        name: 'CreateClub',
        component: () => import('@/views/create-club/index.vue'),
        meta: { title: '创建社团' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login');
    return;
  }

  if (userStore.isLoggedIn && !userStore.userInfo) {
    await userStore.fetchUserInfo();
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/');
    return;
  }

  next();
});

export default router;
