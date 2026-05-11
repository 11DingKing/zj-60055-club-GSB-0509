<template>
  <div class="categories-page">
    <el-card class="page-header-card">
      <template #header>
        <div class="header-content">
          <h2>社团分类管理</h2>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增分类
          </el-button>
        </div>
      </template>

      <el-table :data="categories" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300">
          <template #default="scope">
            {{ scope.row.description || '暂无描述' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" text @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              type="danger"
              text
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="categories.length === 0 && !loading" description="暂无分类数据" />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { clubsApi } from '@/api/clubs';
import { ClubCategory } from '@/types';

const categories = ref<ClubCategory[]>([]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref<string | null>(null);

const formRef = ref<FormInstance>();
const formData = reactive({
  name: '',
  description: '',
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
};

const fetchCategories = async () => {
  loading.value = true;
  try {
    categories.value = await clubsApi.getCategories();
  } catch (error) {
    ElMessage.error('获取分类列表失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEdit.value = false;
  editId.value = null;
  formData.name = '';
  formData.description = '';
  dialogVisible.value = true;
};

const handleEdit = (row: ClubCategory) => {
  isEdit.value = true;
  editId.value = row.id;
  formData.name = row.name;
  formData.description = row.description || '';
  dialogVisible.value = true;
};

const handleDelete = async (row: ClubCategory) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${row.name}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await clubsApi.deleteCategory(row.id);
    ElMessage.success('删除成功');
    fetchCategories();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true;
        if (isEdit.value && editId.value) {
          await clubsApi.updateCategory(editId.value, {
            name: formData.name,
            description: formData.description,
          });
          ElMessage.success('编辑成功');
        } else {
          await clubsApi.createCategory({
            name: formData.name,
            description: formData.description,
          });
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        fetchCategories();
      } catch (error) {
        ElMessage.error(isEdit.value ? '编辑失败' : '创建失败');
      } finally {
        submitting.value = false;
      }
    }
  });
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
  fetchCategories();
});
</script>

<style scoped>
.categories-page {
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
</style>
