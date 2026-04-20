<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-medium">工作流执行记录</span>
          <el-button size="small" @click="loadData">
            <icon-refresh /> 刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div class="mb-4 flex gap-3 items-center flex-wrap">
        <el-select v-model="query.status" placeholder="执行状态" clearable size="small" @change="loadData">
          <el-option label="运行中" :value="0" />
          <el-option label="成功" :value="1" />
          <el-option label="失败" :value="2" />
          <el-option label="暂停" :value="3" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="工作流名称" size="small" clearable
          style="width: 200px" @change="loadData" />
        <el-button type="primary" size="small" @click="loadData">
          <icon-search /> 搜索
        </el-button>
      </div>

      <!-- 列表 -->
      <el-table :data="list" stripe v-loading="loading" @row-click="openDetail">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="definitionCode" label="工作流" width="180" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inputData" label="输入" min-width="200">
          <template #default="{ row }">
            <span class="text-xs ellipsis-2">{{ formatJson(row.inputData) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outputData" label="输出" min-width="200">
          <template #default="{ row }">
            <span class="text-xs ellipsis-2">{{ formatJson(row.outputData) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="startedAt" label="开始时间" width="160" />
        <el-table-column prop="finishedAt" label="结束时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click.stop="openLogs(row)">
              执行日志
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @pagination="loadData"
        />
      </div>
    </el-card>

    <!-- 执行日志抽屉 -->
    <el-drawer v-model="logDrawerVisible" title="执行日志" size="60%">
      <div v-if="currentInstance">
        <el-descriptions :column="2" border size="small" class="mb-4">
          <el-descriptions-item label="工作流">{{ currentInstance.definitionCode }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentInstance.status)" size="small">
              {{ statusLabel(currentInstance.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentInstance.startedAt }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentInstance.finishedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前节点" :span="2">{{ currentInstance.currentNodeId || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentInstance.errorMsg" label="错误" :span="2">
            <span class="text-red-500">{{ currentInstance.errorMsg }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-card shadow="never" class="mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">审批任务</span>
              <el-button size="small" text @click="reloadDetail">
                <icon-refresh /> 刷新任务
              </el-button>
            </div>
          </template>
          <el-empty v-if="!tasks.length" description="当前实例暂无审批任务" :image-size="80" />
          <el-table v-else :data="tasks" size="small" stripe>
            <el-table-column prop="nodeName" label="节点" min-width="120" />
            <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="assigneeName" label="审批人" width="120">
              <template #default="{ row }">
                {{ row.assigneeName || row.assigneeExpr || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="任务状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="taskStatusTagType(row.status)">
                  {{ taskStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="opinion" label="审批意见" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.opinion || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="operatedAt" label="处理时间" width="160">
              <template #default="{ row }">
                {{ row.operatedAt || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 0">
                  <el-button
                    link
                    type="success"
                    size="small"
                    :loading="submittingTaskId === row.id"
                    @click="handleApprove(row, true)"
                  >
                    通过
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    size="small"
                    :loading="submittingTaskId === row.id"
                    @click="handleApprove(row, false)"
                  >
                    驳回
                  </el-button>
                </template>
                <span v-else class="text-gray-400">已处理</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 日志时间线 -->
        <el-timeline>
          <el-timeline-item
            v-for="log in logs"
            :key="log.id"
            :timestamp="`${log.startedAt} (${log.elapsedMs}ms)`"
            placement="top"
            :type="logStatusColor(log.status)"
          >
            <el-card shadow="never" class="log-card">
              <div class="flex justify-between">
                <div class="flex items-center gap-2">
                  <span class="node-icon-sm">{{ nodeIcon(log.nodeType) }}</span>
                  <b>{{ log.nodeName }}</b>
                  <el-tag size="small" :type="logStatusColor(log.status)">
                    {{ logStatusLabel(log.status) }}
                  </el-tag>
                </div>
                <span class="text-xs text-gray-400">{{ log.nodeType }}</span>
              </div>
              <div v-if="log.errorMsg" class="text-red-500 text-xs mt-1">
                错误：{{ log.errorMsg }}
              </div>
              <div v-if="log.outputData" class="mt-1">
                <pre class="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
{{ formatJson(log.outputData) }}</pre>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="WorkflowInstancePage">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { WorkflowApi } from '#/api/modules/workflow';
import { workflowInstanceApi, workflowTaskApi } from '#/api/modules/workflow';

definePage({ meta: { title: '执行记录', icon: 'lucide:history' } });

const loading = ref(false);
const list = ref<WorkflowApi.WfInstance[]>([]);
const total = ref(0);
const query = reactive({ page: 1, pageSize: 10, status: undefined as number | undefined, keyword: '' });

const logDrawerVisible = ref(false);
const currentInstance = ref<WorkflowApi.WfInstance | null>(null);
const logs = ref<WorkflowApi.WfInstanceLog[]>([]);
const tasks = ref<WorkflowApi.WfTask[]>([]);
const submittingTaskId = ref<number | null>(null);

const nodeIcons: Record<string, string> = {
  start: '🔨', end: '✅', llm: '🧠', code: '💻',
  condition: '🔢', approval: '💼', http: '📎',
  variable: '⚙️', loop: '🔁', subflow: '📚',
  message: '📧', database: '💾',
};

async function loadData() {
  loading.value = true;
  try {
    const res = await workflowInstanceApi.my(query);
    list.value = res.list;
    total.value = res.total;
  } catch {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
}

async function reloadDetail() {
  const instanceId = currentInstance.value?.id;
  if (!instanceId) return;
  try {
    const [instance, instanceLogs, instanceTasks] = await Promise.all([
      workflowInstanceApi.get(instanceId),
      workflowInstanceApi.logs(instanceId),
      workflowTaskApi.instance(instanceId),
    ]);
    currentInstance.value = instance;
    logs.value = instanceLogs;
    tasks.value = instanceTasks;
  } catch {
    ElMessage.error('刷新详情失败');
  }
}

async function openDetail(row: WorkflowApi.WfInstance) {
  currentInstance.value = row;
  logDrawerVisible.value = true;
  await reloadDetail();
}

function openLogs(row: WorkflowApi.WfInstance) {
  openDetail(row);
}

async function handleApprove(task: WorkflowApi.WfTask, approved: boolean) {
  const instanceId = currentInstance.value?.id;
  if (!instanceId) return;

  try {
    const { value } = await ElMessageBox.prompt(
      approved ? '请输入审批意见（可为空）' : '请输入驳回原因（可为空）',
      approved ? '审批通过' : '审批驳回',
      {
        inputPlaceholder: approved ? '同意，继续流转' : '请填写驳回原因',
        confirmButtonText: approved ? '确认通过' : '确认驳回',
        cancelButtonText: '取消',
      },
    );

    submittingTaskId.value = task.id;
    await workflowTaskApi.approve({
      instanceId,
      taskId: task.id,
      approved,
      opinion: value || '',
    });

    ElMessage.success(approved ? '审批已通过' : '审批已驳回');
    await Promise.all([loadData(), reloadDetail()]);
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '审批失败');
    }
  } finally {
    submittingTaskId.value = null;
  }
}

function statusLabel(v?: number) {
  return { 0: '运行中', 1: '成功', 2: '失败', 3: '暂停' }[v ?? 0] || '未知';
}
function statusTagType(v?: number) {
  return { 0: 'primary', 1: 'success', 2: 'danger', 3: 'warning' }[v ?? 0] || 'info';
}
function taskStatusLabel(v?: number) {
  return { 0: '待审批', 1: '已通过', 2: '已转交', 3: '已驳回' }[v ?? 0] || '未知';
}
function taskStatusTagType(v?: number) {
  return { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }[v ?? 0] || 'info';
}
function logStatusLabel(v?: number) {
  return { 0: '等待', 1: '运行中', 2: '成功', 3: '失败' }[v ?? 0] || '';
}
function logStatusColor(v?: number) {
  return { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger' }[v ?? 0] || 'info';
}
function nodeIcon(type?: string) {
  return nodeIcons[type || ''] || '●';
}
function formatJson(str?: string) {
  if (!str) return '-';
  try {
    return JSON.stringify(JSON.parse(str), null, 2).slice(0, 200);
  } catch {
    return str;
  }
}

onMounted(loadData);
</script>

<style scoped>
.log-card { padding: 8px 12px; }
.node-icon-sm { font-size: 14px; }
.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
