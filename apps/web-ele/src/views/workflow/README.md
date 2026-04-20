# Coze 风格工作流引擎 - 前端

> 基于 Coze 工作流模型重构，拖拽式可视化画布 + **12 种节点类型**。
> 对应后端：[java-backend-basic/workflow 模块](https://github.com/yaoSHIling/java-backend-basic)

---

## 技术方案

### 画布实现

| 组件 | 实现方式 |
|------|---------|
| 节点渲染 | div + CSS（绝对定位）|
| 连接线 | SVG `<path>` 贝塞尔曲线 + 箭头 marker |
| 拖拽移动 | 原生 `mousedown/mousemove/mouseup` |
| 端口连接 | in/out 桩点击拖拽创建连线 |
| 节点面板 | HTML5 Drag & Drop API |
| 配置面板 | Coze 风格 Setter（按节点类型动态渲染）|

### 画布结构

```
┌──────────────────────────────────────────────────┐
│  顶部工具栏（保存/发布/禁用/预览）                 │
├──────────┬─────────────────────────┬──────────────┤
│          │                         │              │
│  节点    │   SVG 连线层 + div      │   节点      │
│  面板    │   节点层（画布区域）     │   配置      │
│  200px   │   flex: 1              │   面板      │
│          │                         │   300px     │
│ start    │  ┌─────────┐            │              │
│ end      │  │ 节点 A  │────→│      │  Setter    │
│ llm      │  └─────────┘            │  (Coze     │
│ code     │       ↓                 │   风格)     │
│ condition│  ┌─────────┐            │              │
│ approval │  │  条件   │            │              │
│ http     │  └─────────┘            │              │
│ message  │                         │              │
│ ...      │                         │              │
└──────────┴─────────────────────────┴──────────────┘
```

---

## 目录结构

```
views/workflow/
├── designer/
│   ├── index.vue              ← 设计器主页（整合面板+画布+setter）
│   ├── WorkflowCanvas.vue     ← 画布组件（SVG连线+div节点）
│   └── WorkflowSetter.vue     ← 节点配置面板（12种节点配置）
└── instance/
    └── index.vue              ← 执行记录 + 日志时间线

api/modules/workflow/
└── index.ts                  ← API层（definition + instance）
```

---

## 节点类型（共 12 种）

### 基础节点

| 节点 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| `start` | 🕐 | 绿色 | 流程入口，定义输入参数 |
| `end` | ✅ | 红色 | 流程终点，返回输出 |

### 逻辑节点

| 节点 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| `condition` | 🔒 | 橙色 | 按条件表达式分流，多分支 |
| `variable` | ⚙️ | 灰色 | 读取/设置全局变量 |
| `loop` | 🔁 | 黄色 | for/while 循环 |

### AI 节点

| 节点 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| `llm` | 🤠 | 紫色 | 调用大模型（MiniMax/GPT/Claude/DeepSeek）|
| `code` | 💻 | 蓝色 | 执行 JavaScript 脚本 |

### 业务节点

| 节点 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| `approval` | 📼 | 粉色 | 人工审批，流程暂停等待 |
| `http` | 📎 | 青色 | 发送 HTTP 请求 |
| `message` | 📧 | 天蓝 | 发送通知（微信/邮件/钉钉等）|
| `database` | 🏾 | 黄绿 | 执行 SQL（查询/增删改）|
| `subflow` | 📚 | 深蓝 | 调用其他工作流 |

---

## 快速使用

### 1. 创建工作流

```
GET /workflow/designer        → 打开设计器
→ 从左侧面板拖拽 start 节点到画布
→ 继续拖拽其他节点
→ 点击节点端口拖拽到另一节点 → 自动创建连线
→ 点击节点 → 右侧配置节点参数
→ 保存 → 发布
```

### 2. 触发工作流

```typescript
// 调用后端 API
const instanceId = await workflowInstanceApi.trigger('leave-flow', {
  name: '张三',
  days: 3,
  reason: '年假旅行',
});
// → 返回 instanceId
```

```bash
POST /api/workflow/trigger/leave-flow
{
  "data": {
    "name": "张三",
    "days": 3,
    "reason": "年假旅行"
  }
}
```

### 3. 查看执行记录

```
GET /workflow/instance
→ 看到执行列表 + 状态（运行中/成功/失败/暂停）
→ 点击行查看节点执行日志时间线（耗时/输入/输出）
```

---

## 节点配置示例

### LLM 节点

```typescript
{
  type: 'llm',
  data: {
    name: '生成报告',
    model: 'MiniMax-M*',
    prompt: '请为 {{ company }} 生成一份{{ type }}报告',
    systemPrompt: '你是一个专业的行业分析师'
  }
}
```

### Condition 节点（多分支）

```typescript
{
  type: 'condition',
  data: {
    name: '金额判断',
    branches: [
      {
        name: '高金额',
        conditionExpr: 'amount > 10000',
        targetNodeId: 'node_approval_2'
      },
      {
        name: '中金额',
        conditionExpr: 'amount > 1000',
        targetNodeId: 'node_approval_1'
      }
    ],
    defaultBranch: { targetNodeId: 'node_end' }
  }
}
```

### Approval 节点

```typescript
{
  type: 'approval',
  data: {
    assigneeType: 2,              // 2=角色
    assigneeExpr: 'role:manager', // role:xxx / user:xxx / ${initiator}
    titleTemplate: '{{ name }} 的请假申请',
    contentTemplate: '请假期：{{ days }}天\n原因：{{ reason }}'
  }
}
```

### HTTP 节点

```typescript
{
  type: 'http',
  data: {
    url: 'https://api.example.com/order',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyStr: '{"orderId": "{{ orderId }}", "amount": {{ amount }}}'
  }
}
```

### Message 节点（多渠道）

```typescript
{
  type: 'message',
  data: {
    channel: 'serverchan',   // weixin / email / dingtalk / webhook / serverchan
    toUser: '',
    title: '审批通知',
    content: '{{ name }}，您的申请已通过 ✓'
  }
}
```

### Code 节点

```typescript
{
  type: 'code',
  data: {
    language: 'javascript',
    code: `// 输入变量可直接使用
// 将输出写入 _output
_output.total = input.amount * 1.1;
_output.tax = input.amount * 0.09;`
  }
}
```

### Database 节点

```typescript
{
  type: 'database',
  data: {
    isSelect: true,
    sql: 'SELECT * FROM orders WHERE user_id = {{ userId }} AND status = {{ status }}'
  }
}
```

---

## 节点配置面板说明（Setter）

右侧 Setter 面板根据节点类型动态渲染：

| 节点类型 | 必填配置 |
|---------|---------|
| `start` | 无需配置（入口节点）|
| `end` | 无需配置（终点节点）|
| `llm` | 模型 + prompt |
| `code` | 语言 + 代码 |
| `condition` | 分支列表 + 默认分支 |
| `approval` | 审批人类型 + 审批人表达式 + 标题模板 |
| `http` | URL + 方法 + Body |
| `variable` | 变量名 + 变量值/变量类型 |
| `loop` | 循环类型 + 次数 |
| `subflow` | 子流程编码 |
| `message` | 渠道 + 接收人 + 标题 + 内容 |
| `database` | SQL + 查询/执行 |

---

## 与后端对照

| 前端节点 type | 后端 NodeExecutor | 说明 |
|--------------|------------------|------|
| `start` | `StartNodeExecutor` | 入口 |
| `end` | `EndNodeExecutor` | 结束 |
| `llm` | `LLMNodeExecutor` | AI 调用（需接入 MiniMax）|
| `code` | `CodeNodeExecutor` | JavaScript 脚本执行 |
| `condition` | `ConditionNodeExecutor` | 条件分支 |
| `approval` | `ApprovalNodeExecutor` | 人工审批（流程暂停）|
| `http` | `HTTPNodeExecutor` | HTTP 请求 |
| `variable` | `VariableNodeExecutor` | 变量读写 |
| `loop` | `LoopNodeExecutor` | 循环 |
| `subflow` | `SubflowNodeExecutor` | 子工作流 |
| `message` | `MessageNodeExecutor` | 消息通知 |
| `database` | `DatabaseNodeExecutor` | SQL 执行 |

---

## 设计器快捷操作

| 操作 | 方式 |
|------|------|
| 添加节点 | 从左侧面板拖拽到画布 |
| 连接两个节点 | 点击源节点 out 端口 → 点击目标节点 in 端口 |
| 移动节点 | 鼠标拖拽节点 |
| 删除节点 | 选中节点 → 右侧面板底部删除 |
| 删除连线 | 点击连线选中 → Delete 键 |
| 预览配置 | 点击右上角"预览配置"按钮 |
| 发布工作流 | 先保存，再点击"发布"（仅草稿状态可见）|
