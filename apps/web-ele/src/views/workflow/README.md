# 工作流引擎模块

> 本模块提供**可配置审批流程引擎**，支持拖拽设计流程、审批节点、条件分支、多级流转。

---

## 📁 目录结构

```
后端（java-backend-basic）
├── sql/workflow_schema.sql          ← 数据库表结构
└── src/main/java/.../workflow/
    ├── entity/                     ← 实体类
    │   ├── WfDefinition.java      ← 工作流定义
    │   ├── WfInstance.java         ← 工作流实例
    │   ├── WfTask.java            ← 审批任务
    │   └── WfTaskHistory.java    ← 审批历史
    ├── dao/                        ← MyBatis-Plus Mapper
    ├── model/                      ← DTO / 流程配置模型
    ├── service/                    ← 服务接口
    ├── impl/                       ← 核心流程引擎实现
    └── controller/                 ← REST API

前端（web-vben-basic）
└── apps/web-ele/src/
    ├── api/modules/workflow/      ← API 层
    │   └── index.ts
    └── views/workflow/
        ├── designer/index.vue      ← 拖拽式流程设计器
        └── instance/index.vue      ← 我的待办 + 申请记录
```

---

## 🔧 数据库表

| 表名 | 说明 |
|------|------|
| `wf_definition` | 工作流定义（名称/编码/节点配置/状态）|
| `wf_instance` | 工作流实例（每次申请生成一条）|
| `wf_task` | 审批任务（每个审批节点生成一条）|
| `wf_task_history` | 审批历史（每个操作记录一条）|

---

## 🎯 核心概念

### 节点类型

| 类型 | 说明 | 配置项 |
|------|------|--------|
| `start` | 发起人（流程起点，自动跳过）| — |
| `approver` | 审批人节点 | assigneeType / assigneeExpr / sequence |
| `condition` | 条件分支 | conditions[] / defaultNodeId |
| `end` | 流程结束 | — |
| `auto` | 自动节点（预留）| — |

### 审批人表达式

| 表达式 | 说明 |
|--------|------|
| `user:123` | 指定用户 ID 123 |
| `role:manager` | 指定角色（需配合角色表）|
| `${initiator}` | 发起人自己 |

### 条件表达式

```javascript
amount > 1000          // 表单金额大于1000
level == 1              // 等级等于1
type == 'reimburse'    // 类型等于某值
```

---

## 🔌 API 接口

### 管理端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/workflow/definition/page` | 分页查询定义 |
| GET | `/workflow/definition/{id}` | 获取定义详情 |
| POST | `/workflow/definition` | 创建/更新定义 |
| POST | `/workflow/definition/{id}/publish` | 发布 |
| POST | `/workflow/definition/{id}/disable` | 禁用 |

### 用户端

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/workflow/submit` | 提交申请 |
| GET | `/workflow/task/my` | 我的待办列表 |
| POST | `/workflow/task/approve` | 审批操作（同意/拒绝）|
| POST | `/workflow/instance/revoke` | 撤回申请 |
| GET | `/workflow/instance/my` | 我的申请列表 |
| GET | `/workflow/instance/{id}` | 实例详情 |
| GET | `/workflow/instance/{id}/history` | 审批历史 |

---

## 📐 审批流程

```
发起人提交申请
    │
    ├──→ 审批节点1（部门主管审批）
    │         │
    │         ├── [同意] ──→ 审批节点2（总监审批）
    │         │                    │
    │         │                    └── [同意] ──→ 结束
    │         │                                        │
    │         └── [拒绝] ──→ 结束（流程拒绝）
    │
    └── [条件不满足] ──→ 结束（快速通过）
```

### 条件分支流程

```
审批节点
    │
    ├── [amount > 1000] ──→ 审批节点2（总监审批）
    │
    ├── [amount > 10000] ──→ 审批节点3（财务审批）
    │
    └── [默认] ──→ 结束
```

---

## 🎨 前端页面

### 工作流设计器（/workflow/designer）

- **左侧**：节点面板（拖拽添加）
- **中间**：Vue Flow 可视化画布
- **右侧**：节点/连线属性配置

### 我的审批（/workflow/my）

- **Tab1**：待办列表（卡片 + 审批弹窗）
- **Tab2**：我的申请（列表 + 撤回 + 详情）

---

## 🚀 快速使用

### 1. 创建工作流

```
GET /workflow/designer → 打开设计器
→ 拖拽添加审批节点
→ 配置审批人表达式
→ 保存 → 发布
```

### 2. 提交申请

```bash
POST /api/workflow/submit
{
  "definitionCode": "leave-flow",
  "title": "张三 - 请假申请 - 3天",
  "formData": {
    "leaveType": "年假",
    "days": 3,
    "reason": "家庭原因"
  }
}
```

### 3. 审批

```bash
POST /api/workflow/task/approve
{
  "taskId": 123,
  "action": "agree",    // agree / reject
  "opinion": "同意，请注意交接工作"
}
```
