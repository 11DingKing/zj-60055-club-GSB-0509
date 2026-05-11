<template>
  <div class="my-clubs-page">
    <el-card class="page-header-card">
      <template #header>
        <div class="header-content">
          <h2>我的社团</h2>
          <el-button type="primary" @click="goToCreateClub">
            <el-icon><Plus /></el-icon>
            创建社团
          </el-button>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="已加入的社团" name="joined">
          <div class="clubs-grid">
            <el-row :gutter="20">
              <el-col :span="8" v-for="club in joinedClubs" :key="club.id">
                <el-card class="club-card" :body-style="{ padding: 0 }" @click="goToClub(club.id)">
                  <div class="club-header">
                    <el-avatar :size="64" :src="club.logoUrl">
                      {{ club.name.charAt(0) }}
                    </el-avatar>
                    <div class="club-info">
                      <h3 class="club-name">{{ club.name }}</h3>
                      <el-tag v-if="isLeader(club)" type="primary" size="small">负责人</el-tag>
                      <el-tag v-else-if="isViceLeader(club)" type="warning" size="small">副负责人</el-tag>
                      <el-tag v-else type="info" size="small">成员</el-tag>
                    </div>
                  </div>
                  <div class="club-stats">
                    <span class="stat-item">
                      <el-icon><User /></el-icon>
                      {{ club.memberCount || 0 }} 成员
                    </span>
                    <span class="stat-item">
                      <el-icon><Calendar /></el-icon>
                      {{ club.eventCount || 0 }} 活动
                    </span>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-if="joinedClubs.length === 0" description="还没有加入任何社团">
              <el-button type="primary" @click="goToClubSquare">去社团广场看看</el-button>
            </el-empty>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我管理的社团" name="managed">
          <div class="clubs-grid">
            <el-row :gutter="20">
              <el-col :span="8" v-for="club in managedClubs" :key="club.id">
                <el-card class="club-card" :body-style="{ padding: 0 }">
                  <div class="club-header" @click="goToClub(club.id)">
                    <el-avatar :size="64" :src="club.logoUrl">
                      {{ club.name.charAt(0) }}
                    </el-avatar>
                    <div class="club-info">
                      <h3 class="club-name">{{ club.name }}</h3>
                      <el-tag type="primary" size="small">负责人</el-tag>
                    </div>
                  </div>
                  <div class="club-stats">
                    <span class="stat-item">
                      <el-icon><User /></el-icon>
                      {{ club.memberCount || 0 }} 成员
                    </span>
                    <span class="stat-item">
                      <el-icon><Calendar /></el-icon>
                      {{ club.eventCount || 0 }} 活动
                    </span>
                  </div>
                  <div class="club-actions">
                    <el-button size="small" @click.stop="goToClub(club.id)">
                      管理社团
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-if="managedClubs.length === 0" description="还没有管理任何社团">
              <el-button type="primary" @click="goToCreateClub">创建一个社团</el-button>
            </el-empty>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, User, Calendar } from '@element-plus/icons-vue';
import { clubsApi } from '@/api/clubs';
import { Club } from '@/types';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('joined');
const clubs = ref<Club[]>([]);
const loading = ref(false);

const joinedClubs = computed(() => clubs.value);

const managedClubs = computed(() => {
  return clubs.value.filter(club => club.leaderId === userStore.userInfo?.id);
});

const isLeader = (club: Club) => {
  return club.leaderId === userStore.userInfo?.id;
};

const isViceLeader = (_club: Club) => {
  return false;
};

const fetchClubs = async () => {
  loading.value = true;
  try {
    clubs.value = await clubsApi.getClubs();
  } catch (error) {
    ElMessage.error('获取社团列表失败');
  } finally {
    loading.value = false;
  }
};

const goToClub = (clubId: string) => {
  router.push(`/club/${clubId}`);
};

const goToCreateClub = () => {
  router.push('/create-club');
};

const goToClubSquare = () => {
  router.push('/club-square');
};

onMounted(() => {
  fetchClubs();
});
</script>

<style scoped>
.my-clubs-page {
  padding: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.clubs-grid {
  padding-top: 20px;
}

.club-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.club-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.club-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.club-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.club-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.club-stats {
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  background: #f5f7fa;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.club-actions {
  padding: 12px 20px;
  border-top: 1px solid #ebeef5;
}
</style>
