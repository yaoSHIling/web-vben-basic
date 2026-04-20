<template>
  <div class="wf-canvas" ref="canvasRef"
    @mousedown="onCanvasMouseDown"
    @mousemove="onCanvasMouseMove"
    @mouseup="onCanvasMouseUp"
    @click.self="selectedNode = null; selectedEdge = null"
    :class="{ 'wf-canvas--connecting': isConnecting, 'wf-canvas--panning': isPanning }"
  >
    <!-- SVG 连线层 -->
    <svg class="wf-canvas__svg" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#adb5bd" />
        </marker>
        <marker id="arrowhead-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#52c41a" />
        </marker>
      </defs>

      <!-- 已有的连线 -->
      <g v-for="edge in edges" :key="edge.id">
        <path
          :d="getEdgePath(edge)"
          fill="none"
          stroke="#adb5bd"
          stroke-width="2"
          :class="{ 'wf-edge--selected': selectedEdge?.id === edge.id }"
          @click.stop="selectedEdge = edge"
          marker-end="url(#arrowhead)"
          class="wf-edge"
        />
        <text
          v-if="edge.data?.label"
          :x="getEdgeMidpoint(edge).x"
          :y="getEdgeMidpoint(edge).y - 8"
          class="wf-edge__label"
        >{{ edge.data.label }}</text>
      </g>

      <!-- 正在连接的线 -->
      <path
        v-if="connecting?.from && mousePos"
        :d="getTempEdgePath(connecting.from, mousePos)"
        fill="none"
        stroke="#1890ff"
        stroke-width="2"
        stroke-dasharray="5,3"
        marker-end="url(#arrowhead)"
      />
    </svg>

    <!-- 节点层 -->
    <div
      v-for="node in nodes"
      :key="node.id"
      class="wf-node"
      :class="[`wf-node--${node.type}`, { 'wf-node--selected': selectedNode?.id === node.id }]"
      :style="{ left: node.position.x + 'px', top: node.position.y + 'px' }"
      @mousedown.stop="onNodeMouseDown($event, node)"
      @click.stop="selectedNode = node; selectedEdge = null"
    >
      <!-- 节点图标 + 名称 -->
      <div class="wf-node__header">
        <span class="wf-node__icon">{{ nodeIcons[node.type] }}</span>
        <span class="wf-node__name">{{ node.data?.name || node.id }}</span>
        <span class="wf-node__type-badge">{{ node.type }}</span>
      </div>

      <!-- 节点预览信息 -->
      <div v-if="getNodePreview(node)" class="wf-node__preview">
        {{ getNodePreview(node) }}
      </div>

      <!-- 连接桩（左右两侧） -->
      <div
        class="wf-node__port wf-node__port--input"
        title="输入"
        @mousedown.stop="onPortMouseDown($event, node, 'in')"
        @mouseup.stop="onPortMouseUp($event, node, 'in')"
      >
        <div class="wf-node__port-dot" />
      </div>
      <div
        class="wf-node__port wf-node__port--output"
        title="输出"
        @mousedown.stop="onPortMouseDown($event, node, 'out')"
        @mouseup.stop="onPortMouseUp($event, node, 'out')"
      >
        <div class="wf-node__port-dot" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="WorkflowCanvas">
import { ref, computed } from 'vue';

interface WfNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface WfEdge {
  id: string;
  source: string;
  target: string;
  data?: { label?: string };
}

const props = defineProps<{
  nodes: WfNode[];
  edges: WfEdge[];
  selectedNode?: WfNode | null;
  selectedEdge?: WfEdge | null;
}>();

const emit = defineEmits<{
  (e: 'update:nodes', val: WfNode[]): void;
  (e: 'update:edges', val: WfEdge[]): void;
  (e: 'update:selectedNode', val: WfNode | null): void;
  (e: 'update:selectedEdge', val: WfEdge | null): void;
  (e: 'node:mouseDown', event: MouseEvent, node: WfNode): void;
}>();

// ===== 画布状态 =====
const canvasRef = ref();
const canvasWidth = ref(4000);
const canvasHeight = ref(3000);

// ===== 节点图标 =====
const nodeIcons: Record<string, string> = {
  start:     '\ud83d\udd28',
  end:       '\u2705',
  llm:       '\ud83e\udde0',
  code:      '\ud83d\udcbb',
  condition: '\ud83d\udd22',
  approval:  '\ud83d\udcbc',
  http:      '\ud83d\udcce',
  variable:  '\u2699\ufe0f',
  loop:      '\ud83d\udd01',
  subflow:   '\ud83d\udcda',
  message:   '\ud83d\udce7',
  database:  '\ud83d\udcbe',
};

// ===== 画布平移 =====
const isPanning = ref(false);
let panStart = { x: 0, y: 0 };

// ===== 连接线 =====
const isConnecting = ref(false);
const connecting = ref<{ from: WfNode; side: 'in' | 'out' } | null>(null);
const mousePos = ref<{ x: number; y: number } | null>(null);

// ===== 计算属性 =====
const selectedNode = computed({
  get: () => props.selectedNode,
  set: (v) => emit('update:selectedNode', v),
});

const selectedEdge = computed({
  get: () => props.selectedEdge,
  set: (v) => emit('update:selectedEdge', v),
});

// ===== 节点拖拽事件 =====
function onNodeMouseDown(e: MouseEvent, node: WfNode) {
  if ((e.target as HTMLElement).closest('.wf-node__port')) return;
  emit('node:mouseDown', e, node);
}

// ===== 端口连接 =====
function onPortMouseDown(e: MouseEvent, node: WfNode, side: 'in' | 'out') {
  e.stopPropagation();
  if (side === 'out') {
    isConnecting.value = true;
    connecting.value = { from: node, side };
    mousePos.value = { x: e.offsetX, y: e.offsetY };
  }
}

function onPortMouseUp(e: MouseEvent, node: WfNode, side: 'in' | 'out') {
  if (isConnecting.value && connecting.value?.side === 'out' && side === 'in') {
    // 创建新连线
    const newEdge: WfEdge = {
      id: `${connecting.value.from.id}->${node.id}`,
      source: connecting.value.from.id,
      target: node.id,
    };
    // 避免重复
    if (!props.edges.find(e => e.source === newEdge.source && e.target === newEdge.target)) {
      emit('update:edges', [...props.edges, newEdge]);
    }
  }
  isConnecting.value = false;
  connecting.value = null;
  mousePos.value = null;
}

function onCanvasMouseDown(e: MouseEvent) {
  if (e.target === canvasRef.value || (e.target as HTMLElement).classList.contains('wf-canvas__svg')) {
    isPanning.value = true;
    panStart = { x: e.clientX, y: e.clientY };
  }
}

function onCanvasMouseMove(e: MouseEvent) {
  mousePos.value = {
    x: e.offsetX + (canvasRef.value?.scrollLeft || 0),
    y: e.offsetY + (canvasRef.value?.scrollTop || 0),
  };
  if (isPanning.value) {
    canvasRef.value!.scrollLeft -= e.clientX - panStart.x;
    canvasRef.value!.scrollTop -= e.clientY - panStart.y;
    panStart = { x: e.clientX, y: e.clientY };
  }
}

function onCanvasMouseUp() {
  isPanning.value = false;
}

// ===== 计算连线路径 =====
function getNodeCenter(node: WfNode) {
  return {
    x: node.position.x + 75, // node width = 150
    y: node.position.y + 30, // node height ~ 60
  };
}

function getEdgePath(edge: WfEdge): string {
  const sourceNode = props.nodes.find(n => n.id === edge.source);
  const targetNode = props.nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return '';

  const s = getNodeCenter(sourceNode);
  const t = getNodeCenter(targetNode);

  // 贝塞尔曲线
  const dx = t.x - s.x;
  const cx1 = s.x + dx / 2;
  const cx2 = t.x - dx / 2;

  return `M ${s.x + 40},${s.y} C ${cx1},${s.y} ${cx2},${t.y} ${t.x - 40},${t.y}`;
}

function getTempEdgePath(from: WfNode, to: { x: number; y: number }): string {
  const s = getNodeCenter(from);
  return `M ${s.x + 40},${s.y} L ${to.x},${to.y}`;
}

function getEdgeMidpoint(edge: WfEdge): { x: number; y: number } {
  const sourceNode = props.nodes.find(n => n.id === edge.source);
  const targetNode = props.nodes.find(n => n.id === edge.target);
  if (!sourceNode || !targetNode) return { x: 0, y: 0 };
  const s = getNodeCenter(sourceNode);
  const t = getNodeCenter(targetNode);
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 };
}

// ===== 节点预览信息 =====
function getNodePreview(node: WfNode): string {
  const d = node.data;
  if (!d) return '';
  switch (node.type) {
    case 'llm': return d.model || d.prompt?.slice(0, 20) || '';
    case 'code': return d.language ? `[${d.language}]` : '';
    case 'condition': return `${(d.branches || []).length} 个分支`;
    case 'approval': return d.assigneeExpr || '';
    case 'http': return `${d.method || 'GET'} ${d.url || ''}`.slice(0, 25);
    case 'message': return `[${d.channel || 'log'}] ${d.title || ''}`;
    case 'variable': return `${d.variableName || ''} = ${d.variableValue ?? ''}`;
    case 'loop': return `${d.loopType || 'for'} x${d.loopTimes || 1}`;
    case 'database': return d.sql?.slice(0, 20) || '';
    case 'subflow': return d.subflowCode || '';
    default: return '';
  }
}
</script>

<style scoped>
.wf-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f5f7fa;
  background-image:
    linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: default;
  user-select: none;
}

.wf-canvas--panning { cursor: grabbing !important; }
.wf-canvas--connecting { cursor: crosshair !important; }

.wf-canvas__svg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  overflow: visible;
}

.wf-edge {
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s;
}
.wf-edge:hover { stroke: #1890ff !important; }
.wf-edge--selected { stroke: #1890ff !important; }

.wf-edge__label {
  font-size: 11px;
  fill: #8c8c8c;
  text-anchor: middle;
  pointer-events: none;
}

/* ===== 节点 ===== */
.wf-node {
  position: absolute;
  width: 150px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: white;
  cursor: move;
  transition: box-shadow 0.2s, border-color 0.2s;
  z-index: 1;
}

.wf-node:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 2; }
.wf-node--selected { border-color: #1890ff !important; z-index: 3; }

.wf-node__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px 6px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.wf-node__icon { font-size: 14px; }
.wf-node__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wf-node__type-badge {
  font-size: 9px;
  background: rgba(255,255,255,0.25);
  border-radius: 4px;
  padding: 1px 4px;
  text-transform: uppercase;
}

.wf-node__preview {
  padding: 4px 10px 6px;
  font-size: 11px;
  color: #595959;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 0 0 6px 6px;
  background: white;
}

/* 节点颜色（按类型） */
.wf-node--start    .wf-node__header { background: #52c41a; }
.wf-node--end      .wf-node__header { background: #ff4d4f; }
.wf-node--llm      .wf-node__header { background: #722ed1; }
.wf-node--code     .wf-node__header { background: #1890ff; }
.wf-node--condition .wf-node__header { background: #fa8c16; }
.wf-node--approval .wf-node__header { background: #eb2f96; }
.wf-node--http     .wf-node__header { background: #13c2c2; }
.wf-node--variable .wf-node__header { background: #8c8c8c; }
.wf-node--loop     .wf-node__header { background: #faad14; }
.wf-node--subflow  .wf-node__header { background: #2f54eb; }
.wf-node--message  .wf-node__header { background: #52a7d7; }
.wf-node--database .wf-node__header { background: #a0d911; }

/* 连接桩 */
.wf-node__port {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  z-index: 10;
}
.wf-node__port--input  { left: -7px; }
.wf-node__port--output { right: -7px; }

.wf-node__port-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
  border: 2px solid #adb5bd;
  transition: all 0.15s;
}
.wf-node__port:hover .wf-node__port-dot {
  border-color: #1890ff;
  background: #1890ff;
  transform: scale(1.3);
}
</style>
