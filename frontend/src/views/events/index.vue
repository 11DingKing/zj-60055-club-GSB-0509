<template>
  <div class="events-page">
    <el-card class="filter-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filterParams.status" placeholder="活动状态" clearable style="width: 100%">
            <el-option label="报名中" :value="EventStatus.REGISTERING" />
            <el-option label="报名截止" :value="EventStatus.REGISTRATION_CLOSED" />
            <el-option label="进行中" :value="EventStatus.ONGOING" />
            <el-option label="已结束" :value="EventStatus.ENDED" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterParams.eventType" placeholder="活动类型" clearable style="width: 100%">
            <el-option label="讲座" :value="EventType.LECTURE" />
            <el-option label="比赛" :value="EventType.COMPETITION" />
            <el-option label="聚会" :value="EventType.GATHERING" />
            <el-option label="志愿" :value="EventType.VOLUNTEER" />
            <el-option label="培训" :value="EventType.TRAINING" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input
            v-model="filterParams.keyword"
            placeholder="搜索活动名称或地点"
            clearable
            @clear="fetchEvents"
            @keyup.enter="fetchEvents"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="fetchEvents" style="width: 100%">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <div class="events-list">
      <el-row :gutter="20">
        <el-col :span="8" v-for="event in filteredEvents" :key="event.id">
          <el-card class="event-card" :body-style="{ padding: 0 }" @click="goToDetail(event.id)">
            <div class="event-cover">
              <img v-if="event.coverImageUrl" :src="event.coverImageUrl" :alt="event.name" />
              <div v-else class="cover-placeholder">
                <el-icon size="48"><Calendar /></el-icon>
              </div>
              <el-tag :type="getStatusTagType(event.status)" size="small" class="status-tag">
                {{ getStatusText(event.status) }}
              </el-tag>
            </div>
            <div class="event-info">
              <h3 class="event-name">{{ event.name }}</h3>
              <div class="event-meta">
                <span class="meta-item">
                  <el-icon><Location /></el-icon>
                  {{ event.location }}
                </span>
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDateTime(event.startTime) }}
                </span>
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ event.registrationCount || 0 }}/{{ event.maxParticipants }}人
                </span>
              </div>
              <div class="event-progress">
                <el-progress
                  :percentage="Math.min(((event.registrationCount || 0) / event.maxParticipants) * 100, 100)"
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">
                  {{ event.isFull ? '已满' : '可报名' }}
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="filteredEvents.length === 0" description="暂无活动数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Calendar, Location, User } from '@element-plus/icons-vue';
import { eventsApi } from '@/api/events';
import { Event, EventStatus, EventType } from '@/types';

const router = useRouter();
const events = ref<Event[]>([]);
const loading = ref(false);

const filterParams = ref({
  status: undefined as EventStatus | undefined,
  eventType: undefined as EventType | undefined,
  keyword: '',
});

const filteredEvents = computed(() => {
  return events.value.filter(event => {
    if (filterParams.value.status && event.status !== filterParams.value.status) return false;
    if (filterParams.value.eventType && event.eventType !== filterParams.value.eventType) return false;
    if (filterParams.value.keyword) {
      const keyword = filterParams.value.keyword.toLowerCase();
      if (!event.name.toLowerCase().includes(keyword) && !event.location.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    return true;
  });
});

const fetchEvents = async () => {
  loading.value = true;
  try {
    events.value = await eventsApi.getEvents();
  } catch (error) {
    ElMessage.error('获取活动列表失败');
  } finally {
    loading.value = false;
  }
};

const getStatusText = (status: EventStatus): string => {
  const statusMap: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: '报名中',
    [EventStatus.REGISTRATION_CLOSED]: '报名截止',
    [EventStatus.ONGOING]: '进行中',
    [EventStatus.ENDED]: '已结束',
  };
  return statusMap[status];
};

const getStatusTagType = (status: EventStatus): string => {
  const typeMap: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: 'success',
    [EventStatus.REGISTRATION_CLOSED]: 'warning',
    [EventStatus.ONGOING]: 'primary',
    [EventStatus.ENDED]: 'info',
  };
  return typeMap[status];
};

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const goToDetail = (id: string) => {
  router.push(`/event/${id}`);
};

onMounted(() => {
  fetchEvents();
});
</script>

<style scoped>
.events-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.event-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.event-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

.event-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.status-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.event-info {
  padding: 16px;
}

.event-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.event-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.event-progress .el-progress {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: #606266;
}
</style>
