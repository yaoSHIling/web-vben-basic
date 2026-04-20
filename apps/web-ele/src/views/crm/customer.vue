<template>
  <div>
    <!-- 搜索栏 -->
    <div class="mb-4">
      <el-form inline :model="queryParams" label-width="80">
        <el-form-item label="客户名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入客户名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="客户等级">
          <el-select v-model="queryParams.level" placeholder="全部" clearable>
            <el-option label="重点" :value="1" />
            <el-option label="重要" :value="2" />
            <el-option label="普通" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable>
            <el-option label="潜在" :value="1" />
            <el-option label="意向" :value="2" />
            <el-option label="成交" :value="3" />
            <el-option label="流失" :value="4" />
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

    <!-- 统计卡片 -->
    <div class="flex gap-4 mb-4">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">客户总数</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value text-warning">{{ stats.intent }}</div>
        <div class="stat-label">意向客户</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value text-success">{{ stats.deal }}</div>
        <div class="stat-label">成交客户</div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-value text-danger">{{ stats.pendingTask }}</div>
        <div class="stat-label">待办任务</div>
      </el-card>
    </div>

    <!-- 工具栏 -->
    <div class="mb-4 flex justify-between items-center">
      <div>
        <el-button type="primary" @click="handleAdd">
          <icon-plus class="mr-1" />新增客户
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" stripe v-loading="loading">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="客户名称" min-width="140" />
      <el-table-column prop="company" label="公司" min-width="160" show-overflow-tooltip />
      <el-table-column prop="mobile" label="手机号" width="130" />
      <el-table-column prop="industry" label="行业" width="100" />
      <el-table-column prop="level" label="等级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)" size="small">
            {{ levelLabel(row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastFollowupAt" label="最后跟进" width="160" />
      <el-table-column prop="createdTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleFollowup(row)">跟进</el-button>
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @pagination="loadData"
      />
    </div>

    <!-- 新增/编辑客户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90">
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="formData.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="公司名称" prop="company">
          <el-input v-model="formData.company" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="行业">
          <el-select v-model="formData.industry" placeholder="请选择行业" clearable>
            <el-option v-for="item in dicts.industry" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户来源">
          <el-select v-model="formData.source" placeholder="请选择来源" clearable>
            <el-option v-for="(label, key) in dicts.source" :key="key" :label="label" :value="label" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户等级">
          <el-radio-group v-model="formData.level">
            <el-radio :label="1">重点</el-radio>
            <el-radio :label="2">重要</el-radio>
            <el-radio :label="3">普通</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 跟进记录弹窗 -->
    <el-dialog v-model="followupVisible" title="添加跟进记录" width="550px" destroy-on-close>
      <div v-if="currentCustomer" class="mb-4 el-alert el-alert--info is-light">
        当前客户：<b>{{ currentCustomer.name }}</b>
      </div>
      <el-form ref="followupFormRef" :model="followupData" :rules="followupRules" label-width="90">
        <el-form-item label="跟进方式" prop="followupType">
          <el-select v-model="followupData.followupType" placeholder="请选择">
            <el-option label="📞 电话" :value="1" />
            <el-option label="🏢 上门拜访" :value="2" />
            <el-option label="💬 微信" :value="3" />
            <el-option label="📧 邮件" :value="4" />
            <el-option label="📝 其他" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input
            v-model="followupData.content"
            type="textarea"
            :rows="4"
            placeholder="本次沟通的主要内容、客户反馈、需求意向等"
          />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker
            v-model="followupData.nextFollowupAt"
            type="datetime"
            placeholder="选择时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="下次计划">
          <el-input v-model="followupData.nextPlan" placeholder="下次跟进计划，如：安排上门演示" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followupVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleFollowupSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="CrmCustomer">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  pageCustomersApi,
  saveCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
  addFollowupApi,
  customerStatsApi,
  type CrmApi,
} from '#/api/modules/crm';

definePage({ meta: { title: '客户管理', icon: 'lucide:users' } });

// ===================== 列表数据 =====================
const loading = ref(false);
const total = ref(0);
const tableData = ref<CrmApi.Customer[]>([]);
const stats = reactive({
  total: 0,
  potential: 0,
  intent: 0,
  deal: 0,
  lost: 0,
  pendingTask: 0,
  overdueTask: 0,
});

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  level: undefined as number | undefined,
  status: undefined as number | undefined,
});

// ===================== 字典 =====================
const dicts = {
  industry: [
    { value: 'IT', label: 'IT/互联网' },
    { value: '金融', label: '金融' },
    { value: '制造', label: '制造业' },
    { value: '医疗', label: '医疗健康' },
    { value: '教育', label: '教育培训' },
    { value: '零售', label: '零售/电商' },
    { value: '其他', label: '其他' },
  ],
  source: {
    官网: '官网',
    展会: '展会',
    转介绍: '转介绍',
    电话拓展: '电话拓展',
    其他: '其他',
  },
};

// ===================== 加载数据 =====================
async function loadData() {
  loading.value = true;
  try {
    const res = await pageCustomersApi(queryParams);
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    ElMessage.error('加载客户列表失败');
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    const res = await customerStatsApi();
    Object.assign(stats, res);
  } catch {
    // stats 可选，失败不提示
  }
}

function handleQuery() {
  queryParams.page = 1;
  loadData();
}

function resetQuery() {
  queryParams.name = '';
  queryParams.level = undefined;
  queryParams.status = undefined;
  queryParams.page = 1;
  loadData();
}

// ===================== 新增/编辑 =====================
const dialogVisible = ref(false);
const dialogTitle = ref('');
const submitLoading = ref(false);
const formRef = ref();
const isEdit = ref(false);
const currentEditId = ref<number | null>(null);

const formData = reactive<CrmApi.CustomerSaveDTO>({
  name: '',
  mobile: '',
  company: '',
  industry: '',
  source: '',
  level: 3,
  remark: '',
});

const formRules = {
  name: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
};

function handleAdd() {
  isEdit.value = false;
  dialogTitle.value = '新增客户';
  currentEditId.value = null;
  Object.assign(formData, {
    name: '',
    mobile: '',
    company: '',
    industry: '',
    source: '',
    level: 3,
    remark: '',
  });
  dialogVisible.value = true;
}

function handleEdit(row: CrmApi.Customer) {
  isEdit.value = true;
  dialogTitle.value = '编辑客户';
  currentEditId.value = row.id;
  Object.assign(formData, {
    name: row.name,
    mobile: row.mobile || '',
    company: row.company || '',
    industry: row.industry || '',
    source: row.source || '',
    level: row.level,
    remark: row.remark || '',
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    if (isEdit.value && currentEditId.value) {
      await updateCustomerApi(currentEditId.value, formData);
      ElMessage.success('修改成功');
    } else {
      await saveCustomerApi(formData);
      ElMessage.success('新增成功');
    }
    dialogVisible.value = false;
    loadData();
    loadStats();
  } catch {
    ElMessage.error('操作失败，请稍后重试');
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row: CrmApi.Customer) {
  await ElMessageBox.confirm(`确定删除客户"${row.name}"吗？`, '删除确认', { type: 'warning' });
  await deleteCustomerApi(row.id);
  ElMessage.success('删除成功');
  loadData();
  loadStats();
}

// ===================== 跟进记录 =====================
const followupVisible = ref(false);
const followupFormRef = ref();
const currentCustomer = ref<CrmApi.Customer | null>(null);

const followupData = reactive<CrmApi.FollowupSaveDTO>({
  customerId: 0,
  followupType: 1,
  content: '',
  nextPlan: '',
  nextFollowupAt: '',
});

const followupRules = {
  followupType: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }],
};

function handleFollowup(row: CrmApi.Customer) {
  currentCustomer.value = row;
  Object.assign(followupData, {
    customerId: row.id,
    followupType: 1,
    content: '',
    nextPlan: '',
    nextFollowupAt: '',
  });
  followupVisible.value = true;
}

async function handleFollowupSubmit() {
  const valid = await followupFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    await addFollowupApi(followupData);
    ElMessage.success('跟进记录已添加');
    followupVisible.value = false;
    loadData();
    loadStats();
  } catch {
    ElMessage.error('添加跟进记录失败');
  } finally {
    submitLoading.value = false;
  }
}

// ===================== 辅助函数 =====================
function levelLabel(v?: number) {
  return { 1: '重点', 2: '重要', 3: '普通' }[v || 3] || '普通';
}
function levelTagType(v?: number) {
  return { 1: 'danger', 2: 'warning', 3: 'info' }[v || 3] || 'info';
}
function statusLabel(v?: number) {
  return { 1: '潜在', 2: '意向', 3: '成交', 4: '流失' }[v || 1] || '潜在';
}
function statusTagType(v?: number) {
  return { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger' }[v || 1] || 'info';
}

// ===================== 初始化 =====================
onMounted(() => {
  loadData();
  loadStats();
});
</script>

<style scoped>
.stat-card {
  flex: 1;
  text-align: center;
  min-width: 120px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}
.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.text-success {
  color: var(--el-color-success);
}
.text-warning {
  color: var(--el-color-warning);
}
.text-danger {
  color: var(--el-color-danger);
}
</style>
