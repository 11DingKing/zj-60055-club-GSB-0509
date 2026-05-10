<template>
  <el-container class="main-container">
    <el-header class="header">
      <div class="logo" @click="goHome">
        <el-icon size="24"><OfficeBuilding /></el-icon>
        <span class="logo-text">社团活动管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="nav-menu"
        mode="horizontal"
        background-color="transparent"
        text-color="#fff"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/club-square">社团广场</el-menu-item>
        <el-menu-item index="/events">活动列表</el-menu-item>
        <el-menu-item index="/my-clubs">我的社团</el-menu-item>
        <el-menu-item index="/create-club">创建社团</el-menu-item>
        <el-sub-menu index="admin" v-if="userStore.isAdmin">
          <template #title>管理后台</template>
          <el-menu-item index="/admin/dashboard">数据看板</el-menu-item>
          <el-menu-item index="/admin/categories">分类管理</el-menu-item>
          <el-menu-item index="/admin/applications">申请审核</el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="user-info">
        <el-dropdown @command="handleCommand">
          <span class="user-name">
            <el-avatar :size="32" :src="userStore.userInfo?.avatar">
              {{ userStore.userInfo?.name?.charAt(0) }}
            </el-avatar>
            <span class="name-text">{{ userStore.userInfo?.name }}</span>
            <el-tag :type="getRoleTagType(userStore.userInfo?.role)" size="small" effect="dark">
              {{ getRoleText(userStore.userInfo?.role) }}
            </el-tag>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="points">我的积分</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { UserRole } from '@/types';
import { OfficeBuilding } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);

const goHome = () => {
  router.push('/club-square');
};

const getRoleText = (role?: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: '管理员',
    [UserRole.CLUB_LEADER]: '社团负责人',
    [UserRole.MEMBER]: '普通成员',
  };
  return role ? roleMap[role] : '';
};

const getRoleTagType = (role?: UserRole): string => {
  const typeMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'danger',
    [UserRole.CLUB_LEADER]: 'primary',
    [UserRole.MEMBER]: 'info',
  };
  return role ? typeMap[role] : 'info';
};

const handleCommand = (command: string) => {
  if (command === 'profile') {
    router.push('/profile');
  } else if (command === 'points') {
    router.push('/my-points');
  } else if (command === 'logout') {
    userStore.logout();
    router.push('/login');
  }
};
</script>

<style scoped>
.main-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0 20px;
  color: white;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-text {
  margin-left: 10px;
  font-size: 20px;
  font-weight: 600;
}

.nav-menu {
  border: none;
  flex: 1;
  margin-left: 30px;
}

.nav-menu :deep(.el-menu-item) {
  border-bottom: none;
  height: 60px;
  line-height: 60px;
}

.nav-menu :deep(.el-menu-item:hover),
.nav-menu :deep(.el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.name-text {
  margin: 0 8px;
  font-size: 14px;
}

.main-content {
  padding: 0;
  flex: 1;
  overflow: auto;
}
</style>
