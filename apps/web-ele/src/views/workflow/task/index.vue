<template>
  <div class="p-4">
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-medium">待我审批</span>
          <el-button size="small" @click="loadData">
            <icon-refresh /> 刷新
          </el-button>
        </div>
      </template>

      <div class="mb-4 flex gap-3 items-center flex-wrap">
        <el-select v-model="query.status" placeholder="审批状态" clearable size="small" style="width: 160px">
          <el-option label="待审批" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已转交" :value="2" />
          <el-option label="已驳回" :value="3" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="标题 / 节点 / 流程编码"
          size="small"
          clearable
          style="width: 260px"
          @keyup.enter="handleQuery"
        />
        <el-button type="primary" size="small" @click="handleQuery">
          <icon-search /> 搜索
        </el-button>
        <el-button size="small" @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="definitionCode" label="流程编码" width="160" />
        <el-table-column prop="nodeName" label="审批节点" width="140" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="assigneeName" label="审批人" width="120">
          <template #default="{ row }">
            {{ row.assigneeName || row.assigneeExpr || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="taskStatusTagType(row.status)">
              {{ taskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="170" />
        <el-table-column prop="operatedAt" label="处理时间" width="170">
          <template #default="{ row }">
            {{ row.operatedAt || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
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

    <el-drawer v-model="detailVisible" title="审批任务详情" size="56%">
      <div v-if="currentTask">
        <el-descriptions :column="2" border size="small" class="mb-4">
          <el-descriptions-item label="流程编码">{{ currentTask.definitionCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实例ID">{{ currentTask.instanceId }}</el-descriptions-item>
          <el-descriptions-item label="审批节点">{{ currentTask.nodeName }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag size="small" :type="taskStatusTagType(currentTask.status)">
              {{ taskStatusLabel(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批人">
            {{ currentTask.assigneeName || currentTask.assigneeExpr || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="处理人">
            {{ currentTask.operatorName || currentTask.operatorId || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTask.createdTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ currentTask.operatedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentTask.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批内容" :span="2">
            <div class="whitespace-pre-wrap">{{ currentTask.content || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="审批意见" :span="2">
            <div class="whitespace-pre-wrap">{{ currentTask.opinion || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="mb-4 flex gap-2" v-if="currentTask.status === 0">
          <el-button type="success" :loading="submittingTaskId === currentTask.id" @click="handleApprove(currentTask, true)">
            审批通过
          </el-button>
          <el-button type="danger" :loading="submittingTaskId === currentTask.id" @click="handleApprove(currentTask, false)">
            审批驳回
          </el-button>
        </div>

        <el-card shadow="never" class="mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">实例信息</span>
              <el-button text size="small" @click="reloadDetail">刷新详情</el-button>
            </div>
          </template>
          <el-descriptions v-if="instanceDetail" :column="2" border size="small">
            <el-descriptions-item label="实例状态">
              <el-tag :type="instanceStatusTagType(instanceDetail.status)" size="small">
                {{ instanceStatusLabel(instanceDetail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ instanceDetail.currentNodeId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ instanceDetail.startedAt }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ instanceDetail.finishedAt || '-' }}</el-descriptions-item>
            <el-descriptions-item label="错误信息" :span="2">
              {{ instanceDetail.errorMsg || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="mb-4">
          <template #header>
            <span class="font-medium">同实例审批任务</span>
          </template>
          <el-empty v-if="!relatedTasks.length" description="暂无同实例任务" :image-size="70" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="task in relatedTasks"
              :key="task.id"
              :timestamp="task.operatedAt || task.createdTime || '-'"
              placement="top"
              :type="timelineColor(task.status)"
            >
              <el-card shadow="never">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ task.nodeName }} · {{ task.title || '-' }}</div>
                    <div class="text-xs text-gray-500 mt-1">
                      审批人：{{ task.assigneeName || task.assigneeExpr || '-' }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      意见：{{ task.opinion || '-' }}
                    </div>
                  </div>
                  <el-tag size="small" :type="taskStatusTagType(task.status)">
                    {{ taskStatusLabel(task.status) }}
                  </el-tag>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <span class="font-medium">实例执行日志</span>
          </template>
          <el-empty v-if="!logs.length" description="暂无执行日志" :image-size="70" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="log in logs"
              :key="log.id"
              :timestamp="`${log.startedAt} (${log.elapsedMs || 0}ms)`"
              placement="top"
              :type="logStatusColor(log.status)"
            >
              <el-card shadow="never">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ log.nodeName }}</div>
                    <div class="text-xs text-gray-500 mt-1">{{ log.nodeType }}</div>
                    <div class="text-xs text-red-500 mt-1" v-if="log.errorMsg">{{ log.errorMsg }}</div>
                  </div>
                  <el-tag size="small" :type="logStatusColor(log.status)">
                    {{ logStatusLabel(log.status) }}
                  </el-tag>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="WorkflowMyTaskPage">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { WorkflowApi } from '#/api/modules/workflow';
import { workflowInstanceApi, workflowTaskApi } from '#/api/modules/workflow';

definePage({ meta: { title: '待我审批', icon: 'lucide:clipboard-check' } });

const loading = ref(false);
const total = ref(0);
const list = ref<WorkflowApi.WfTask[]>([]);
const submittingTaskId = ref<number | null>(null);

const query = reactive({
  page: 1,
  pageSize: 10,
  status: 0 as number | undefined,
  keyword: '',
});

const detailVisible = ref(false);
const currentTask = ref<WorkflowApi.WfTask | null>(null);
const instanceDetail = ref<WorkflowApi.WfInstance | null>(null);
const relatedTasks = ref<WorkflowApi.WfTask[]>([]);
const logs = ref<WorkflowApi.WfInstanceLog[]>([]);

async function loadData() {
  loading.value = true;
  try {
    const res = await workflowTaskApi.my({
      pageNum: query.page,
      pageSize: query.pageSize,
      status: query.status,
      keyword: query.keyword || undefined,
    });
    list.value = res.list || [];
    total.value = res.total;
  } catch {
    ElMessage.error('加载审批任务失败');
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  query.page = 1;
  loadData();
}

function resetQuery() {
  query.page = 1;
  query.pageSize = 10;
  query.status = undefined;
  query.keyword = '';
  loadData();
}

async function reloadDetail() {
  const task = currentTask.value;
  if (!task?.instanceId) return;
  try {
    const [instance, taskList, logList] = await Promise.all([
      workflowInstanceApi.get(task.instanceId),
      workflowTaskApi.instance(task.instanceId),
      workflowInstanceApi.logs(task.instanceId),
    ]);
    instanceDetail.value = instance;
    relatedTasks.value = taskList;
    logs.value = logList;
    const latest = taskList.find((item) => item.id === task.id);
    if (latest) currentTask.value = latest;
  } catch {
    ElMessage.error('加载审批详情失败');
  }
}

async function openDetail(task: WorkflowApi.WfTask) {
  currentTask.value = task;
  detailVisible.value = true;
  await reloadDetail();
}

async function handleApprove(task: WorkflowApi.WfTask, approved: boolean) {
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
      instanceId: task.instanceId,
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

function taskStatusLabel(v?: number) {
  return { 0: '待审批', 1: '已通过', 2: '已转交', 3: '已驳回' }[v ?? 0] || '未知';
}
function taskStatusTagType(v?: number) {
  return { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }[v ?? 0] || 'info';
}
function instanceStatusLabel(v?: number) {
  return { 0: '运行中', 1: '成功', 2: '失败', 3: '暂停' }[v ?? 0] || '未知';
}
function instanceStatusTagType(v?: number) {
  return { 0: 'primary', 1: 'success', 2: 'danger', 3: 'warning' }[v ?? 0] || 'info';
}
function logStatusLabel(v?: number) {
  return { 0: '等待', 1: '运行中', 2: '成功', 3: '失败' }[v ?? 0] || '未知';
}
function logStatusColor(v?: number) {
  return { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger' }[v ?? 0] || 'info';
}
function timelineColor(v?: number) {
  return taskStatusTagType(v);
}

onMounted(loadData);
</script>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
