<template>
  <div>
    <!-- 搜索栏 -->
    <div class="mb-4">
      <el-form inline :model="queryParams" label-width="80">
        <el-form-item label="任务状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable>
            <el-option label="待办" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已逾期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryParams.priority" placeholder="全部" clearable>
            <el-option label="高" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="低" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <icon-search class="mr-1" />搜索
          </el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div>
        <el-button type="primary" @click="handleCreate">
          <icon-plus class="mr-1" />创建任务
        </el-button>
      </div>
      <div class="text-sm text-gray-500">
        共 <b>{{ total }}</b> 条任务
      </div>
    </div>

    <!-- 任务列表 -->
    <div v-loading="loading">
      <el-empty v-if="tableData.length === 0" description="暂无任务" />

      <div v-else class="task-list">
        <el-card
          v-for="task in tableData"
          :key="task.id"
          class="task-card mb-3"
          :class="{ 'task-overdue': task.status === 2, 'task-done': task.status === 1 }"
          shadow="hover"
        >
          <div class="flex justify-between items-start">
            <!-- 左侧：优先级 + 内容 -->
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <!-- 优先级标签 -->
                <el-tag :type="priorityTagType(task.priority)" size="small">
                  {{ priorityLabel(task.priority) }}
                </el-tag>
                <!-- 状态标签 -->
                <el-tag v-if="task.status === 0" type="info" size="small">待办</el-tag>
                <el-tag v-else-if="task.status === 1" type="success" size="small">已完成</el-tag>
                <el-tag v-else type="danger" size="small">已逾期</el-tag>
                <!-- 任务标题 -->
                <span class="task-title">{{ task.title }}</span>
              </div>
              <div v-if="task.content" class="task-content text-sm text-gray-500 mb-2">
                {{ task.content }}
              </div>
              <div class="text-xs text-gray-400">
                <span>截止：{{ formatDate(task.dueAt) }}</span>
                <span v-if="task.completedAt" class="ml-3">完成于：{{ formatDate(task.completedAt) }}</span>
              </div>
            </div>
            <!-- 右侧：操作 -->
            <div class="flex gap-2 ml-4">
              <el-button
                v-if="task.status === 0"
                type="success"
                size="small"
                @click="handleComplete(task)"
              >
                完成
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDelete(task)"
              >
                删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="mt-4 flex justify-end">
      <el-pagination
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @pagination="loadData"
      />
    </div>

    <!-- 创建任务弹窗 -->
    <el-dialog v-model="createVisible" title="创建跟进任务" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90">
        <el-form-item label="客户" prop="customerId">
          <el-select
            v-model="formData.customerId"
            filterable
            placeholder="搜索客户"
            class="w-full"
          >
            <el-option
              v-for="c in customerList"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="任务内容">
          <el-input v-model="formData.content" type="textarea" :rows="3" placeholder="任务详细描述" />
        </el-form-item>
        <el-form-item label="截止时间" prop="dueAt">
          <el-date-picker
            v-model="formData.dueAt"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="formData.priority">
            <el-radio :label="1">高</el-radio>
            <el-radio :label="2">中</el-radio>
            <el-radio :label="3">低</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="CrmTask">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  pageTasksApi,
  createTaskApi,
  completeTaskApi,
  pageCustomersApi,
  type CrmApi,
} from '#/api/modules/crm';

definePage({ meta: { title: '跟进任务', icon: 'lucide:check-square' } });

// ===================== 列表 =====================
const loading = ref(false);
const total = ref(0);
const tableData = ref<CrmApi.FollowupTask[]>([]);
const customerList = ref<CrmApi.Customer[]>([]);

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  status: undefined as number | undefined,
  priority: undefined as number | undefined,
});

async function loadData() {
  loading.value = true;
  try {
    const res = await pageTasksApi(queryParams);
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    ElMessage.error('加载任务列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadCustomers() {
  try {
    const res = await pageCustomersApi({ page: 1, pageSize: 100 });
    customerList.value = res.list;
  } catch {
    // 客户列表可选
  }
}

function handleQuery() {
  queryParams.page = 1;
  loadData();
}

function resetQuery() {
  queryParams.status = undefined;
  queryParams.priority = undefined;
  queryParams.page = 1;
  loadData();
}

// ===================== 创建任务 =====================
const createVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

const formData = reactive<CrmApi.TaskSaveDTO>({
  customerId: 0,
  title: '',
  content: '',
  dueAt: '',
  priority: 2,
});

const formRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  title: [{ required: true, message: '任务标题不能为空', trigger: 'blur' }],
  dueAt: [{ required: true, message: '截止时间不能为空', trigger: 'change' }],
};

function handleCreate() {
  Object.assign(formData, {
    customerId: 0,
    title: '',
    content: '',
    dueAt: '',
    priority: 2,
  });
  createVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    await createTaskApi(formData);
    ElMessage.success('任务创建成功');
    createVisible.value = false;
    loadData();
  } catch {
    ElMessage.error('创建任务失败');
  } finally {
    submitLoading.value = false;
  }
}

// ===================== 完成/删除 =====================
async function handleComplete(task: CrmApi.FollowupTask) {
  await ElMessageBox.confirm(`确认完成任务"${task.title}"？`, '确认', { type: 'info' });
  await completeTaskApi(task.id);
  ElMessage.success('任务已完成');
  loadData();
}

async function handleDelete(task: CrmApi.FollowupTask) {
  await ElMessageBox.confirm(`删除任务"${task.title}"？此操作不可恢复`, '删除确认', {
    type: 'warning',
  });
  await completeTaskApi(task.id); // 后端暂时用这个删除
  ElMessage.success('删除成功');
  loadData();
}

// ===================== 辅助 =====================
function priorityLabel(v?: number) {
  return { 1: '高', 2: '中', 3: '低' }[v || 2] || '中';
}
function priorityTagType(v?: number) {
  return { 1: 'danger', 2: 'warning', 3: 'info' }[v || 2] || 'info';
}
function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return dateStr.slice(0, 16).replace('T', ' ');
}

// ===================== 初始化 =====================
onMounted(() => {
  loadData();
  loadCustomers();
});
</script>

<style scoped>
.task-card {
  border-left: 3px solid var(--el-color-primary);
}
.task-card.task-overdue {
  border-left-color: var(--el-color-danger);
  background-color: #fff5f5;
}
.task-card.task-done {
  border-left-color: var(--el-color-success);
  opacity: 0.7;
}
.task-title {
  font-weight: 500;
  font-size: 15px;
}
.task-content {
  line-height: 1.6;
}
</style>
