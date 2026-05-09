<template>
  <div class="applications-page">
    <el-card class="page-header-card">
      <template #header>
        <div class="header-content">
          <h2>社团申请审核</h2>
          <el-radio-group v-model="filterStatus" size="small" @change="fetchApplications">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="PENDING">待审核</el-radio-button>
            <el-radio-button label="APPROVED">已通过</el-radio-button>
            <el-radio-button label="REJECTED">已拒绝</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div class="applications-list">
        <div
          v-for="app in applications"
          :key="app.id"
          class="application-card"
        >
          <div class="card-header">
            <div class="club-info">
              <el-avatar :size="60" :src="app.logoUrl">
                {{ app.name.charAt(0) }}
              </el-avatar>
              <div class="club-basic">
                <h3 class="club-name">{{ app.name }}</h3>
                <el-tag size="small" v-if="app.category">{{ app.category.name }}</el-tag>
              </div>
            </div>
            <div class="status-section">
              <el-tag :type="getStatusTagType(app.status)" size="large">
                {{ getStatusText(app.status) }}
              </el-tag>
              <div class="apply-time">
                申请时间：{{ formatDateTime(app.createdAt) }}
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="label">申请人：</span>
              <span class="value">
                {{ app.applicant?.name || '未知' }}
                <span class="sub-text">({{ app.applicant?.username }})</span>
              </span>
            </div>
            <div class="info-row">
              <span class="label">招新口号：</span>
              <span class="value">{{ app.recruitmentSlogan || '暂无' }}</span>
            </div>
            <div class="info-row">
              <span class="label">社团简介：</span>
              <span class="value description">{{ app.description }}</span>
            </div>
          </div>

          <div v-if="app.status === 'REJECTED'" class="reject-reason">
            <el-alert :title="'拒绝原因：' + (app.rejectReason || '暂无')" type="error" :closable="false" />
          </div>

          <div v-if="app.status === 'PENDING'" class="card-actions">
            <el-button type="success" @click="handleApprove(app)">
              <el-icon><CircleCheck /></el-icon>
              通过
            </el-button>
            <el-button type="danger" @click="showRejectDialog(app)">
              <el-icon><CircleClose /></el-icon>
              拒绝
            </el-button>
          </div>
        </div>

        <el-empty v-if="applications.length === 0 && !loading" description="暂无申请数据" />
      </div>
    </el-card>

    <el-dialog v-model="rejectDialogVisible" title="拒绝申请" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject">确定拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
import { clubsApi } from '@/api/clubs';

const applications = ref<any[]>([]);
const loading = ref(false);
const filterStatus = ref('');

const rejectDialogVisible = ref(false);
const currentApplication = ref<any>(null);
const rejectForm = ref({
  rejectReason: '',
});

const fetchApplications = async () => {
  loading.value = true;
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : undefined;
    const res = await clubsApi.getAllApplications(params);
    applications.value = res.data;
  } catch (error) {
    ElMessage.error('获取申请列表失败');
  } finally {
    loading.value = false;
  }
};

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  };
  return map[status] || status;
};

const getStatusTagType = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  };
  return map[status] || 'info';
};

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleApprove = async (app: any) => {
  try {
    await ElMessageBox.confirm(`确定要通过社团"${app.name}"的申请吗？`, '确认通过', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    });
    await clubsApi.approveApplication(app.id);
    ElMessage.success('已通过申请');
    fetchApplications();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

const showRejectDialog = (app: any) => {
  currentApplication.value = app;
  rejectForm.value.rejectReason = '';
  rejectDialogVisible.value = true;
};

const handleReject = async () => {
  if (!currentApplication.value) return;

  try {
    await clubsApi.rejectApplication(currentApplication.value.id, {
      rejectReason: rejectForm.value.rejectReason || '不符合要求',
    });
    ElMessage.success('已拒绝申请');
    rejectDialogVisible.value = false;
    fetchApplications();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

onMounted(() => {
  fetchApplications();
});
</script>

<style scoped>
.applications-page {
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

.applications-list {
  padding-top: 10px;
}

.application-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  transition: box-shadow 0.2s;
}

.application-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.club-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.club-basic {
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

.status-section {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.apply-time {
  font-size: 12px;
  color: #909399;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
}

.info-row .label {
  color: #909399;
  min-width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: #303133;
  flex: 1;
}

.info-row .value.description {
  line-height: 1.6;
}

.info-row .sub-text {
  color: #909399;
  margin-left: 8px;
}

.reject-reason {
  margin-top: 16px;
}

.card-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
