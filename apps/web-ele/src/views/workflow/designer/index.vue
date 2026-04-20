<template>
  <div class="wf-designer h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="wf-designer__toolbar">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium">Coze 工作流设计器</span>
        <el-tag v-if="!isSaved" type="warning" size="small">未保存</el-tag>
        <el-tag v-if="isEdit && definition?.status === 1" type="success" size="small">已发布</el-tag>
      </div>
      <div class="flex gap-2">
        <el-button size="small" @click="handleReset">重置画布</el-button>
        <el-button size="small" @click="handlePreview">预览配置</el-button>
        <el-button type="primary" size="small" :loading="saveLoading" @click="handleSave">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
        <el-button
          v-if="isEdit && definition?.status === 0"
          type="success"
          size="small"
          @click="handlePublish"
        >
          发布
        </el-button>
        <el-button
          v-if="isEdit && definition?.status === 1"
          type="warning"
          size="small"
          @click="handleDisable"
        >
          禁用
        </el-button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧：节点面板 -->
      <div class="wf-designer__palette">
        <div class="palette-title">节点组件</div>

        <div
          v-for="group in nodeGroups"
          :key="group.label"
          class="palette-group"
        >
          <div class="palette-group-label">{{ group.label }}</div>
          <div
            v-for="item in group.items"
            :key="item.type"
            class="palette-node"
            :class="`palette-node--${item.type}`"
            draggable="true"
            @dragstart="onPaletteDragStart($event, item.type)"
          >
            <span class="palette-node__icon">{{ item.icon }}</span>
            <div>
              <div class="palette-node__name">{{ item.name }}</div>
              <div class="palette-node__desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：画布 -->
      <div
        class="wf-designer__canvas"
        ref="canvasContainerRef"
        @drop="onCanvasDrop"
        @dragover.prevent
      >
        <WorkflowCanvas
          :nodes="nodes"
          :edges="edges"
          v-model:selected-node="selectedNode"
          v-model:selected-edge="selectedEdge"
          @node:mouseDown="onNodeMouseDown"
        />

        <!-- 空白提示 -->
        <div v-if="nodes.length === 0" class="canvas-empty">
          <div class="text-4xl mb-3">\ud83d\udd28</div>
          <p>从左侧拖拽节点到画布</p>
          <p class="text-xs text-gray-400 mt-1">或双击画布快速添加</p>
        </div>
      </div>

      <!-- 右侧：配置面板 -->
      <WorkflowSetter
        :node="selectedNode"
        v-model:node="selectedNode"
        @update="isSaved = false"
        @delete="handleDeleteNode"
      />
    </div>

    <!-- 保存弹窗 -->
    <el-dialog v-model="saveDialogVisible" :title="isEdit ? '更新工作流' : '创建工作流'" width="500px" destroy-on-close>
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveRules" label-width="100">
        <el-form-item label="工作流名称" prop="name">
          <el-input v-model="saveForm.name" placeholder="如：请假审批流" />
        </el-form-item>
        <el-form-item label="工作流编码" prop="code">
          <el-input v-model="saveForm.code" placeholder="英文编码，如 leave-flow" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="saveForm.description" type="textarea" :rows="3" placeholder="流程说明（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="confirmSave">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="工作流配置预览" width="700px">
      <pre class="config-preview">{{ JSON.stringify({ nodes, edges }, null, 2) }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="WorkflowDesignerPage">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import WorkflowCanvas from './WorkflowCanvas.vue';
import WorkflowSetter from './WorkflowSetter.vue';
import { workflowDefinitionApi } from '#/api/modules/workflow';

definePage({ meta: { title: '工作流设计器', icon: 'lucide:git-branch' } });

const props = defineProps<{ id?: string }>();

// ==================== 状态 ====================
const definition = ref<any>(null);
const isEdit = computed(() => !!props.id);
const isSaved = ref(true);
const saveDialogVisible = ref(false);
const previewVisible = ref(false);
const saveLoading = ref(false);
const saveFormRef = ref();

const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);
const selectedNode = ref<any>(null);
const selectedEdge = ref<any>(null);

const saveForm = reactive({
  name: '',
  code: '',
  description: '',
});

const saveRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9-]*$/, message: '小写英文、数字、连字符', trigger: 'blur' },
  ],
};

// ==================== 节点面板 ====================
const nodeGroups = [
  {
    label: '基础节点',
    items: [
      { type: 'start', name: '开始', icon: '\ud83d\udd28', desc: '流程入口' },
      { type: 'end', name: '结束', icon: '\u2705', desc: '流程终点' },
    ],
  },
  {
    label: '逻辑节点',
    items: [
      { type: 'condition', name: '条件分支', icon: '\ud83d\udd22', desc: '按条件分流' },
      { type: 'loop', name: '循环', icon: '\ud83d\udd01', desc: 'for/while 循环' },
      { type: 'variable', name: '变量', icon: '\u2699\ufe0f', desc: '读取/设置变量' },
    ],
  },
  {
    label: 'AI 节点',
    items: [
      { type: 'llm', name: '大模型', icon: '\ud83e\udde0', desc: '调用 AI 模型' },
      { type: 'code', name: '代码', icon: '\ud83d\udcbb', desc: '执行脚本' },
    ],
  },
  {
    label: '业务节点',
    items: [
      { type: 'approval', name: '审批', icon: '\ud83d\udcbc', desc: '人工审批' },
      { type: 'http', name: 'HTTP', icon: '\ud83d\udcce', desc: '发送请求' },
      { type: 'message', name: '消息', icon: '\ud83d\udce7', desc: '发送通知' },
      { type: 'database', name: '数据库', icon: '\ud83d\udcbe', desc: '执行 SQL' },
      { type: 'subflow', name: '子流程', icon: '\ud83d\udcda', desc: '调用子流程' },
    ],
  },
];

// ==================== 拖拽添加节点 ====================
let dragNodeType = '';
const canvasContainerRef = ref();

function onPaletteDragStart(event: DragEvent, nodeType: string) {
  dragNodeType = nodeType;
  event.dataTransfer?.setData('nodeType', nodeType);
}

function onCanvasDrop(event: DragEvent) {
  event.preventDefault();
  if (!dragNodeType) return;

  const rect = canvasContainerRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left + canvasContainerRef.value.scrollLeft;
  const y = event.clientY - rect.top + canvasContainerRef.value.scrollTop;

  const newNode = createNode(dragNodeType, x, y);
  nodes.value.push(newNode);
  selectedNode.value = newNode;
  isSaved.value = false;
  dragNodeType = '';
}

function createNode(type: string, x: number, y: number) {
  const id = `node_${type}_${Date.now()}`;
  const nameMap: Record<string, string> = {
    start: '开始', end: '结束', llm: '大模型', code: '代码',
    condition: '条件分支', approval: '审批', http: 'HTTP请求',
    variable: '变量', loop: '循环', subflow: '子流程',
    message: '消息', database: '数据库',
  };

  return {
    id,
    type,
    position: { x: x - 75, y: y - 30 },
    data: {
      name: nameMap[type] || type,
      // 默认配置
      ...getDefaultNodeData(type),
    },
  };
}

function getDefaultNodeData(type: string): any {
  switch (type) {
    case 'llm': return { model: 'MiniMax-M*', prompt: '', systemPrompt: '' };
    case 'code': return { language: 'javascript', code: '// 使用 input.xxx 读取输入\n_output.result = input.value;' };
    case 'condition': return { branches: [], defaultBranch: { targetNodeId: '' } };
    case 'approval': return { assigneeType: 1, assigneeExpr: '', titleTemplate: '', contentTemplate: '' };
    case 'http': return { method: 'GET', url: '', headers: {}, body: {} };
    case 'variable': return { variableType: 'String', variableName: '', variableValue: '' };
    case 'loop': return { loopType: 'for', loopTimes: 3, maxLoopTimes: 100 };
    case 'message': return { channel: 'weixin', toUser: '', title: '', content: '' };
    case 'database': return { isSelect: true, sql: '' };
    case 'subflow': return { subflowCode: '' };
    default: return {};
  }
}

// ==================== 节点拖拽移动 ====================
function onNodeMouseDown(event: MouseEvent, node: any) {
  const startX = event.clientX;
  const startY = event.clientY;
  const origX = node.position.x;
  const origY = node.position.y;

  function onMove(e: MouseEvent) {
    node.position.x = origX + (e.clientX - startX);
    node.position.y = origY + (e.clientY - startY);
    isSaved.value = false;
  }

  function onUp() {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// ==================== 删除节点 ====================
async function handleDeleteNode(nodeId: string) {
  await ElMessageBox.confirm('删除该节点？相关连线也会删除', '提示', { type: 'warning' });
  nodes.value = nodes.value.filter(n => n.id !== nodeId);
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId);
  selectedNode.value = null;
  isSaved.value = false;
}

// ==================== 重置 ====================
async function handleReset() {
  await ElMessageBox.confirm('清空画布？', '提示', { type: 'warning' });
  nodes.value = [];
  edges.value = [];
  selectedNode.value = null;
  selectedEdge.value = null;
  isSaved.value = false;
}

function handlePreview() {
  previewVisible.value = true;
}

// ==================== 保存 ====================
function handleSave() {
  if (!saveForm.name) {
    saveDialogVisible.value = true;
    return;
  }
  saveDialogVisible.value = true;
}

async function confirmSave() {
  saveLoading.value = true;
  try {
    const data = {
      id: isEdit.value ? Number(props.id) : undefined,
      name: saveForm.name,
      code: saveForm.code,
      description: saveForm.description,
      graphData: { nodes: nodes.value, edges: edges.value },
    };
    const id = await workflowDefinitionApi.save(data);
    if (!isEdit.value) {
      // 跳转到编辑页
      history.replaceState(null, '', `/workflow/designer/${id}`);
    }
    ElMessage.success('保存成功');
    saveDialogVisible.value = false;
    isSaved.value = true;
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saveLoading.value = false;
  }
}

async function handlePublish() {
  await ElMessageBox.confirm('发布后即可使用，确定发布？', '提示', { type: 'info' });
  try {
    await workflowDefinitionApi.publish(Number(props.id));
    definition.value.status = 1;
    ElMessage.success('发布成功');
  } catch {
    ElMessage.error('发布失败');
  }
}

async function handleDisable() {
  try {
    await workflowDefinitionApi.disable(Number(props.id));
    definition.value.status = 2;
    ElMessage.success('已禁用');
  } catch {
    ElMessage.error('操作失败');
  }
}

// ==================== 初始化 ====================
onMounted(async () => {
  if (isEdit.value) {
    try {
      const def = await workflowDefinitionApi.get(Number(props.id));
      definition.value = def;
      nodes.value = def.graphData?.nodes || [];
      edges.value = def.graphData?.edges || [];
      Object.assign(saveForm, {
        name: def.name,
        code: def.code,
        description: def.description || '',
      });
      isSaved.value = true;
    } catch {
      ElMessage.error('加载失败');
    }
  }
});
</script>

<style scoped>
.wf-designer__toolbar {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.wf-designer__palette {
  width: 200px;
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-light);
  overflow-y: auto;
  flex-shrink: 0;
}

.palette-title {
  padding: 12px 16px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.palette-group {
  margin-bottom: 8px;
}

.palette-group-label {
  font-size: 10px;
  color: #aaa;
  padding: 4px 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.palette-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 2px 8px;
  border-radius: 6px;
  cursor: grab;
  border: 1px solid transparent;
  background: var(--el-bg-color);
  transition: all 0.15s;
  border-left: 3px solid transparent;
}

.palette-node:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.palette-node--start    { border-left-color: #52c41a; }
.palette-node--end      { border-left-color: #ff4d4f; }
.palette-node--llm      { border-left-color: #722ed1; }
.palette-node--code     { border-left-color: #1890ff; }
.palette-node--condition { border-left-color: #fa8c16; }
.palette-node--approval { border-left-color: #eb2f96; }
.palette-node--http     { border-left-color: #13c2c2; }
.palette-node--variable { border-left-color: #8c8c8c; }
.palette-node--loop     { border-left-color: #faad14; }
.palette-node--subflow  { border-left-color: #2f54eb; }
.palette-node--message  { border-left-color: #52a7d7; }
.palette-node--database { border-left-color: #a0d911; }

.palette-node__icon { font-size: 18px; }
.palette-node__name { font-size: 12px; font-weight: 500; }
.palette-node__desc { font-size: 10px; color: var(--el-text-color-secondary); }

.wf-designer__canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-empty {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--el-text-color-secondary);
  pointer-events: none;
}

.config-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 500px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
