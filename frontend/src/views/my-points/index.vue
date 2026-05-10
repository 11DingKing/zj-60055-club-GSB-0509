<template>
  <div class="my-points-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="points-card">
          <div class="points-header">
            <el-icon size="48" color="#e6a23c"><Trophy /></el-icon>
            <h2 class="points-title">我的积分</h2>
          </div>
          <div class="points-value">
            <span class="points-number">{{ pointsInfo?.points ?? 0 }}</span>
            <span class="points-unit">分</span>
          </div>
          <div class="points-rules">
            <h4>积分规则</h4>
            <div class="rule-item">
              <el-tag type="success" size="small">+20</el-tag>
              <span>创建活动</span>
            </div>
            <div class="rule-item">
              <el-tag type="success" size="small">+10</el-tag>
              <span>参加活动签到</span>
            </div>
            <div class="rule-item">
              <el-tag type="success" size="small">+5</el-tag>
              <span>发表公告</span>
            </div>
            <div class="rule-item">
              <el-tag type="danger" size="small">-30</el-tag>
              <span>被踢出社团</span>
            </div>
            <div class="rule-item">
              <el-tag type="danger" size="small">-5</el-tag>
              <span>退出已签到活动</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="logs-card">
          <template #header>
            <span>积分明细</span>
          </template>
          <el-table :data="logsData" stripe style="width: 100%" v-loading="logsLoading">
            <el-table-column label="时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="类型" width="160">
              <template #default="{ row }">
                <el-tag :type="getPointsTypeTagType(row.type)" size="small">
                  {{ getPointsTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="积分变动" width="120">
              <template #default="{ row }">
                <span :class="row.amount > 0 ? 'amount-positive' : 'amount-negative'">
                  {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="说明" prop="reason" />
          </el-table>
          <div class="pagination-wrap" v-if="totalPages > 1">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="fetchPointsLogs"
            />
          </div>
          <el-empty v-if="!logsLoading && logsData.length === 0" description="暂无积分记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Trophy } from '@element-plus/icons-vue';
import { pointsApi } from '@/api/users';
import { PointsInfo, PointsLog, PointsType } from '@/types';

const pointsInfo = ref<PointsInfo | null>(null);
const logsData = ref<PointsLog[]>([]);
const logsLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(0);

const fetchPointsInfo = async () => {
  try {
    const res = await pointsApi.getMyPoints();
    pointsInfo.value = res.data;
  } catch (error) {
    ElMessage.error('获取积分信息失败');
  }
};

const fetchPointsLogs = async () => {
  logsLoading.value = true;
  try {
    const res = await pointsApi.getMyPointsLogs(currentPage.value, pageSize.value);
    logsData.value = res.data.data;
    total.value = res.data.total;
    totalPages.value = res.data.totalPages;
  } catch (error) {
    ElMessage.error('获取积分明细失败');
  } finally {
    logsLoading.value = false;
  }
};

const getPointsTypeText = (type: PointsType): string => {
  const map: Record<PointsType, string> = {
    [PointsType.CREATE_EVENT]: '创建活动',
    [PointsType.CHECK_IN]: '活动签到',
    [PointsType.PUBLISH_ANNOUNCEMENT]: '发表公告',
    [PointsType.KICKED_FROM_CLUB]: '被踢出社团',
    [PointsType.CANCEL_CHECKED_IN_REGISTRATION]: '退出已签到活动',
  };
  return map[type] || type;
};

const getPointsTypeTagType = (type: PointsType): string => {
  const positive: PointsType[] = [PointsType.CREATE_EVENT, PointsType.CHECK_IN, PointsType.PUBLISH_ANNOUNCEMENT];
  return positive.includes(type) ? 'success' : 'danger';
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

onMounted(() => {
  fetchPointsInfo();
  fetchPointsLogs();
});
</script>

<style scoped>
.my-points-page {
  padding: 20px;
}

.points-card {
  text-align: center;
}

.points-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.points-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.points-value {
  margin-bottom: 30px;
}

.points-number {
  font-size: 56px;
  font-weight: 700;
  color: #e6a23c;
}

.points-unit {
  font-size: 18px;
  color: #909399;
  margin-left: 4px;
}

.points-rules {
  text-align: left;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.points-rules h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.logs-card {
  min-height: 500px;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.amount-negative {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
