<template>
  <div class="page-container">
    <el-card v-loading="loading" class="club-detail-card">
      <div class="club-header-section">
        <el-avatar :size="100" :src="club?.logoUrl">
          {{ club?.name?.charAt(0) }}
        </el-avatar>
        <div class="club-main-info">
          <div class="club-title-row">
            <h1 class="club-name">{{ club?.name }}</h1>
            <el-tag size="large" type="info">{{ club?.category?.name }}</el-tag>
            <el-button
              v-if="!isMember"
              type="primary"
              :loading="joinLoading"
              @click="handleJoinClub"
            >
              加入社团
            </el-button>
            <el-tag v-else type="success" size="large">已加入</el-tag>
          </div>
          <div class="club-slogan" v-if="club?.recruitmentSlogan">
            {{ club?.recruitmentSlogan }}
          </div>
          <div class="club-stats-row">
            <div class="stat">
              <span class="stat-value">{{ club?.memberCount }}</span>
              <span class="stat-label">成员</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ club?.leader?.name }}</span>
              <span class="stat-label">负责人</span>
            </div>
          </div>
        </div>
      </div>

      <div class="club-description-section">
        <div class="section-label">社团简介</div>
        <p class="club-description">{{ club?.description }}</p>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="社团公告" name="announcements">
        <el-card v-loading="announcementsLoading">
          <template #header>
            <div class="tab-header">
              <span>公告列表</span>
              <el-button
                v-if="isLeader"
                type="primary"
                size="small"
                @click="showAnnouncementDialog = true"
              >
                发布公告
              </el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="ann in announcements"
              :key="ann.id"
              :timestamp="formatDate(ann.publishedAt)"
              placement="top"
            >
              <el-card class="announcement-card">
                <div class="announcement-header">
                  <h4>{{ ann.title }}</h4>
                  <el-tag v-if="ann.isPinned" type="danger" size="small">置顶</el-tag>
                </div>
                <p class="announcement-content">{{ ann.content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>

          <el-empty v-if="announcements.length === 0" description="暂无公告" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="近期活动" name="events">
        <el-card>
          <template #header>
            <div class="tab-header">
              <span>活动列表</span>
              <el-button
                v-if="isLeader"
                type="primary"
                size="small"
                @click="showEventDialog = true"
              >
                创建活动
              </el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" v-for="event in clubEvents" :key="event.id">
              <router-link :to="`/event/${event.id}`">
                <el-card class="event-card card-hover">
                  <div
                    class="event-cover"
                    :style="{ backgroundImage: `url(${event.coverImageUrl})` }"
                  >
                    <el-tag class="status-tag" :class="`status-tag-${event.status}`">
                      {{ getEventStatusText(event.status) }}
                    </el-tag>
                  </div>
                  <div class="event-info">
                    <h4 class="event-name text-ellipsis">{{ event.name }}</h4>
                    <div class="event-meta">
                      <div class="meta-item">
                        <el-icon><Location /></el-icon>
                        <span class="text-ellipsis">{{ event.location }}</span>
                      </div>
                      <div class="meta-item">
                        <el-icon><Calendar /></el-icon>
                        <span>{{ formatDate(event.startTime) }}</span>
                      </div>
                    </div>
                    <div class="event-footer">
                      <span class="registration-count">
                        {{ event.registrationCount }}/{{ event.maxParticipants }} 人报名
                      </span>
                    </div>
                  </div>
                </el-card>
              </router-link>
            </el-col>
          </el-row>

          <el-empty v-if="clubEvents.length === 0" description="暂无活动" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="成员列表" name="members">
        <el-card>
          <template #header>
            <div class="tab-header">
              <span>成员列表 ({{ members.length }})</span>
            </div>
          </template>

          <el-table :data="members" style="width: 100%">
            <el-table-column label="头像" width="80">
              <template #default="scope">
                <el-avatar :src="scope.row.user?.avatar">
                  {{ scope.row.user?.name?.charAt(0) }}
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column label="姓名" prop="user.name" />
            <el-table-column label="用户名" prop="user.username" />
            <el-table-column label="角色">
              <template #default="scope">
                <el-tag v-if="scope.row.isViceLeader" type="primary" size="small">
                  副负责人
                </el-tag>
                <el-tag v-else-if="club?.leaderId === scope.row.userId" type="success" size="small">
                  负责人
                </el-tag>
                <el-tag v-else size="small">成员</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="加入时间">
              <template #default="scope">
                {{ formatDate(scope.row.joinedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" v-if="isLeader">
              <template #default="scope">
                <el-button
                  v-if="club?.leaderId !== scope.row.userId"
                  type="primary"
                  link
                  size="small"
                  @click="handleSetViceLeader(scope.row)"
                >
                  {{ scope.row.isViceLeader ? '取消副负责人' : '设为副负责人' }}
                </el-button>
                <el-button
                  v-if="club?.leaderId !== scope.row.userId"
                  type="danger"
                  link
                  size="small"
                  @click="handleRemoveMember(scope.row)"
                >
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showAnnouncementDialog" title="发布公告" width="600px">
      <el-form :model="announcementForm" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="announcementForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="announcementForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="announcementForm.isPinned">置顶公告</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAnnouncementDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateAnnouncement">
          发布
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEventDialog" title="创建活动" width="700px">
      <el-form :model="eventForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="活动名称" required>
              <el-input v-model="eventForm.name" placeholder="请输入活动名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型" required>
              <el-select v-model="eventForm.eventType" placeholder="请选择活动类型" style="width: 100%">
                <el-option label="讲座" value="LECTURE" />
                <el-option label="比赛" value="COMPETITION" />
                <el-option label="聚会" value="GATHERING" />
                <el-option label="志愿" value="VOLUNTEER" />
                <el-option label="培训" value="TRAINING" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="活动地点" required>
              <el-input v-model="eventForm.location" placeholder="请输入活动地点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人数上限" required>
              <el-input-number v-model="eventForm.maxParticipants" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" required>
              <el-date-picker
                v-model="eventForm.startTime"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" required>
              <el-date-picker
                v-model="eventForm.endTime"
                type="datetime"
                placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="报名截止" required>
          <el-date-picker
            v-model="eventForm.registrationDeadline"
            type="datetime"
            placeholder="选择报名截止时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="活动详情" required>
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入活动详情"
          />
        </el-form-item>
        <el-form-item label="封面图">
          <el-input
            v-model="eventForm.coverImageUrl"
            placeholder="请输入封面图片URL（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEventDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleCreateEvent">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { clubsApi } from '@/api/clubs';
import { eventsApi } from '@/api/events';
import { EventStatus } from '@/types';
import type { Club, ClubAnnouncement, ClubMember, Event } from '@/types';
import { useUserStore } from '@/stores/user';
import { Location, Calendar } from '@element-plus/icons-vue';

const route = useRoute();
const userStore = useUserStore();

const loading = ref(true);
const joinLoading = ref(false);
const submitLoading = ref(false);
const announcementsLoading = ref(false);
const club = ref<Club | null>(null);
const members = ref<ClubMember[]>([]);
const announcements = ref<ClubAnnouncement[]>([]);
const clubEvents = ref<Event[]>([]);
const activeTab = ref('announcements');

const showAnnouncementDialog = ref(false);
const showEventDialog = ref(false);

const clubId = computed(() => route.params.id as string);

const isMember = computed(() => {
  if (!userStore.userInfo || !members.value.length) return false;
  return members.value.some((m) => m.userId === userStore.userInfo?.id);
});

const isLeader = computed(() => {
  if (!userStore.userInfo || !club.value) return false;
  if (club.value.leaderId === userStore.userInfo.id) return true;
  return members.value.some(
    (m) => m.userId === userStore.userInfo?.id && m.isViceLeader,
  );
});

const announcementForm = ref({
  title: '',
  content: '',
  isPinned: false,
});

const eventForm = ref({
  name: '',
  eventType: '',
  location: '',
  maxParticipants: 30,
  startTime: '',
  endTime: '',
  registrationDeadline: '',
  description: '',
  coverImageUrl: '',
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getEventStatusText = (status: EventStatus) => {
  const map: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: '报名中',
    [EventStatus.REGISTRATION_CLOSED]: '报名截止',
    [EventStatus.ONGOING]: '进行中',
    [EventStatus.ENDED]: '已结束',
  };
  return map[status] || status;
};

const fetchClubDetail = async () => {
  loading.value = true;
  try {
    club.value = await clubsApi.getClubById(clubId.value);
    members.value = club.value.members || [];
    announcements.value = club.value.announcements || [];
    clubEvents.value = club.value.events || [];
  } catch (error) {
    console.error('获取社团详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAnnouncements = async () => {
  announcementsLoading.value = true;
  try {
    announcements.value = await clubsApi.getAnnouncements(clubId.value);
  } catch (error) {
    console.error('获取公告列表失败:', error);
  } finally {
    announcementsLoading.value = false;
  }
};

const handleJoinClub = async () => {
  joinLoading.value = true;
  try {
    await clubsApi.joinClub(clubId.value);
    ElMessage.success('加入成功');
    fetchClubDetail();
  } catch (error) {
    console.error('加入社团失败:', error);
  } finally {
    joinLoading.value = false;
  }
};

const handleCreateAnnouncement = async () => {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    ElMessage.warning('请填写公告标题和内容');
    return;
  }

  submitLoading.value = true;
  try {
    await clubsApi.createAnnouncement(clubId.value, announcementForm.value);
    ElMessage.success('发布成功');
    showAnnouncementDialog.value = false;
    fetchAnnouncements();
    fetchClubDetail();
    announcementForm.value = { title: '', content: '', isPinned: false };
  } catch (error) {
    console.error('发布公告失败:', error);
  } finally {
    submitLoading.value = false;
  }
};

const handleCreateEvent = async () => {
  submitLoading.value = true;
  try {
    await eventsApi.createEvent({
      clubId: clubId.value,
      name: eventForm.value.name,
      location: eventForm.value.location,
      eventType: eventForm.value.eventType,
      maxParticipants: eventForm.value.maxParticipants,
      registrationDeadline: eventForm.value.registrationDeadline,
      description: eventForm.value.description,
      coverImageUrl: eventForm.value.coverImageUrl || undefined,
      startTime: eventForm.value.startTime,
      endTime: eventForm.value.endTime,
    });
    ElMessage.success('创建成功');
    showEventDialog.value = false;
    fetchClubDetail();
  } catch (error) {
    console.error('创建活动失败:', error);
  } finally {
    submitLoading.value = false;
  }
};

const handleSetViceLeader = async (member: ClubMember) => {
  try {
    await clubsApi.setViceLeader(clubId.value, member.userId, {
      isViceLeader: !member.isViceLeader,
    });
    ElMessage.success(member.isViceLeader ? '已取消副负责人' : '已设为副负责人');
    fetchClubDetail();
  } catch (error) {
    console.error('操作失败:', error);
  }
};

const handleRemoveMember = async (member: ClubMember) => {
  try {
    await ElMessageBox.confirm('确定要移除该成员吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await clubsApi.removeMember(clubId.value, member.userId);
    ElMessage.success('移除成功');
    fetchClubDetail();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error);
    }
  }
};

watch(
  () => route.params.id,
  () => {
    fetchClubDetail();
  },
);

onMounted(() => {
  fetchClubDetail();
});
</script>

<style scoped>
.club-detail-card {
  margin-bottom: 24px;
}

.club-header-section {
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.club-main-info {
  margin-left: 24px;
  flex: 1;
}

.club-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.club-name {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.club-slogan {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
}

.club-stats-row {
  display: flex;
  gap: 40px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.club-description-section {
  margin-top: 20px;
}

.section-label {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.club-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.announcement-card {
  margin-bottom: 8px;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.announcement-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.announcement-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
}

.event-card {
  margin-bottom: 20px;
  overflow: hidden;
  cursor: pointer;
}

.event-cover {
  height: 160px;
  background-color: #f0f2f5;
  background-size: cover;
  background-position: center;
  position: relative;
}

.status-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  font-weight: 500;
}

.event-info {
  padding: 16px;
}

.event-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.event-meta {
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.event-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.registration-count {
  font-size: 13px;
  color: #606266;
}
</style>
