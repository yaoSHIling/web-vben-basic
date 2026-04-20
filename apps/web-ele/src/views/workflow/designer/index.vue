<template>
  <div class="h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="designer-toolbar">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium">工作流设计器</span>
        <el-tag v-if="!isSaved" type="warning" size="small">未保存</el-tag>
      </div>
      <div class="flex gap-2">
        <el-button size="small" @click="handleReset">重置</el-button>
        <el-button size="small" @click="handlePreview">预览配置</el-button>
        <el-button type="primary" size="small" @click="handleSave">保存</el-button>
        <el-button
          v-if="isEdit && definition.status === 0"
          type="success"
          size="small"
          @click="handlePublish"
        >
          发布
        </el-button>
      </div>
    </div>

    <!-- 设计器主体 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧：节点工具栏 -->
      <div class="node-palette">
        <div class="palette-title">节点组件</div>
        <div
          v-for="node in nodeTypes"
          :key="node.type"
          class="palette-node"
          draggable="true"
          @dragstart="onDragStart($event, node)"
        >
          <span class="node-icon">{{ node.icon }}</span>
          <span>{{ node.label }}</span>
        </div>

        <div class="palette-divider"></div>
        <div class="palette-title">快捷操作</div>
        <el-button size="small" class="w-full mb-2" @click="handleAutoLayout">
          <icon-apps /> 自动排列
        </el-button>
        <el-button size="small" class="w-full" @click="handleZoomReset">
          <icon-zoom-out /> 适应画布
        </el-button>
      </div>

      <!-- 中间：画布 -->
      <div ref="canvasRef" class="designer-canvas">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :nodes-draggable="true"
          :nodes-connectable="true"
          :zoom-on-scroll="true"
          :mini-map="true"
          fit-view-on-init
          @node-click="handleNodeClick"
          @edge-click="handleEdgeClick"
          @connect="handleConnect"
        >
          <!-- 自定义节点：开始节点 -->
          <template #node-start="{ id }">
            <div class="wf-node wf-node-start">
              <div class="wf-node-icon">\ud83d\udd28</div>
              <div class="wf-node-name">发起人</div>
            </div>
          </template>

          <!-- 自定义节点：审批节点 -->
          <template #node-approver="{ id }">
            <div class="wf-node wf-node-approver">
              <div class="wf-node-icon">\u2714\ufe0f</div>
              <div class="wf-node-name">{{ getNodeName(id) }}</div>
              <div class="wf-node-badge">审批</div>
            </div>
          </template>

          <!-- 自定义节点：条件节点 -->
          <template #node-condition="{ id }">
            <div class="wf-node wf-node-condition">
              <div class="wf-node-icon">\u003f</div>
              <div class="wf-node-name">{{ getNodeName(id) }}</div>
              <div class="wf-node-badge">条件</div>
            </div>
          </template>

          <!-- 自定义节点：结束节点 -->
          <template #node-end="{ id }">
            <div class="wf-node wf-node-end">
              <div class="wf-node-icon">\u2705</div>
              <div class="wf-node-name">流程结束</div>
            </div>
          </template>
        </VueFlow>
      </div>

      <!-- 右侧：属性配置面板 -->
      <div v-if="selectedNode || selectedEdge" class="config-panel">
        <div class="config-title">
          {{ selectedNode ? '节点配置' : '连线配置' }}
          <el-button link class="fr" @click="selectedNode = null; selectedEdge = null">
            <icon-x />
          </el-button>
        </div>

        <!-- 节点配置 -->
        <div v-if="selectedNode" class="config-body">
          <el-form label-width="90" size="small">
            <el-form-item label="节点ID">
              <el-input v-model="selectedNode.id" disabled />
            </el-form-item>
            <el-form-item label="节点名称" required>
              <el-input v-model="selectedNode.data.name" placeholder="如：部门主管审批" />
            </el-form-item>

            <!-- 审批节点专属配置 -->
            <template v-if="selectedNode.type === 'approver'">
              <el-divider content-position="left">审批人配置</el-divider>
              <el-form-item label="审批人类型">
                <el-select v-model="selectedNode.data.assigneeType">
                  <el-option :value="1" label="指定人员" />
                  <el-option :value="2" label="角色" />
                  <el-option :value="3" label="发起人自选" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="selectedNode.data.assigneeType === 1" label="指定人员">
                <el-input
                  v-model="selectedNode.data.assigneeExpr"
                  placeholder="格式：user:123"
                />
              </el-form-item>
              <el-form-item v-if="selectedNode.data.assigneeType === 2" label="角色">
                <el-input
                  v-model="selectedNode.data.assigneeExpr"
                  placeholder="格式：role:manager"
                />
              </el-form-item>
              <el-form-item v-if="selectedNode.data.assigneeType === 3" label="说明">
                <span class="text-xs text-gray-400">
                  发起人提交时可自选审批人
                </span>
              </el-form-item>
              <el-form-item label="审批顺序">
                <el-input-number
                  v-model="selectedNode.data.sequence"
                  :min="1"
                  :max="10"
                />
              </el-form-item>
            </template>

            <!-- 条件节点专属配置 -->
            <template v-if="selectedNode.type === 'condition'">
              <el-divider content-position="left">分支条件</el-divider>
              <div
                v-for="(cond, idx) in (selectedNode.data.conditions || [])"
                :key="idx"
                class="condition-item"
              >
                <el-input
                  v-model="cond.label"
                  placeholder="条件名称"
                  class="mb-1"
                />
                <el-input
                  v-model="cond.expr"
                  placeholder="表达式，如：amount > 1000"
                  class="mb-1"
                />
                <el-input
                  v-model="cond.targetNodeId"
                  placeholder="满足条件时流向的节点ID"
                />
              </div>
              <el-button
                size="small"
                class="mt-2"
                @click="addCondition(selectedNode)"
              >
                + 添加条件分支
              </el-button>
              <el-form-item label="默认分支" class="mt-2">
                <el-input
                  v-model="selectedNode.data.defaultNodeId"
                  placeholder="条件都不满足时，流向的节点ID"
                />
              </el-form-item>
            </template>

            <!-- 删除节点 -->
            <el-form-item class="mt-4">
              <el-button
                type="danger"
                size="small"
                plain
                @click="handleDeleteNode(selectedNode.id)"
              >
                删除节点
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 连线配置 -->
        <div v-if="selectedEdge" class="config-body">
          <el-form label-width="80" size="small">
            <el-form-item label="从">
              <span class="text-sm">{{ selectedEdge.source }}</span>
            </el-form-item>
            <el-form-item label="到">
              <span class="text-sm">{{ selectedEdge.target }}</span>
            </el-form-item>
            <el-form-item label="条件">
              <el-input
                v-model="selectedEdge.conditionExpr"
                placeholder="条件表达式（条件节点后的连线）"
              />
            </el-form-item>
            <el-form-item label="标签">
              <el-input
                v-model="selectedEdge.label"
                placeholder="连线显示标签"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 右侧：空状态 -->
      <div v-else class="config-panel config-panel--empty">
        <div class="text-gray-400 text-sm">
          <p>\ud83d\udca1 点击节点或连线</p>
          <p>查看/编辑配置</p>
        </div>
        <el-divider />
        <div class="text-xs text-gray-400">
          <p>\ud83d\udcda 支持的节点类型：</p>
          <ul class="list-disc ml-4 mt-2">
            <li><b>发起人</b>：流程起点</li>
            <li><b>审批人</b>：指定审批人审批</li>
            <li><b>条件分支</b>：按条件分流</li>
            <li><b>流程结束</b>：流程终点</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="流程配置预览" width="600px">
      <pre class="config-preview">{{ JSON.stringify({ nodes, edges }, null, 2) }}</pre>
    </el-dialog>

    <!-- 保存弹窗 -->
    <el-dialog v-model="saveDialogVisible" title="保存工作流" width="500px" destroy-on-close>
      <el-form ref="saveFormRef" :model="saveForm" label-width="100">
        <el-form-item label="工作流名称" prop="name" required>
          <el-input v-model="saveForm.name" placeholder="如：请假审批流程" />
        </el-form-item>
        <el-form-item label="工作流编码" prop="code" required>
          <el-input
            v-model="saveForm.code"
            placeholder="英文编码，如：leave-flow"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="关联表单">
          <el-select v-model="saveForm.formCode" placeholder="选择关联表单（可选）" clearable>
            <el-option label="请假申请" value="leave" />
            <el-option label="报销申请" value="reimburse" />
            <el-option label="采购申请" value="purchase" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="saveForm.description" type="textarea" :rows="3" placeholder="流程说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSaveConfirm">
          确定保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="WorkflowDesigner">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import {
  saveDefinitionApi,
  publishDefinitionApi,
  getDefinitionApi,
} from '#/api/modules/workflow';

definePage({ meta: { title: '工作流设计器', icon: 'lucide:git-branch' } });

const props = defineProps<{ id?: string }>();

// ===== 节点类型定义 =====
const nodeTypes = [
  { type: 'start', label: '发起人', icon: '\ud83d\udd28' },
  { type: 'approver', label: '审批人', icon: '\u2714\ufe0f' },
  { type: 'condition', label: '条件分支', icon: '\u003f' },
  { type: 'end', label: '流程结束', icon: '\u2705' },
];

// ===== Vue Flow =====
const canvasRef = ref();
const { onConnect, addNodes, addEdges, fitView, zoomTo } = useVueFlow();

// ===== 画布数据 =====
const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);
const selectedNode = ref<any>(null);
const selectedEdge = ref<any>(null);
const isSaved = ref(true);

// ===== 状态 =====
const definition = ref<any>({ status: 0 });
const isEdit = computed(() => !!props.id);
const previewVisible = ref(false);
const saveDialogVisible = ref(false);
const submitLoading = ref(false);
const saveFormRef = ref();

const saveForm = reactive({
  name: '',
  code: '',
  description: '',
  formCode: '',
});

// ===== 初始化 =====
onMounted(async () => {
  if (props.id) {
    try {
      const def = await getDefinitionApi(Number(props.id));
      definition.value = def;
      const config = def.config || { nodes: [], edges: [] };

      nodes.value = (config.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.x || 100, y: n.y || 100 },
        data: n.data,
      }));

      edges.value = (config.edges || []).map((e: any) => ({
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        label: e.label,
        conditionExpr: e.conditionExpr,
      }));

      Object.assign(saveForm, {
        name: def.name,
        code: def.code,
        description: def.description || '',
        formCode: def.formCode || '',
      });
    } catch {
      ElMessage.error('加载工作流失败');
    }
  } else {
    // 新建：初始化 start 和 end 节点
    addInitialNodes();
  }
});

function addInitialNodes() {
  nodes.value = [
    {
      id: 'node_start',
      type: 'start',
      position: { x: 250, y: 50 },
      data: { name: '发起人' },
    },
    {
      id: 'node_end',
      type: 'end',
      position: { x: 250, y: 400 },
      data: { name: '流程结束' },
    },
  ];
  edges.value = [];
}

// ===== 拖拽 =====
let dragNodeType = '';
function onDragStart(event: DragEvent, node: any) {
  dragNodeType = node.type;
  event.dataTransfer?.setData('nodeType', node.type);
}

onConnect((params: any) => {
  const sourceNode = nodes.value.find(n => n.id === params.source);
  // 审批节点后不能直接连 end，要先连其他审批节点或条件节点
  if (sourceNode?.type === 'approver' && params.target === 'node_end') {
    ElMessage.warning('审批节点后不能直接结束，请插入其他节点');
    return;
  }
  edges.value.push({
    id: `${params.source}-${params.target}`,
    source: params.source,
    target: params.target,
  });
  isSaved.value = false;
});

// ===== 点击节点/连线 =====
function handleNodeClick(event: any) {
  selectedNode.value = event.node;
  selectedEdge.value = null;
}

function handleEdgeClick(event: any) {
  selectedEdge.value = event.edge;
  selectedNode.value = null;
}

// ===== 工具函数 =====
function getNodeName(id: string) {
  const node = nodes.value.find(n => n.id === id);
  return node?.data?.name || id;
}

function handleDeleteNode(nodeId: string) {
  ElMessageBox.confirm('删除该节点？', '提示', { type: 'warning' }).then(() => {
    nodes.value = nodes.value.filter(n => n.id !== nodeId);
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId);
    selectedNode.value = null;
    isSaved.value = false;
  });
}

function addCondition(node: any) {
  if (!node.data.conditions) node.data.conditions = [];
  node.data.conditions.push({ expr: '', targetNodeId: '', label: '' });
  isSaved.value = true;
}

function handleAutoLayout() {
  // 简单垂直布局
  let y = 50;
  nodes.value.forEach((n, i) => {
    n.position = { x: 250 + (i % 2) * 150, y };
    y += 100;
  });
  fitView();
  isSaved.value = false;
}

function handleZoomReset() {
  fitView();
}

function handleReset() {
  ElMessageBox.confirm('重置会清空画布，确定？', '提示', { type: 'warning' }).then(() => {
    addInitialNodes();
    isSaved.value = true;
  });
}

function handlePreview() {
  previewVisible.value = true;
}

// ===== 保存/发布 =====
function handleSave() {
  if (!saveForm.name) {
    ElMessage.warning('请先填写工作流名称');
    saveDialogVisible.value = true;
    return;
  }
  saveDialogVisible.value = true;
}

async function handleSaveConfirm() {
  const valid = await saveFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    const config = {
      nodes: nodes.value.map(n => ({
        id: n.id,
        type: n.type,
        x: n.position?.x,
        y: n.position?.y,
        data: n.data,
      })),
      edges: edges.value.map(e => ({
        source: e.source,
        target: e.target,
        label: e.label,
        conditionExpr: e.conditionExpr,
      })),
    };

    await saveDefinitionApi({
      id: isEdit.value ? Number(props.id) : undefined,
      name: saveForm.name,
      code: saveForm.code,
      description: saveForm.description,
      formCode: saveForm.formCode,
      config,
    });

    ElMessage.success('保存成功');
    saveDialogVisible.value = false;
    isSaved.value = true;
  } catch {
    ElMessage.error('保存失败');
  } finally {
    submitLoading.value = false;
  }
}

async function handlePublish() {
  await ElMessageBox.confirm('发布后即可使用，确定发布？', '提示', { type: 'info' });
  try {
    await publishDefinitionApi(Number(props.id));
    ElMessage.success('发布成功');
    definition.value.status = 1;
  } catch {
    ElMessage.error('发布失败');
  }
}
</script>

<style scoped>
.designer-toolbar {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
}

.node-palette {
  width: 160px;
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-light);
  padding: 12px;
  overflow-y: auto;
}

.palette-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.palette-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: grab;
  font-size: 13px;
  background: var(--el-bg-color);
  transition: all 0.2s;
}

.palette-node:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.node-icon { font-size: 16px; }

.palette-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: 12px 0;
}

.designer-canvas {
  flex: 1;
  background: #f8fafc;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.config-panel {
  width: 280px;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
}

.config-panel--empty {
  justify-content: center;
  align-items: center;
  padding: 24px;
  text-align: center;
}

.config-title {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.condition-item {
  padding: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.config-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Vue Flow 节点样式 */
.wf-node {
  padding: 10px 16px;
  border-radius: 8px;
  min-width: 100px;
  text-align: center;
  border: 2px solid transparent;
  cursor: pointer;
}

.wf-node-start {
  background: #dbeafe;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.wf-node-approver {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.wf-node-condition {
  background: #ede9fe;
  border-color: #8b5cf6;
  color: #5b21b6;
}

.wf-node-end {
  background: #d1fae5;
  border-color: #10b981;
  color: #065f46;
}

.wf-node-icon { font-size: 18px; margin-bottom: 4px; }
.wf-node-name { font-size: 13px; font-weight: 500; }
.wf-node-badge {
  font-size: 10px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
  padding: 1px 4px;
  margin-top: 2px;
}
</style>
