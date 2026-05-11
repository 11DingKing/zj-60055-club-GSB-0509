<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="user-card">
          <div class="user-info-header">
            <el-avatar :size="80" :src="userStore.userInfo?.avatar">
              {{ userStore.userInfo?.name?.charAt(0) }}
            </el-avatar>
            <div class="user-basic-info">
              <h2 class="user-name">{{ userStore.userInfo?.name }}</h2>
              <el-tag
                :type="getRoleTagType(userStore.userInfo?.role)"
                size="large"
              >
                {{ getRoleText(userStore.userInfo?.role) }}
              </el-tag>
            </div>
          </div>
          <div class="user-detail-info">
            <div class="info-item">
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userStore.userInfo?.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">邮箱</span>
              <span class="info-value">{{
                userStore.userInfo?.email || "未设置"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电话</span>
              <span class="info-value">{{
                userStore.userInfo?.phone || "未设置"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">注册时间</span>
              <span class="info-value">{{
                formatDate(userStore.userInfo?.createdAt)
              }}</span>
            </div>
            <div class="info-item points-item">
              <span class="info-label">积分</span>
              <span class="info-value">
                <strong class="points-value">{{
                  userStore.userInfo?.points || 0
                }}</strong>
                <el-button type="primary" text size="small" @click="goToPoints"
                  >查看明细</el-button
                >
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="content-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="我的报名" name="registrations">
              <div class="records-list">
                <div
                  v-for="reg in registrations"
                  :key="reg.id"
                  class="record-item"
                  @click="goToEvent(reg.eventId)"
                >
                  <div class="record-left">
                    <el-avatar
                      :size="48"
                      :src="reg.event?.coverImageUrl"
                      v-if="reg.event"
                    >
                      {{ reg.event?.name?.charAt(0) }}
                    </el-avatar>
                    <div class="record-info">
                      <h4 class="record-title">
                        {{ reg.event?.name || "活动已删除" }}
                      </h4>
                      <p class="record-meta">
                        <span
                          >报名时间：{{
                            formatDateTime(reg.registeredAt)
                          }}</span
                        >
                        <span v-if="reg.isCancelled" style="color: #f56c6c"
                          >已取消</span
                        >
                      </p>
                    </div>
                  </div>
                  <div class="record-right">
                    <el-tag :type="reg.isCancelled ? 'info' : 'success'">
                      {{ reg.isCancelled ? "已取消" : "已报名" }}
                    </el-tag>
                  </div>
                </div>
                <el-empty
                  v-if="registrations.length === 0"
                  description="暂无报名记录"
                />
              </div>
            </el-tab-pane>

            <el-tab-pane label="我的签到" name="checkins">
              <div class="records-list">
                <div
                  v-for="checkin in checkins"
                  :key="checkin.id"
                  class="record-item"
                  @click="goToEvent(checkin.eventId)"
                >
                  <div class="record-left">
                    <el-avatar
                      :size="48"
                      :src="checkin.event?.coverImageUrl"
                      v-if="checkin.event"
                    >
                      {{ checkin.event?.name?.charAt(0) }}
                    </el-avatar>
                    <div class="record-info">
                      <h4 class="record-title">
                        {{ checkin.event?.name || "活动已删除" }}
                      </h4>
                      <p class="record-meta">
                        签到时间：{{ formatDateTime(checkin.checkInTime) }}
                      </p>
                    </div>
                  </div>
                  <div class="record-right">
                    <el-tag type="success">
                      <el-icon><CircleCheck /></el-icon>
                      已签到
                    </el-tag>
                  </div>
                </div>
                <el-empty
                  v-if="checkins.length === 0"
                  description="暂无签到记录"
                />
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { CircleCheck } from "@element-plus/icons-vue";
import { usersApi } from "@/api/users";
import { EventRegistration, CheckInRecord, UserRole } from "@/types";
import { useUserStore } from "@/stores/user";

const router = useRouter();
const userStore = useUserStore();

const goToPoints = () => {
  router.push("/points");
};

const activeTab = ref("registrations");
const registrations = ref<EventRegistration[]>([]);
const checkins = ref<CheckInRecord[]>([]);

const getRoleText = (role?: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: "系统管理员",
    [UserRole.CLUB_LEADER]: "社团负责人",
    [UserRole.MEMBER]: "普通成员",
  };
  return role ? roleMap[role] : "";
};

const getRoleTagType = (role?: UserRole): string => {
  const typeMap: Record<UserRole, string> = {
    [UserRole.ADMIN]: "danger",
    [UserRole.CLUB_LEADER]: "primary",
    [UserRole.MEMBER]: "info",
  };
  return role ? typeMap[role] : "info";
};

const formatDate = (date?: string): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
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

const fetchRegistrations = async () => {
  try {
    registrations.value = await usersApi.getMyRegistrations();
  } catch (error) {
    ElMessage.error("获取报名记录失败");
  }
};

const fetchCheckins = async () => {
  try {
    checkins.value = await usersApi.getMyCheckIns();
  } catch (error) {
    ElMessage.error("获取签到记录失败");
  }
};

const goToEvent = (eventId: string) => {
  router.push(`/event/${eventId}`);
};

onMounted(() => {
  fetchRegistrations();
  fetchCheckins();
});
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.user-card {
  margin-bottom: 20px;
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.user-basic-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-name {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.user-detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.content-card {
  min-height: 500px;
}

.records-list {
  padding-top: 10px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.record-item:hover {
  background-color: #f5f7fa;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.record-meta {
  margin: 0;
  font-size: 13px;
  color: #909399;
  display: flex;
  gap: 20px;
}
</style>
