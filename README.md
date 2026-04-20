# 🔥 web-vben-basic

> 基于 **Vue3 + Vben Admin + Element Plus** 的企业级前端脚手架。
> 配套 [java-backend-basic](https://github.com/yaoSHIling/java-backend-basic)，一键生成 CRUD 模块，10 分钟上手新业务。

[![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vben Admin](https://img.shields.io/badge/Vben%20Admin-2.x-blue.svg)](https://github.com/vbenjs/vue-vben-admin)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-orange.svg)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 项目定位

本项目是 [java-backend-basic](https://github.com/yaoSHIling/java-backend-basic) 的**配套前端**，
开箱即用，同时也是一个**独立的前端脚手架**，可用于快速启动任何 Vue3 后台管理系统。

---

## ⚡ 10 分钟快速开始

```bash
# 1. 克隆项目
git clone https://github.com/yaoSHIling/web-vben-basic.git
cd web-vben-basic

# 2. 安装依赖
pnpm install

# 3. 配置后端地址
echo "VITE_APP_API_BASE_URL=http://localhost:8080/api" > .env.development

# 4. 启动开发
pnpm dev:web-ele

# 5. 打开浏览器
open http://localhost:5173
```

---

## 📁 项目结构

```
web-vben-basic/
│
├── scripts/                                    # 脚手架工具
│   ├── gen-module.cjs                          # ⭐ 一键生成 CRUD 模块
│   └── README.md                               # 工具使用文档
│
├── _templates/                                 # 代码模板库
│   ├── api-module/index.ts                     # API 模块模板
│   ├── page-module/                            # 页面模板
│   └── README.md
│
├── docs/
│   └── integration.md                          # 前后端对接说明
│
└── apps/web-ele/src/                          # Element Plus 版本
    │
    ├── api/
    │   ├── request.ts                         # Axios 封装（已配置好）
    │   ├── core/                              # 核心 API（auth/user/menu）
    │   └── modules/
    │       ├── crm/                           # CRM 模块示例 ⭐
    │       │   ├── index.ts                   # API + 类型定义
    │       │   └── README.md
    │       └── _template/                     # API 模板参考
    │
    ├── views/
    │   ├── crm/                               # CRM 示例完整实现 ⭐
    │   │   ├── customer.vue                   # 客户管理页面
    │   │   ├── task.vue                       # 跟进任务页面
    │   │   ├── components/
    │   │   └── README.md
    │   └── workflow/                          # Coze 风格工作流引擎 ⭐
    │       ├── README.md                      # 工作流模块文档
    │       ├── designer/                      # 可视化流程设计器
    │       │   ├── index.vue                  # 设计器主页
    │       │   ├── WorkflowCanvas.vue         # SVG 画布组件
    │       │   └── WorkflowSetter.vue         # 节点配置面板
    │       └── instance/                      # 执行记录页面
    │           └── index.vue
    │
    ├── _template/                              # 页面模板参考
    ├── _core/                                  # 系统页面（登录/404/个人中心）
    └── dashboard/                              # 仪表盘
    │
    ├── router/routes/
    │   └── modules/
    │       ├── crm.ts                         # CRM 路由 ⭐
    │       └── _template.ts                   # 路由模板参考
    │
    └── types/
        └── api.d.ts                           # 全局类型定义
```

---

## 🚀 快速开发流程

### 方式一：一键生成（推荐）

```bash
# 生成一个"订单管理"模块（交互式）
node scripts/gen-module.cjs --module order --title "订单管理"

# 或自定义图标
node scripts/gen-module.cjs --module order --title "订单管理" --icon lucide:file-text
```

生成结果：
```
apps/web-ele/src/
├── api/modules/order/index.ts     ← API 接口
├── views/order/index.vue         ← 列表页面
└── router/routes/modules/order.ts ← 路由
```

**然后修改 API 接口路径，对接你的后端即可。**

### 方式二：从模板复制

```bash
# 1. 复制 API 模板
cp _templates/api-module/index.ts apps/web-ele/src/api/modules/your-module/index.ts

# 2. 复制页面模板
cp _templates/page-module/index.vue apps/web-ele/src/views/your-module/index.vue

# 3. 修改接口路径和字段名
```

---

## 📋 业务模块示例（CRM 客户关系管理）

> 完整的前后端示例，对接 `java-backend-basic` 后端的 CRM 模块。

### 页面截图（文字描述）

**客户管理列表页**
- 顶部统计卡片：客户总数 / 意向客户 / 成交客户 / 待办任务
- 搜索栏：按客户名称 / 等级 / 状态筛选
- 数据表格：序号 / 名称 / 公司 / 手机 / 行业 / 等级标签 / 状态标签 / 最后跟进时间 / 操作按钮
- 分页组件：自动同步 total 和 pageSize

**跟进任务页**
- 卡片式列表：优先级标签（高=红 / 中=橙 / 低=灰）+ 状态标签（待办/已完成/已逾期）
- 状态筛选：全部 / 待办 / 已完成 / 已逾期
- 操作：创建任务 / 完成任务 / 删除任务

### API 接口（已定义）

```typescript
// apps/web-ele/src/api/modules/crm/index.ts

// 客户管理
pageCustomersApi(query)          // 分页查询
saveCustomerApi(data)            // 新增
updateCustomerApi(id, data)      // 修改
deleteCustomerApi(id)            // 删除
customerStatsApi()               // 统计

// 跟进记录
addFollowupApi(data)             // 添加跟进
listFollowupsApi(customerId)     // 跟进历史

// 任务
pageTasksApi(query)              // 任务分页
createTaskApi(data)              // 创建任务
completeTaskApi(id)              // 完成任务
pendingTasksApi()                // 我的待办
```

### 页面文件（已实现）

| 文件 | 功能 |
|------|------|
| `views/crm/customer.vue` | 客户列表 + 统计卡片 + 新增/编辑弹窗 + 跟进弹窗 |
| `views/crm/task.vue` | 任务列表 + 创建弹窗 + 完成/删除 |

---

## 🛠️ 核心开发规范

### 规范 1：API 层结构

```
api/modules/{module}/index.ts
```

```typescript
// ===== 类型定义放命名空间 =====
export namespace {Module}Api {
  export interface Entity {
    id: number;
    name: string;
    status: number;
    createdTime: string;
  }

  export interface PageQuery extends PageParams {
    name?: string;
    status?: number;
  }

  export interface SaveDTO {
    name: string;
    status: number;
  }
}

// ===== API 方法直接调用 requestClient =====
// 分页查询
export async function page{Module}Api(query: {Module}Api.PageQuery) {
  return requestClient.get<PageResult<{Module}Api.Entity>>(
    '/{module}/page',
    { params: query }
  );
}
// 新增
export async function saveApi(data: {Module}Api.SaveDTO) {
  return requestClient.post<number>('/{module}', data);
}
// 其他方法...
```

### 规范 2：页面标准结构

```vue
<template>
  <div>
    <!-- 搜索栏 -->
    <el-form inline :model="queryParams" label-width="80">
      <el-form-item label="名称">
        <el-input v-model="queryParams.name" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" clearable>...</el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <div class="mb-4">
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" stripe v-loading="loading">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="name" label="名称" />
      <!-- ...更多列... -->
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @pagination="loadData"
    />

    <!-- 弹窗表单 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { page{Module}Api, saveApi, updateApi, deleteApi } from '#/api/modules/{module}';

definePage({ meta: { title: '{Title}' } });

// 数据
const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const queryParams = reactive({ page: 1, pageSize: 10, name: '', status: undefined });

// 弹窗
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const formData = reactive({ name: '', status: 1 });
const formRules = { name: [{ required: true, message: '名称不能为空', trigger: 'blur' }] };

// 加载
async function loadData() {
  loading.value = true;
  try {
    const res = await page{Module}Api(queryParams);
    tableData.value = res.list;
    total.value = res.total;
  } catch { ElMessage.error('加载失败'); }
  finally { loading.value = false; }
}

// 增删改
function handleAdd() { isEdit.value = false; dialogTitle.value = '新增'; dialogVisible.value = true; }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    isEdit.value ? await updateApi(formData.id, formData) : await saveApi(formData);
    ElMessage.success('操作成功');
    dialogVisible.value = false;
    loadData();
  } catch { ElMessage.error('操作失败'); }
  finally { submitLoading.value = false; }
}

onMounted(loadData);
</script>
```

### 规范 3：路由注册

每个模块一个路由文件：`router/routes/modules/{module}.ts`

```typescript
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/{module}',
    name: '{PascalModule}',
    meta: { title: '{Title}', icon: 'lucide:box', order: 10 },
    children: [
      {
        name: '{PascalModule}List',
        path: '/{module}/list',
        component: () => import('#/views/{module}/index.vue'),
        meta: { title: '{Title}' },
      },
    ],
  },
];

export default routes;
```

---

## 🔌 前后端对接

### 环境变量

```bash
# .env.development
VITE_APP_API_BASE_URL=http://localhost:8080/api
```

### 统一响应格式

后端返回：
```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

| 字段 | 说明 |
|------|------|
| `code: 0` | 成功 |
| `code: > 0` | 业务错误（前端自动弹出 `msg`） |

### 分页格式

```json
{
  "code": 0,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## 🎨 常用组件速查

### 表格

```vue
<el-table :data="tableData" stripe v-loading="loading">
  <el-table-column type="index" label="序号" width="60" />
  <el-table-column prop="name" label="名称" min-width="140" />
  <el-table-column prop="status" label="状态" align="center">
    <template #default="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'info'">...</el-tag>
    </template>
  </el-table-column>
</el-table>
```

### 分页

```vue
<el-pagination
  v-model:page="queryParams.page"
  v-model:page-size="queryParams.pageSize"
  :total="total"
  :page-sizes="[10, 20, 50]"
  layout="total, sizes, prev, pager, next"
  @pagination="loadData"
/>
```

### 弹窗表单

```vue
<el-dialog v-model="visible" title="标题" width="500px" destroy-on-close>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="90">
    <el-form-item label="名称" prop="name">
      <el-input v-model="formData.name" />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="visible = false">取消</el-button>
    <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
  </template>
</el-dialog>
```

### 日期时间

```vue
<el-date-picker
  v-model="formData.dueAt"
  type="datetime"
  value-format="YYYY-MM-DD HH:mm:ss"
  placeholder="选择时间"
/>
```

### 下拉选项

```vue
<el-select v-model="formData.status" placeholder="请选择" clearable>
  <el-option label="启用" :value="1" />
  <el-option label="禁用" :value="0" />
</el-select>
```

---

## 📚 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 核心框架 | Vue 3.4 + Vite 5 | 最新组合 |
| 状态管理 | Pinia | 官方推荐 |
| UI 库 | Element Plus 2.x | 企业级组件 |
| 类型 | TypeScript 5 | 类型安全 |
| 脚手架 | Vben Admin 2.x | 最全面的 Vue3 admin 模板 |
| HTTP | Axios（@vben/request） | 统一拦截/Token自动注入 |
| 图标 | Lucide Icons | 现代简约风格 |
| 构建 | Vite | 极速热更新 |

## ⚙️ Coze 风格工作流引擎

> 参考 [Coze 工作流模型](https://github.com/coze-dev/coze-studio) 实现，拖拽式可视化画布 + **12 种节点类型**。

### 技术方案

| 组件 | 实现方式 |
|------|---------|
| 画布 | 自研 SVG 连线 + div 节点（无第三方依赖）|
| 端口连接 | in/out 桩点击拖拽创建连线 |
| 节点面板 | HTML5 Drag & Drop API |
| 配置面板 | Coze 风格 Setter（按节点类型动态渲染）|

### 支持的节点（共 12 种）

| 分类 | 节点 | 说明 |
|------|------|------|
| 基础 | start / end | 入口 / 结束 |
| 逻辑 | condition / variable / loop | 条件分支 / 变量 / 循环 |
| AI | llm / code | 大模型 / 代码脚本 |
| 业务 | approval / http / message / database / subflow | 审批 / 请求 / 消息 / SQL / 子流程 |

### 页面路径

| 页面 | 路径 | 功能 |
|------|------|------|
| 工作流设计器 | /workflow/designer | 拖拽节点 → 连线 → 配置 → 保存/发布 |
| 执行记录 | /workflow/instance | 执行列表 + 节点日志时间线 |

详细文档：[views/workflow/README.md](apps/web-ele/src/views/workflow/README.md)

---

## 📚 相关文档

| 文档 | 地址 |
|------|------|
| Java 后端脚手架 | [github.com/yaoSHIling/java-backend-basic](https://github.com/yaoSHIling/java-backend-basic) |
| Swagger API 文档 | http://localhost:8080/api/swagger-ui.html |
| Vben Admin 官方文档 | https://vben.vvbin.cn/docs/ |
| Element Plus | https://element-plus.org/ |
| Lucide 图标库 | https://lucide.dev/icons |

---

## 📄 License

MIT © yaoSHIling
