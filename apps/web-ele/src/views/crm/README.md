# CRM 模块示例

> 本目录展示一个完整的 CRM 客户关系管理系统前端实现，对接 `java-backend-basic` 后端。
> 代码可直接复制到新项目使用，或作为模块开发模板参考。

---

## 📁 目录结构

```
views/crm/
├── customer.vue          # 客户管理页面（列表/新增/编辑/跟进/统计卡片）
├── task.vue             # 跟进任务页面（列表/创建/完成/删除）
├── components/
│   └── TaskCreateDialog.vue   # 创建任务弹窗（可复用）
└── README.md            # 本文件
```

## 🔌 对接接口

| 页面 | 接口前缀 | 说明 |
|------|---------|------|
| 客户管理 | `/crm/customer/*` | 客户 CRUD + 统计 |
| 跟进任务 | `/crm/task/*` | 任务 CRUD |

### 接口清单

```
GET    /crm/customer/page     客户分页查询
GET    /crm/customer/{id}    客户详情
POST   /crm/customer          新增客户
PUT    /crm/customer/{id}    修改客户
DELETE /crm/customer/{id}    删除客户
GET    /crm/customer/stats   客户统计

GET    /crm/followup/list     跟进记录列表
POST   /crm/followup          添加跟进记录

GET    /crm/task/page         任务分页
POST   /crm/task              创建任务
POST   /crm/task/{id}/complete 完成任务
GET    /crm/task/pending      我的待办
```

## 🎯 功能清单

### 客户管理（customer.vue）

| 功能 | 说明 |
|------|------|
| 统计卡片 | 总数/意向/成交/待办任务数 |
| 分页列表 | 搜索 + 等级/状态筛选 |
| 新增客户 | 弹窗表单（名称/手机/公司/行业/来源/等级） |
| 编辑客户 | 同新增弹窗，自动填充数据 |
| 删除客户 | 二次确认防误删 |
| 添加跟进 | 跟进方式 + 内容 + 下次计划 |
| 等级标签 | 重点(红) / 重要(橙) / 普通(灰) |
| 状态标签 | 潜在 / 意向 / 成交 / 流失 |

### 跟进任务（task.vue）

| 功能 | 说明 |
|------|------|
| 任务列表 | 卡片式展示，优先级/状态颜色区分 |
| 创建任务 | 选客户 + 标题 + 内容 + 截止时间 + 优先级 |
| 完成任务 | 一键完成，自动刷新 |
| 删除任务 | 二次确认 |
| 状态筛选 | 全部 / 待办 / 已完成 / 已逾期 |
| 优先级筛选 | 高 / 中 / 低 |

## 🔧 如何复用

### 复用客户管理页面

1. **复制整个 `crm/` 目录**到你的模块：
   ```bash
   cp -r views/crm views/order
   ```

2. **修改 API 引用**（customer.vue 顶部）：
   ```typescript
   // 改前（CRM）
   import { ..., type CrmApi } from '#/api/modules/crm';
   
   // 改后（你的模块）
   import { ..., type OrderApi } from '#/api/modules/order';
   ```

3. **修改字段映射**：
   - `dict.industry` → 你的下拉选项
   - `formData` 的字段 → 对应 DTO
   - `tableData` 的列 → 对应实体属性

### 复用任务管理页面

任务页面相对通用，只需：
1. 替换 API 为你的模块 API
2. 修改表单字段

## 📐 数据流

```
用户操作（点击按钮）
    │
    ▼
Vue 组件（<script setup>）
    │
    ▼
API 方法（api/modules/crm/index.ts）
    │
    ▼
requestClient（Axios 封装）
    │
    ▼
后端接口（/api/crm/customer/page）
    │
    ▼
后端 Result<PageResult<Customer>>
    │
    ▼
响应拦截器（code === 0 ? data : throw）
    │
    ▼
Vue 组件（tableData = res.list）
```

## ⚠️ 注意事项

1. **后端必须返回 `code: 0`** 才算成功，非 0 会自动弹出错误
2. **分页参数**：`page`（从1开始）和 `pageSize`
3. **时间格式**：统一用 `YYYY-MM-DD HH:mm:ss`
4. **路由注册**：记得在 `router/routes/modules/` 中注册路由，或在后台菜单管理中添加
