<template>
  <div>
    <!-- 切换 Tab -->
    <el-tabs v-model="activeTab" class="mb-4">
      <el-tab-pane label="\ud83d\udccb 我的待办" name="pending">
        <span>待审批 <el-badge :value="pendingTotal" /></span>
      </el-tab-pane>
      <el-tab-pane label="\ud83d\udcdd 我的申请" name="mine" />
    </el-tabs>

    <!-- ==================== 我的待办 ==================== -->
    <div v-if="activeTab === 'pending'">
      <!-- 筛选 -->
      <div class="mb-4">
        <el-form inline :model="pendingQuery" label-width="80">
          <el-form-item label="流程标题">
            <el-input v-model="pendingQuery.title" placeholder="搜索标题" clearable @keyup.enter="loadPending" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadPending">
              <icon-search class="mr-1" />搜索
            </el-button>
            <el-button @click="pendingQuery.title = ''; loadPending()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 待办列表 -->
      <div v-loading="pendingLoading">
        <el-empty v-if="pendingList.length === 0" description="暂无待审批任务" />

        <el-card
          v-for="task in pendingList"
          :key="task.id"
          class="task-card mb-3"
          shadow="hover"
        >
          <div class="flex justify-between items-start">
            <!-- 左侧信息 -->
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <el-tag type="warning" size="small">待审批</el-tag>
                <span class="text-sm text-gray-400">|</span>
                <span class="task-title">{{ task.instanceTitle || task.nodeName }}</span>
              </div>
              <div class="text-sm text-gray-500 mb-1">
                节点：<b>{{ task.nodeName }}</b>
              </div>
              <div class="text-xs text-gray-400">
                申请人：{{ task.initiatorName }} &nbsp;|&nbsp;
                提交时间：{{ formatDate(task.createdTime) }}
              </div>
              <!-- 表单数据预览 -->
              <div v-if="task.formData" class="mt-2 p-2 bg-gray-50 rounded text-xs">
                <span class="text-gray-500">表单数据：</span>
                <pre class="mt-1 text-gray-600">{{ JSON.stringify(task.formData, null, 2) }}</pre>
              </div>
            </div>

            <!-- 右侧操作 -->
            <div class="flex gap-2 ml-4">
              <el-button type="primary" size="small" @click="openApproveDialog(task)">
                审批
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div v-if="pendingTotal > 0" class="mt-4 flex justify-end">
        <el-pagination
          v-model:page="pendingQuery.page"
          v-model:page-size="pendingQuery.pageSize"
          :total="pendingTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @pagination="loadPending"
        />
      </div>
    </div>

    <!-- ==================== 我的申请 ==================== -->
    <div v-if="activeTab === 'mine'">
      <div class="mb-4">
        <el-form inline :model="mineQuery" label-width="80">
          <el-form-item label="流程状态">
            <el-select v-model="mineQuery.status" placeholder="全部" clearable @change="loadMine">
              <el-option label="审批中" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已拒绝" :value="2" />
              <el-option label="已撤回" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadMine">
              <icon-search class="mr-1" />搜索
            </el-button>
            <el-button @click="mineQuery.status = undefined; loadMine()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="mineList" stripe v-loading="mineLoading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="流程标题" min-width="200" />
        <el-table-column prop="definitionCode" label="工作流" width="150" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="申请时间" width="160" />
        <el-table-column prop="finishedAt" label="结束时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewInstance(row)">详情</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="warning"
              size="small"
              @click="handleRevoke(row)"
            >
              撤回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="mineTotal > 0" class="mt-4 flex justify-end">
        <el-pagination
          v-model:page="mineQuery.page"
          v-model:page-size="mineQuery.pageSize"
          :total="mineTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @pagination="loadMine"
        />
      </div>
    </div>

    <!-- ==================== 审批弹窗 ==================== -->
    <el-dialog v-model="approveDialogVisible" title="审批" width="500px" destroy-on-close>
      <div v-if="currentTask" class="mb-4 el-alert el-alert--info is-light">
        <b>{{ currentTask.instanceTitle }}</b>
        <div class="text-sm mt-1">节点：{{ currentTask.nodeName }}</div>
        <div v-if="currentTask.formData" class="mt-2 text-xs">
          表单数据：<pre class="mt-1">{{ JSON.stringify(currentTask.formData, null, 2) }}</pre>
        </div>
      </div>

      <el-form ref="approveFormRef" :model="approveForm" label-width="80">
        <el-form-item label="审批意见" prop="opinion">
          <el-input
            v-model="approveForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审批意见（选填）"
          />
        </el-form-item>
        <el-form-item label="操作" prop="action" required>
          <el-radio-group v-model="approveForm.action">
            <el-radio label="agree">\u2705 同意</el-radio>
            <el-radio label="reject">\u274c 拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleApprove">
          提交审批
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 详情弹窗 ==================== -->
    <el-dialog v-model="detailVisible" title="流程详情" width="700px" destroy-on-close>
      <div v-if="currentInstance">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="流程标题">{{ currentInstance.title }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentInstance.status)">
              {{ statusLabel(currentInstance.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工作流">{{ currentInstance.definitionCode }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentInstance.startedAt }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentInstance.finishedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="表单数据" :span="2">
            <pre class="text-xs">{{ JSON.stringify(currentInstance.formData, null, 2) }}</pre>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">审批历史</el-divider>

        <el-timeline>
          <el-timeline-item
            v-for="h in instanceHistory"
            :key="h.id"
            :timestamp="formatDate(h.operatedAt)"
            placement="top"
          >
            <el-card shadow="never" class="history-card">
              <div class="flex justify-between">
                <div>
                  <b>{{ h.operatorName }}</b>
                  <el-tag
                    size="small"
                    :type="actionTagType(h.action)"
                    class="ml-2"
                  >
                    {{ actionLabel(h.action) }}
                  </el-tag>
                </div>
                <div class="text-xs text-gray-400">{{ h.nodeName }}</div>
              </div>
              <div v-if="h.opinion" class="text-sm text-gray-500 mt-1">
                意见：{{ h.opinion }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="WorkflowMyTasks">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  myTasksApi,
  myInstancesApi,
  approveTaskApi,
  revokeWorkflowApi,
  getInstanceApi,
  getInstanceHistoryApi,
} from '#/api/modules/workflow';

definePage({ meta: { title: '我的审批', icon: 'lucide:clipboard-check' } });

// ===================== 状态 =====================
const activeTab = ref('pending');

// ===================== 我的待办 =====================
const pendingLoading = ref(false);
const pendingList = ref<any[]>([]);
const pendingTotal = ref(0);
const pendingQuery = reactive({ page: 1, pageSize: 10, title: '' });

async function loadPending() {
  pendingLoading.value = true;
  try {
    const res = await myTasksApi(pendingQuery);
    pendingList.value = res.list;
    pendingTotal.value = res.total;
  } catch {
    ElMessage.error('加载待办列表失败');
  } finally {
    pendingLoading.value = false;
  }
}

// ===================== 我的申请 =====================
const mineLoading = ref(false);
const mineList = ref<any[]>([]);
const mineTotal = ref(0);
const mineQuery = reactive({ page: 1, pageSize: 10, status: undefined as number | undefined });

async function loadMine() {
  mineLoading.value = true;
  try {
    const res = await myInstancesApi(mineQuery);
    mineList.value = res.list;
    mineTotal.value = res.total;
  } catch {
    ElMessage.error('加载申请列表失败');
  } finally {
    mineLoading.value = false;
  }
}

// ===================== 审批弹窗 =====================
const approveDialogVisible = ref(false);
const submitLoading = ref(false);
const approveFormRef = ref();
const currentTask = ref<any>(null);
const approveForm = reactive({ action: 'agree', opinion: '' });

function openApproveDialog(task: any) {
  currentTask.value = task;
  approveForm.action = 'agree';
  approveForm.opinion = '';
  approveDialogVisible.value = true;
}

async function handleApprove() {
  if (!approveForm.action) {
    ElMessage.warning('请选择审批操作');
    return;
  }

  submitLoading.value = true;
  try {
    await approveTaskApi({
      taskId: currentTask.value.id,
      action: approveForm.action,
      opinion: approveForm.opinion,
    });
    ElMessage.success(approveForm.action === 'agree' ? '已同意' : '已拒绝');
    approveDialogVisible.value = false;
    loadPending();
    loadMine();
  } catch {
    ElMessage.error('审批失败');
  } finally {
    submitLoading.value = false;
  }
}

// ===================== 详情/撤回 =====================
const detailVisible = ref(false);
const currentInstance = ref<any>(null);
const instanceHistory = ref<any[]>([]);

async function viewInstance(row: any) {
  try {
    const [instance, history] = await Promise.all([
      getInstanceApi(row.id),
      getInstanceHistoryApi(row.id),
    ]);
    currentInstance.value = instance;
    instanceHistory.value = history;
    detailVisible.value = true;
  } catch {
    ElMessage.error('加载详情失败');
  }
}

async function handleRevoke(row: any) {
  await ElMessageBox.confirm('确定撤回该申请吗？', '撤回确认', { type: 'warning' });
  try {
    await revokeWorkflowApi({ instanceId: row.id });
    ElMessage.success('撤回成功');
    loadMine();
  } catch {
    ElMessage.error('撤回失败');
  }
}

// ===================== 辅助函数 =====================
function statusLabel(v?: number) {
  return { 0: '审批中', 1: '已通过', 2: '已拒绝', 3: '已撤回' }[v || 0] || '未知';
}
function statusTagType(v?: number) {
  return { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }[v || 0] || 'info';
}
function actionLabel(v?: string) {
  return { submit: '提交', agree: '同意', reject: '拒绝', transfer: '转交', revoke: '撤回' }[v || ''] || v;
}
function actionTagType(v?: string) {
  return { submit: 'primary', agree: 'success', reject: 'danger', transfer: 'warning', revoke: 'info' }[v || ''] || 'info';
}
function formatDate(d?: string) {
  if (!d) return '-';
  return d.slice(0, 16).replace('T', ' ');
}

// ===================== 初始化 =====================
onMounted(() => {
  loadPending();
  loadMine();
});
</script>

<style scoped>
.task-card {
  border-left: 3px solid var(--el-color-warning);
}
.task-title {
  font-weight: 500;
  font-size: 14px;
}
.history-card {
  padding: 8px 12px;
}
</style>
