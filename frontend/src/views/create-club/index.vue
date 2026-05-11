<template>
  <div class="create-club-page">
    <el-card class="form-card">
      <template #header>
        <h2>创建社团申请</h2>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="create-club-form"
      >
        <el-form-item label="社团名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入社团名称" maxlength="50" />
        </el-form-item>

        <el-form-item label="社团分类" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="请选择社团分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="社团简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入社团简介"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="Logo URL" prop="logoUrl">
          <el-input v-model="formData.logoUrl" placeholder="请输入Logo图片URL" />
          <div class="logo-preview" v-if="formData.logoUrl">
            <el-avatar :size="80" :src="formData.logoUrl">
              {{ formData.name?.charAt(0) || '社' }}
            </el-avatar>
          </div>
        </el-form-item>

        <el-form-item label="招新口号" prop="recruitmentSlogan">
          <el-input
            v-model="formData.recruitmentSlogan"
            type="textarea"
            :rows="2"
            placeholder="请输入招新口号"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交申请
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { clubsApi } from '@/api/clubs';
import { ClubCategory } from '@/types';

const router = useRouter();
const formRef = ref<FormInstance>();
const categories = ref<ClubCategory[]>([]);
const submitting = ref(false);

const formData = reactive({
  name: '',
  categoryId: '',
  description: '',
  logoUrl: '',
  recruitmentSlogan: '',
});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入社团名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  categoryId: [
    { required: true, message: '请选择社团分类', trigger: 'change' },
  ],
  description: [
    { required: true, message: '请输入社团简介', trigger: 'blur' },
    { min: 10, max: 500, message: '长度在 10 到 500 个字符', trigger: 'blur' },
  ],
};

const fetchCategories = async () => {
  try {
    categories.value = await clubsApi.getCategories();
  } catch (error) {
    ElMessage.error('获取分类失败');
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await ElMessageBox.confirm(
          '提交后将等待管理员审核，确定要提交吗？',
          '确认提交',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
          }
        );

        submitting.value = true;
        await clubsApi.createApplication({
          name: formData.name,
          categoryId: formData.categoryId,
          description: formData.description,
          logoUrl: formData.logoUrl,
          recruitmentSlogan: formData.recruitmentSlogan,
        });

        ElMessage.success('申请已提交，请等待管理员审核');
        router.push('/my-clubs');
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('提交失败');
        }
      } finally {
        submitting.value = false;
      }
    }
  });
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.create-club-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.form-card {
  padding: 20px;
}

.form-card :deep(.el-card__header h2) {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.create-club-form {
  max-width: 600px;
}

.logo-preview {
  margin-top: 12px;
}
</style>
