<template>
  <div class="event-detail-page" v-loading="loading">
    <el-button
      v-if="event"
      type="primary"
      text
      @click="goBack"
      style="margin-bottom: 20px"
    >
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <el-card v-if="event" class="detail-card">
      <template #header>
        <div class="card-header">
          <h2 class="event-title">{{ event.name }}</h2>
          <div class="event-actions" v-if="canManageEvent">
            <el-button
              type="primary"
              @click="handleEnableCheckIn"
              :disabled="event.checkInEnabled"
            >
              {{ event.checkInEnabled ? "已开启签到" : "开启签到" }}
            </el-button>
          </div>
        </div>
      </template>

      <div class="event-content">
        <div class="event-cover-large">
          <img
            v-if="event.coverImageUrl"
            :src="event.coverImageUrl"
            :alt="event.name"
          />
          <div v-else class="cover-placeholder-large">
            <el-icon size="64"><Calendar /></el-icon>
          </div>
          <el-tag
            :type="getStatusTagType(event.status)"
            size="large"
            class="status-badge"
          >
            {{ getStatusText(event.status) }}
          </el-tag>
        </div>

        <el-row :gutter="40">
          <el-col :span="16">
            <div class="event-section">
              <h3 class="section-title">活动详情</h3>
              <div class="rich-text" v-html="event.description"></div>
            </div>

            <div
              class="event-section"
              v-if="
                event.userRegistration && !event.userRegistration.isCancelled
              "
            >
              <h3 class="section-title">我的签到</h3>
              <el-alert
                v-if="canCheckInNow"
                type="info"
                show-icon
                style="margin-bottom: 16px"
              >
                <template #title>签到时间窗已开启</template>
                请输入6位签到码完成签到
              </el-alert>
              <div v-if="userAttendance">
                <el-tag type="success" size="large">
                  <el-icon><CircleCheck /></el-icon>
                  已签到
                </el-tag>
                <p class="checkin-time">
                  签到时间：{{ formatDateTime(userAttendance.checkedInAt) }}
                </p>
              </div>
              <div v-else-if="canCheckInNow">
                <el-form :inline="true" :model="checkInForm" @submit.prevent>
                  <el-form-item>
                    <el-input
                      v-model="checkInForm.code"
                      placeholder="请输入6位签到码"
                      maxlength="6"
                      style="width: 200px"
                    />
                    <el-button type="primary" @click="handleCheckInWithCode">
                      <el-icon><Location /></el-icon>
                      签到
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
              <el-tag v-else type="info">不在签到时间范围内</el-tag>
            </div>

            <div class="event-section" v-if="canManageEvent">
              <h3 class="section-title">签到管理</h3>
              <div class="checkin-code-section">
                <div class="checkin-code-display">
                  <span class="code-label">签到码：</span>
                  <span class="code-value">{{
                    event.checkInCode || "未生成"
                  }}</span>
                  <el-button type="primary" text @click="handleRegenerateCode">
                    <el-icon><Refresh /></el-icon>
                    重新生成
                  </el-button>
                </div>
                <p class="checkin-hint">
                  签到时间：活动开始前30分钟 - 活动结束后30分钟
                </p>
              </div>
            </div>

            <div
              class="event-section"
              v-if="event.status === EventStatus.ENDED"
            >
              <h3 class="section-title">活动总结</h3>
              <div v-if="eventSummary" class="summary-content">
                <div class="rich-text" v-html="eventSummary.content"></div>
                <div
                  class="photo-wall"
                  v-if="
                    eventSummary.photoUrls && eventSummary.photoUrls.length > 0
                  "
                >
                  <h4>照片墙</h4>
                  <el-image
                    v-for="(url, index) in eventSummary.photoUrls"
                    :key="index"
                    :src="url"
                    :preview-src-list="eventSummary.photoUrls"
                    fit="cover"
                    class="photo-item"
                  />
                </div>
              </div>
              <el-empty v-else description="暂无活动总结" :image-size="80" />

              <div v-if="canManageEvent" style="margin-top: 20px">
                <el-button type="primary" @click="showSummaryDialog = true">
                  {{ eventSummary ? "编辑总结" : "发布总结" }}
                </el-button>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="event-sidebar">
              <el-card class="info-card">
                <template #header>
                  <span>活动信息</span>
                </template>
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">活动类型</span>
                    <el-tag>{{ getEventTypeText(event.eventType) }}</el-tag>
                  </div>
                  <div class="info-item">
                    <span class="info-label">活动地点</span>
                    <span class="info-value">{{ event.location }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">开始时间</span>
                    <span class="info-value">{{
                      formatDateTime(event.startTime)
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">结束时间</span>
                    <span class="info-value">{{
                      formatDateTime(event.endTime)
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">报名截止</span>
                    <span class="info-value">{{
                      formatDateTime(event.registrationDeadline)
                    }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">报名人数</span>
                    <span class="info-value">
                      <strong>{{ event.registrationCount || 0 }}</strong> /
                      {{ event.maxParticipants }} 人
                    </span>
                  </div>
                </div>

                <div class="progress-section">
                  <el-progress
                    :percentage="
                      Math.min(
                        ((event.registrationCount || 0) /
                          event.maxParticipants) *
                          100,
                        100,
                      )
                    "
                    :status="event.isFull ? 'exception' : ''"
                  />
                  <p class="progress-tip">
                    {{
                      event.isFull
                        ? "名额已满"
                        : "还剩 " +
                          (event.maxParticipants -
                            (event.registrationCount || 0)) +
                          " 个名额"
                    }}
                  </p>
                </div>

                <div class="action-buttons">
                  <template
                    v-if="
                      !event.userRegistration ||
                      event.userRegistration.isCancelled
                    "
                  >
                    <el-button
                      type="primary"
                      size="large"
                      style="width: 100%"
                      :disabled="
                        event.status !== EventStatus.REGISTERING || event.isFull
                      "
                      @click="handleRegister"
                    >
                      立即报名
                    </el-button>
                    <p
                      v-if="event.status !== EventStatus.REGISTERING"
                      class="action-tip"
                    >
                      {{
                        event.status === EventStatus.REGISTRATION_CLOSED
                          ? "报名已截止"
                          : "活动已结束"
                      }}
                    </p>
                    <p v-else-if="event.isFull" class="action-tip">名额已满</p>
                  </template>
                  <template v-else-if="!event.userRegistration.isCancelled">
                    <el-button
                      type="danger"
                      size="large"
                      plain
                      style="width: 100%"
                      :disabled="event.status !== EventStatus.REGISTERING"
                      @click="handleCancelRegistration"
                    >
                      取消报名
                    </el-button>
                    <p
                      v-if="event.status !== EventStatus.REGISTERING"
                      class="action-tip"
                    >
                      报名截止后不可取消
                    </p>
                    <el-tag
                      type="success"
                      style="margin-top: 10px; width: 100%; text-align: center"
                    >
                      已报名
                    </el-tag>
                  </template>
                </div>
              </el-card>

              <el-card class="info-card" v-if="event.club">
                <template #header>
                  <span>所属社团</span>
                </template>
                <div class="club-info" @click="goToClub(event.club!.id)">
                  <el-avatar :size="48" :src="event.club.logoUrl">
                    {{ event.club.name.charAt(0) }}
                  </el-avatar>
                  <div class="club-name">{{ event.club.name }}</div>
                </div>
              </el-card>

              <el-card class="info-card" v-if="canManageEvent">
                <template #header>
                  <span>签到统计</span>
                </template>
                <div class="checkin-stats" v-if="checkinStats">
                  <div class="stat-item">
                    <span class="stat-label">报名人数</span>
                    <span class="stat-value">{{
                      checkinStats.totalRegistrations
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">已签到</span>
                    <span class="stat-value">{{ checkinStats.checkedIn }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">签到率</span>
                    <span class="stat-value rate"
                      >{{ (checkinStats.checkInRate * 100).toFixed(1) }}%</span
                    >
                  </div>
                  <el-progress
                    :percentage="checkinStats.checkInRate * 100"
                    :color="
                      checkinStats.checkInRate >= 0.8 ? '#67c23a' : '#e6a23c'
                    "
                    style="margin-top: 10px"
                  />
                </div>
                <el-button type="primary" text @click="fetchCheckInStats">
                  刷新统计
                </el-button>
              </el-card>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-dialog
      v-model="showSummaryDialog"
      :title="eventSummary ? '编辑活动总结' : '发布活动总结'"
      width="600px"
    >
      <el-form :model="summaryForm" label-width="100px">
        <el-form-item label="总结内容">
          <el-input
            v-model="summaryForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入活动总结内容"
          />
        </el-form-item>
        <el-form-item label="照片URL">
          <el-input
            v-model="photoUrlsInput"
            type="textarea"
            :rows="3"
            placeholder="请输入照片URL，多个URL用换行分隔"
          />
          <div class="photo-preview" v-if="summaryForm.photoUrls.length > 0">
            <el-image
              v-for="(url, index) in summaryForm.photoUrls"
              :key="index"
              :src="url"
              fit="cover"
              class="preview-item"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSummaryDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitSummary">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Calendar,
  Location,
  CircleCheck,
  Refresh,
} from "@element-plus/icons-vue";
import { eventsApi } from "@/api/events";
import { Event, EventStatus, EventType, EventSummary } from "@/types";
import { useUserStore } from "@/stores/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const eventId = computed(() => route.params.id as string);
const loading = ref(false);
const event = ref<Event | null>(null);
const eventSummary = ref<EventSummary | null>(null);
const checkinStats = ref<{
  totalRegistrations: number;
  checkedIn: number;
  checkInRate: number;
} | null>(null);
const userAttendance = ref<any>(null);
const checkInForm = ref({
  code: "",
});

const showSummaryDialog = ref(false);
const summaryForm = ref({
  content: "",
  photoUrls: [] as string[],
});
const photoUrlsInput = ref("");

watch(photoUrlsInput, (newVal) => {
  summaryForm.value.photoUrls = newVal
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u);
});

const canManageEvent = computed(() => {
  return userStore.isAdmin;
});

const canCheckInNow = computed(() => {
  if (!event.value) return false;
  const now = new Date();
  const startTime = new Date(event.value.startTime);
  const endTime = new Date(event.value.endTime);
  const checkInStart = new Date(startTime.getTime() - 30 * 60 * 1000);
  const checkInEnd = new Date(endTime.getTime() + 30 * 60 * 1000);
  return now >= checkInStart && now <= checkInEnd;
});

const fetchEvent = async () => {
  loading.value = true;
  try {
    event.value = await eventsApi.getEventById(eventId.value);
  } catch (error) {
    ElMessage.error("获取活动详情失败");
  } finally {
    loading.value = false;
  }
};

const fetchCheckInStats = async () => {
  if (!canManageEvent.value) return;
  try {
    checkinStats.value = (await eventsApi.getCheckInStats(
      eventId.value,
    )) as any;
  } catch (error) {
    console.error("获取签到统计失败", error);
  }
};

const handleRegister = async () => {
  try {
    await ElMessageBox.confirm("确定要报名参加这个活动吗？", "确认报名", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "info",
    });
    await eventsApi.register(eventId.value);
    ElMessage.success("报名成功");
    fetchEvent();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("报名失败");
    }
  }
};

const handleCancelRegistration = async () => {
  try {
    await ElMessageBox.confirm("确定要取消报名吗？", "确认取消", {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    });
    await eventsApi.cancelRegistration(eventId.value);
    ElMessage.success("已取消报名");
    fetchEvent();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("取消报名失败");
    }
  }
};

const handleEnableCheckIn = async () => {
  try {
    await eventsApi.enableCheckIn(eventId.value);
    ElMessage.success("签到已开启");
    fetchEvent();
  } catch (error) {
    ElMessage.error("开启签到失败");
  }
};

const handleCheckInWithCode = async () => {
  if (!checkInForm.value.code || checkInForm.value.code.length !== 6) {
    ElMessage.warning("请输入6位签到码");
    return;
  }
  try {
    userAttendance.value = await eventsApi.checkInWithCode(
      eventId.value,
      checkInForm.value.code,
    );
    ElMessage.success("签到成功");
    checkInForm.value.code = "";
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || "签到失败");
  }
};

const handleRegenerateCode = async () => {
  try {
    await ElMessageBox.confirm("确定要重新生成签到码吗？", "确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    const res = (await eventsApi.regenerateCheckInCode(eventId.value)) as any;
    if (event.value) {
      event.value.checkInCode = res.checkInCode;
    }
    ElMessage.success("签到码已重新生成");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("重新生成失败");
    }
  }
};

const handleSubmitSummary = async () => {
  if (!summaryForm.value.content.trim()) {
    ElMessage.warning("请输入总结内容");
    return;
  }
  try {
    await eventsApi.createSummary(eventId.value, {
      content: summaryForm.value.content,
      photoUrls: summaryForm.value.photoUrls,
    });
    ElMessage.success("总结发布成功");
    showSummaryDialog.value = false;
    fetchEvent();
  } catch (error) {
    ElMessage.error("发布失败");
  }
};

const getStatusText = (status: EventStatus): string => {
  const statusMap: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: "报名中",
    [EventStatus.REGISTRATION_CLOSED]: "报名截止",
    [EventStatus.ONGOING]: "进行中",
    [EventStatus.ENDED]: "已结束",
  };
  return statusMap[status];
};

const getStatusTagType = (status: EventStatus): string => {
  const typeMap: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: "success",
    [EventStatus.REGISTRATION_CLOSED]: "warning",
    [EventStatus.ONGOING]: "primary",
    [EventStatus.ENDED]: "info",
  };
  return typeMap[status];
};

const getEventTypeText = (type: EventType): string => {
  const typeMap: Record<EventType, string> = {
    [EventType.LECTURE]: "讲座",
    [EventType.COMPETITION]: "比赛",
    [EventType.GATHERING]: "聚会",
    [EventType.VOLUNTEER]: "志愿",
    [EventType.TRAINING]: "培训",
  };
  return typeMap[type];
};

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const goBack = () => {
  router.back();
};

const goToClub = (clubId: string) => {
  router.push(`/club/${clubId}`);
};

onMounted(() => {
  fetchEvent();
  if (canManageEvent.value) {
    fetchCheckInStats();
  }
});
</script>

<style scoped>
.event-detail-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.event-content {
  padding: 0;
}

.event-cover-large {
  position: relative;
  height: 300px;
  margin: -20px -20px 20px -20px;
  overflow: hidden;
}

.event-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder-large {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.status-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 16px;
  padding: 8px 16px;
}

.event-section {
  margin-bottom: 30px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

.rich-text {
  line-height: 1.8;
  color: #606266;
}

.rich-text :deep(img) {
  max-width: 100%;
}

.checkin-time {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}

.checkin-code-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.checkin-code-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.code-label {
  font-size: 14px;
  color: #606266;
}

.code-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  letter-spacing: 4px;
  font-family: "Courier New", monospace;
}

.checkin-hint {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.info-card {
  margin-bottom: 20px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.info-value strong {
  font-size: 18px;
  color: #409eff;
}

.progress-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.progress-tip {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #909399;
}

.action-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.action-tip {
  text-align: center;
  margin-top: 10px;
  font-size: 12px;
  color: #f56c6c;
}

.club-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.club-info:hover {
  background-color: #f5f7fa;
}

.club-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.checkin-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-value.rate {
  color: #409eff;
}

.summary-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.photo-wall {
  margin-top: 16px;
}

.photo-wall h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.photo-item {
  width: 100px;
  height: 100px;
  margin-right: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.photo-preview {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-item {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}
</style>
