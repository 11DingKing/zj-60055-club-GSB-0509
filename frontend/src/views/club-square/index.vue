<template>
  <div class="page-container">
    <div class="search-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索社团名称或描述"
        size="large"
        class="search-input"
        :prefix-icon="Search"
        clearable
        @clear="fetchClubs"
        @keyup.enter="fetchClubs"
      />
      <el-button type="primary" size="large" @click="fetchClubs">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
    </div>

    <div class="category-section">
      <div class="category-title">社团分类</div>
      <el-radio-group v-model="selectedCategory" size="large" @change="fetchClubs">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button
          v-for="category in categories"
          :key="category.id"
          :label="category.id"
        >
          {{ category.name }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="clubs-section">
      <div class="section-title">
        <el-icon size="20"><OfficeBuilding /></el-icon>
        社团列表
        <span class="count">({{ clubs.length }} 个社团)</span>
      </div>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="club in clubs" :key="club.id">
          <router-link :to="`/club/${club.id}`">
            <el-card class="club-card card-hover">
              <template #header>
                <div class="club-header">
                  <el-avatar :size="48" :src="club.logoUrl">
                    {{ club.name?.charAt(0) }}
                  </el-avatar>
                  <div class="club-info">
                    <div class="club-name">{{ club.name }}</div>
                    <el-tag size="small" type="info">{{ club.category?.name }}</el-tag>
                  </div>
                </div>
              </template>
              <div class="club-description text-ellipsis-2">
                {{ club.description }}
              </div>
              <div class="club-stats">
                <div class="stat-item">
                  <el-icon><User /></el-icon>
                  <span>{{ club.memberCount }} 人</span>
                </div>
                <div class="stat-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ club.eventCount }} 活动</span>
                </div>
              </div>
            </el-card>
          </router-link>
        </el-col>
      </el-row>

      <el-empty v-if="clubs.length === 0" description="暂无社团" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { clubsApi } from '@/api/clubs';
import type { Club, ClubCategory } from '@/types';
import { Search, OfficeBuilding, User, Calendar } from '@element-plus/icons-vue';

const searchKeyword = ref('');
const selectedCategory = ref('');
const categories = ref<ClubCategory[]>([]);
const clubs = ref<Club[]>([]);

const fetchCategories = async () => {
  try {
    categories.value = await clubsApi.getCategories();
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

const fetchClubs = async () => {
  try {
    const params: { categoryId?: string; search?: string } = {};
    if (selectedCategory.value) {
      params.categoryId = selectedCategory.value;
    }
    if (searchKeyword.value.trim()) {
      params.search = searchKeyword.value.trim();
    }
    clubs.value = await clubsApi.getClubs(params);
  } catch (error) {
    console.error('获取社团列表失败:', error);
  }
};

onMounted(() => {
  fetchCategories();
  fetchClubs();
});
</script>

<style scoped>
.search-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  max-width: 500px;
}

.category-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.clubs-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.club-card {
  margin-bottom: 20px;
}

.club-header {
  display: flex;
  align-items: center;
}

.club-info {
  margin-left: 12px;
  flex: 1;
}

.club-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.club-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
  min-height: 38px;
}

.club-stats {
  display: flex;
  gap: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.count {
  font-size: 14px;
  color: #909399;
  font-weight: 400;
  margin-left: 8px;
}
</style>
