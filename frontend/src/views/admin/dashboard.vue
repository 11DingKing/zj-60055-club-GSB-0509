<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1>数据看板</h1>
      <p class="subtitle">实时了解社团活动管理系统的运行情况</p>
    </div>

    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card total-clubs">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalClubs }}</div>
              <div class="stat-label">社团总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card total-users">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card total-events">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalEvents }}</div>
              <div class="stat-label">活动总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card top-clubs">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40"><Trophy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.topActiveClubs?.length || 0 }}</div>
              <div class="stat-label">活跃社团</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>社团分类分布</span>
          </template>
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>近30天参与人次趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>签到率统计</span>
          </template>
          <div ref="checkinChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>最活跃社团 Top5</span>
          </template>
          <div class="top-clubs-list">
            <div
              v-for="(club, index) in stats.topActiveClubs"
              :key="club.id"
              class="top-club-item"
            >
              <div class="rank" :class="'rank-' + (index + 1)">
                {{ index + 1 }}
              </div>
              <el-avatar :size="40" :src="club.logoUrl">
                {{ club.name.charAt(0) }}
              </el-avatar>
              <div class="club-info">
                <div class="club-name">{{ club.name }}</div>
                <div class="club-stats">
                  <span>{{ club.eventCount }} 活动</span>
                  <span>{{ club.memberCount }} 成员</span>
                  <span>{{ club.totalParticipations }} 参与人次</span>
                </div>
              </div>
              <div class="activity-score">
                <span class="score-label">活跃度</span>
                <span class="score-value">{{ club.activityScore.toFixed(1) }}</span>
              </div>
            </div>
            <el-empty v-if="!stats.topActiveClubs || stats.topActiveClubs.length === 0" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="events-card" style="margin-top: 20px">
      <template #header>
        <span>本月活动</span>
      </template>
      <el-table :data="stats.thisMonthEvents" style="width: 100%">
        <el-table-column prop="name" label="活动名称" min-width="200" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="报名人数" width="100">
          <template #default="scope">
            {{ scope.row.registrationCount || 0 }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!stats.thisMonthEvents || stats.thisMonthEvents.length === 0" description="本月暂无活动" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import {
  OfficeBuilding,
  User,
  Calendar,
  Trophy,
} from '@element-plus/icons-vue';
import { statisticsApi } from '@/api/statistics';
import { DashboardStats, EventStatus } from '@/types';

const categoryChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();
const checkinChartRef = ref<HTMLElement>();

let categoryChart: echarts.ECharts | null = null;
let trendChart: echarts.ECharts | null = null;
let checkinChart: echarts.ECharts | null = null;

const stats = ref<DashboardStats>({
  totalClubs: 0,
  totalUsers: 0,
  totalEvents: 0,
  clubsByCategory: [],
  thisMonthEvents: [],
  last30DaysParticipation: [],
  topActiveClubs: [],
  checkInStats: [],
});

const fetchStats = async () => {
  try {
    const res = await statisticsApi.getDashboardStats();
    stats.value = res.data;
    renderCharts();
  } catch (error) {
    ElMessage.error('获取统计数据失败');
  }
};

const renderCharts = () => {
  renderCategoryChart();
  renderTrendChart();
  renderCheckinChart();
};

const renderCategoryChart = () => {
  if (!categoryChartRef.value) return;

  if (!categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value);
  }

  const data = stats.value.clubsByCategory.map(c => ({
    name: c.name,
    value: c.value,
  }));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 个 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data,
      },
    ],
    color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
  };

  categoryChart.setOption(option);
};

const renderTrendChart = () => {
  if (!trendChartRef.value) return;

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }

  const data = stats.value.last30DaysParticipation;
  const dates = data.map(d => d.date.slice(5));
  const counts = data.map(d => d.count);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>参与人次: {c}',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: '人次',
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: counts,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
        lineStyle: {
          color: '#409eff',
          width: 2,
        },
        itemStyle: {
          color: '#409eff',
        },
      },
    ],
  };

  trendChart.setOption(option);
};

const renderCheckinChart = () => {
  if (!checkinChartRef.value) return;

  if (!checkinChart) {
    checkinChart = echarts.init(checkinChartRef.value);
  }

  const data = stats.value.checkInStats;
  const names = data.map(d => d.name.length > 8 ? d.name.slice(0, 8) + '...' : d.name);
  const rates = data.map(d => (d.checkInRate * 100).toFixed(1));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}<br/>签到率: {c}%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      name: '签到率(%)',
      max: 100,
    },
    series: [
      {
        type: 'bar',
        barWidth: '40%',
        data: rates,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#95d475' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  checkinChart.setOption(option);
};

const getStatusText = (status: EventStatus): string => {
  const statusMap: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: '报名中',
    [EventStatus.REGISTRATION_CLOSED]: '报名截止',
    [EventStatus.ONGOING]: '进行中',
    [EventStatus.ENDED]: '已结束',
  };
  return statusMap[status] || status;
};

const getStatusTagType = (status: EventStatus): string => {
  const typeMap: Record<EventStatus, string> = {
    [EventStatus.REGISTERING]: 'success',
    [EventStatus.REGISTRATION_CLOSED]: 'warning',
    [EventStatus.ONGOING]: 'primary',
    [EventStatus.ENDED]: 'info',
  };
  return typeMap[status] || 'info';
};

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleResize = () => {
  categoryChart?.resize();
  trendChart?.resize();
  checkinChart?.resize();
};

onMounted(() => {
  fetchStats();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  categoryChart?.dispose();
  trendChart?.dispose();
  checkinChart?.dispose();
});
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.page-header .subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.total-clubs {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.total-users {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.total-events {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.top-clubs {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: rgba(255, 255, 255, 0.8);
}

.stat-info {
  color: white;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
}

.top-clubs-list {
  padding: 10px 0;
}

.top-club-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  gap: 12px;
}

.top-club-item:last-child {
  border-bottom: none;
}

.rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
}

.rank-4,
.rank-5 {
  background: #e0e0e0;
  color: #606266;
}

.club-info {
  flex: 1;
  min-width: 0;
}

.club-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.club-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.activity-score {
  text-align: right;
  flex-shrink: 0;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #909399;
}

.score-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.events-card :deep(.el-card__header) {
  padding: 15px 20px;
}
</style>
