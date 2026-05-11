<template>
  <div class="points-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="points-card">
          <div class="points-header">
            <el-icon size="48" color="#409eff"><Medal /></el-icon>
            <div class="points-info">
              <p class="points-label">我的积分</p>
              <p class="points-value">{{ pointsInfo?.points || 0 }}</p>
            </div>
          </div>
          <div class="points-rules">
            <h4>积分规则</h4>
            <ul>
              <li><span class="rule-points">+20</span> 创建活动</li>
              <li><span class="rule-points">+10</span> 参加活动（成功签到）</li>
              <li><span class="rule-points">+5</span> 发表公告</li>
              <li><span class="rule-points negative">-30</span> 被踢出社团</li>
              <li><span class="rule-points negative">-5</span> 退出活动但已签到</li>
            </ul>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="logs-card">
          <template #header>
            <span>积分明细</span>
          </template>
          <div class="logs-list" v-loading="loading">
            <div
              v-for="log in pointsLogs"
              :key="log.id"
              class="log-item"
            >
              <div class="log-left">
                <el-icon :size="20" :class="log.type === 'AWARD' ? 'award-icon' : 'deduct-icon'">
                  <component :is="log.type === 'AWARD' ? 'Plus' : 'Minus'" />
                </el-icon>
                <div class="log-info">
                  <p class="log-reason">{{ log.reason }}</p>
                  <p class="log-time">{{ formatDateTime(log.createdAt) }}</p>
                </div>
              </div>
              <div class="log-right">
                <span :class="log.type === 'AWARD' ? 'award' : 'deduct'">
                  {{ log.type === 'AWARD' ? '+' : '-' }}{{ log.amount }}
                </span>
              </div>
            </div>
            <el-empty v-if="pointsLogs.length === 0 && !loading" description="暂无积分记录" />
          </div>
          <div class="pagination-wrapper" v-if="total > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchPointsLogs"
              @current-change="fetchPointsLogs"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Medal } from '@element-plus/icons-vue';
import { pointsApi, PointsInfo, PointsLog } from '@/api/points';

const pointsInfo = ref<PointsInfo | null>(null);
const pointsLogs = ref<PointsLog[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const fetchPointsInfo = async () => {
  try {
    pointsInfo.value = await pointsApi.getMyPoints();
  } catch (error) {
    ElMessage.error('获取积分信息失败');
  }
};

const fetchPointsLogs = async () => {
  loading.value = true;
  try {
    const res = await pointsApi.getMyPointsLogs({
      page: currentPage.value,
      pageSize: pageSize.value,
    });
    pointsLogs.value = res.list;
    total.value = res.total;
  } catch (error) {
    ElMessage.error('获取积分明细失败');
  } finally {
    loading.value = false;
  }
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
.points-page {
  padding: 20px;
}

.points-card {
  margin-bottom: 20px;
}

.points-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.points-info {
  color: white;
}

.points-label {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.points-value {
  margin: 0;
  font-size: 36px;
  font-weight: bold;
}

.points-rules h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.points-rules ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.points-rules li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  color: #606266;
}

.points-rules li:last-child {
  border-bottom: none;
}

.rule-points {
  font-weight: bold;
  color: #67c23a;
}

.rule-points.negative {
  color: #f56c6c;
}

.logs-card {
  min-height: 500px;
}

.logs-list {
  padding: 10px 0;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.award-icon {
  color: #67c23a;
}

.deduct-icon {
  color: #f56c6c;
}

.log-info {
  flex: 1;
}

.log-reason {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #303133;
}

.log-time {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.log-right {
  font-size: 18px;
  font-weight: bold;
}

.award {
  color: #67c23a;
}

.deduct {
  color: #f56c6c;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
