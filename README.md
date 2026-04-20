# 🔥 web-vben-basic 前端快速开发脚手架

> 基于 **Vue3 + Vben Admin + Element Plus**，专为快速开发 **CRM / OA / 后台管理** 系统而生。
> 配套 [java-backend-basic](https://github.com/yaoSHIling/java-backend-basic) 使用，开箱即用。

[![Vue 3](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org/)
[![Vben Admin](https://img.shields.io/badge/Vben%20Admin-2.x-blue.svg)](https://github.com/vbenjs/vue-vben-admin)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-orange.svg)](https://element-plus.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ 快速开始

### 10 分钟跑起来

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

### 环境要求

- Node.js >= 18
- pnpm >= 8（推荐）或 npm >= 9
- 后端 [java-backend-basic](https://github.com/yaoSHIling/java-backend-basic) 运行在 `localhost:8080`

---

## 📁 项目结构

```
web-vben-basic/
│
├── scripts/                         # ============ 脚手架工具 ============
│   ├── gen-module.cjs               # 一键生成 CRUD 模块（推荐）
│   └── README.md                   # 工具使用说明
│
├── _templates/                     # ============ 代码模板 ============
│   ├── api-module/                 # API 层模板（复制即用）
│   └── page-module/                # 页面模板（复制即用）
│
├── apps/web-ele/src/               # ============ 主应用（Element Plus）===
│   │
│   ├── api/
│   │   ├── request.ts             # Axios 封装（统一拦截/Token/错误）
│   │   └── modules/
│   │       ├── _template/         # API 模板文件（参考）
│   │       ├── auth/              # 认证 API（已有）
│   │       └── crm/               # CRM 示例（已有）
│   │
│   ├── views/
│   │   ├── _core/                 # 系统页面（登录/关于/个人中心）
│   │   ├── _template/             # 页面模板文件（参考）
│   │   ├── dashboard/             # 仪表盘（已有）
│   │   └── crm/                   # CRM 示例（已有）
│   │
│   ├── router/routes/modules/     # 路由配置（每个模块一个文件）
│   │       ├── dashboard.ts
│   │       ├── crm.ts
│   │       └── _template.ts      # 路由模板（参考）
│   │
│   └── types/                     # 共享类型定义
│       └── api.d.ts               # 全局 API 类型
│
└── docs/
    └── integration.md             # 前后端对接说明
```

---

## 🚀 快速开发流程（核心）

### 第 1 步：一键生成模块

```bash
# 在项目根目录执行（交互式）
node scripts/gen-module.cjs

# 或指定参数（一次性完成）
node scripts/gen-module.cjs --module order --title "订单管理"
```

**生成内容：**

```
apps/web-ele/src/
├── api/modules/order/         ← API 接口
│   └── index.ts
├── views/order/               ← 页面文件
│   ├── index.vue             ← 列表页面
│   └── components/           ← 子组件
│       ├── OrderForm.vue    ← 新增/编辑弹窗
│       └── OrderDetail.vue  ← 详情页
└── router/routes/modules/order.ts   ← 路由注册
```

### 第 2 步：对接后端 API

在生成的 `api/modules/order/index.ts` 中修改接口路径：

```typescript
// 对应后端接口：GET /api/order/page
export async function pageOrdersApi(query: OrderPageQuery) {
  return requestClient.get<PageResult<Order>>('/order/page', { params: query });
}
```

### 第 3 步：开发页面逻辑

直接修改 `views/order/index.vue`，调用生成的 API 方法即可。

---

## 📖 核心开发规范

### 规范 1：API 层结构

每个业务模块一个独立目录：

```
api/modules/{module-name}/index.ts
```

文件结构：
```typescript
// 1. 命名空间（类型定义放这里）
export namespace {Module}Api {
  // 实体类型
  export interface Entity { id: number; ... }
  // 分页查询参数
  export interface PageQuery { page: number; pageSize: number; ... }
  // 保存/更新 DTO
  export interface SaveDTO { ... }
}

// 2. API 方法（直接调用 requestClient）
export async function pageApi(query: {Module}Api.PageQuery) {
  return requestClient.get<PageResult<{Module}Api.Entity>>('/{module-name}/page', { params: query });
}
export async function saveApi(data: {Module}Api.SaveDTO) {
  return requestClient.post<number>('/{module-name}', data);
}
export async function updateApi(id: number, data: {Module}Api.SaveDTO) {
  return requestClient.put(`/\{module-name}/$\{id}`, data);
}
export async function deleteApi(id: number) {
  return requestClient.delete(`/\{module-name}/$\{id}`);
}
export async function getByIdApi(id: number) {
  return requestClient.get<{Module}Api.Entity>(`/\{module-name}/$\{id}`);
}
```

### 规范 2：页面结构（CRUD 通用模板）

每个列表页面统一结构：

```
views/{module}/
├── index.vue           ← 列表页面（含分页/搜索/操作）
└── components/
    ├── Form.vue        ← 新增/编辑弹窗
    └── Detail.vue      ← 详情弹窗
```

**列表页面标准结构：**
```vue
<template>
  <div>
    <!-- 1. 搜索栏 -->
    <SearchBar @query="handleQuery" @reset="resetQuery" />

    <!-- 2. 工具栏 -->
    <Toolbar>
      <template #left>
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </template>
    </Toolbar>

    <!-- 3. 数据表格 -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column type="index" label="序号" />
      <!-- 动态列 -->
      <el-table-column v-for="col in columns" :key="col.prop" v-bind="col" />
      <!-- 操作列 -->
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <el-button link @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 4. 分页 -->
    <el-pagination
      v-model:page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @pagination="loadData"
    />

    <!-- 5. 弹窗 -->
    <FormDialog v-model="dialogVisible" :data="currentRow" @success="loadData" />
  </div>
</template>
```

### 规范 3：路由注册

每个模块一个路由文件：

```typescript
// apps/web-ele/src/router/routes/modules/order.ts
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/order',
    name: 'Order',
    meta: { title: '订单管理', icon: 'lucide:file-text' },
    children: [
      {
        name: 'OrderList',
        path: '/order/list',
        component: () => import('#/views/order/index.vue'),
        meta: { title: '订单列表' },
      },
    ],
  },
];

export default routes;
```

### 规范 4：Types 定义

在 `api/modules/{module}/index.ts` 中定义所有类型，
在 `types/api.d.ts` 中注册全局类型：

```typescript
// types/api.d.ts
import type { CrmApi } from '#/api/modules/crm';
import type { OrderApi } from '#/api/modules/order';  // 新增

declare global {
  interface ApiModuleMap {
    crm: CrmApi;
    order: OrderApi;  // 新增
  }
}
```

---

## 🛠️ 脚手架工具详解

### gen-module.cjs — 一键生成 CRUD 模块

**交互式使用：**
```bash
node scripts/gen-module.cjs
```

**参数说明：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `--module` | 模块名（英文，目录名） | `order` |
| `--title` | 模块标题（菜单显示） | `订单管理` |
| `--icon` | 菜单图标 | `lucide:file-text` |
| `--skip` | 跳过生成步骤 | `--skip api` |

**生成后你需要做的：**

1. **实现 API 接口**（`api/modules/{module}/index.ts`）
   - 将 `requestClient.get('/placeholder')` 改为真实接口路径
   - 添加 TypeScript 类型

2. **配置路由权限**（如果需要）
   - 在 Vben Admin 后台菜单管理中添加
   - 或手动修改 `router/routes/modules/{module}.ts`

3. **开发页面逻辑**（`views/{module}/index.vue`）
   - 编写搜索表单
   - 编写表格列
   - 编写弹窗表单

---

## 🎨 常用组件速查

### 表格

```vue
<el-table :data="tableData" stripe v-loading="loading">
  <el-table-column type="index" label="序号" width="60" />
  <el-table-column prop="name" label="名称" min-width="140" />
  <el-table-column prop="status" label="状态" width="100" align="center">
    <template #default="{ row }">
      <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
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
  :page-sizes="[10, 20, 50, 100]"
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

### 搜索栏

```vue
<el-form inline :model="queryParams">
  <el-form-item label="名称">
    <el-input v-model="queryParams.name" clearable @keyup.enter="handleQuery" />
  </el-form-item>
  <el-form-item label="状态">
    <el-select v-model="queryParams.status" clearable>
      <el-option label="启用" :value="1" />
      <el-option label="禁用" :value="0" />
    </el-select>
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="handleQuery">搜索</el-button>
    <el-button @click="resetQuery">重置</el-button>
  </el-form-item>
</el-form>
```

### 日期时间

```vue
<el-date-picker
  v-model="queryParams.dateRange"
  type="datetimerange"
  range-separator="至"
  start-placeholder="开始时间"
  end-placeholder="结束时间"
  value-format="YYYY-MM-DD HH:mm:ss"
/>
```

---

## 📋 模板文件（直接复制使用）

### API 模板

位置：`_templates/api-module/index.ts`

```typescript
import type { PageResult, PageParams } from '#/types';
import { requestClient } from '#/api/request';

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

export async function page{Module}Api(query: {Module}Api.PageQuery) {
  return requestClient.get<PageResult<{Module}Api.Entity>>(
    '/{module-name}/page',
    { params: query }
  );
}

export async function getByIdApi(id: number) {
  return requestClient.get<{Module}Api.Entity>(`/{module-name}/$\{id}`);
}

export async function saveApi(data: {Module}Api.SaveDTO) {
  return requestClient.post<number>('/{module-name}', data);
}

export async function updateApi(id: number, data: {Module}Api.SaveDTO) {
  return requestClient.put(`/\{module-name}/$\{id}`, data);
}

export async function deleteApi(id: number) {
  return requestClient.delete(`/\{module-name}/$\{id}`);
}
```

### 页面模板

位置：`_templates/page-module/index.vue`

```vue
<template>
  <div>
    <!-- 搜索栏 -->
    <el-form inline :model="queryParams" label-width="80">
      <el-form-item label="名称">
        <el-input v-model="queryParams.name" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
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
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
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
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @pagination="loadData"
    />

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  page{Module}Api,
  save{Module}Api,
  update{Module}Api,
  delete{Module}Api,
} from '#/api/modules/{module}';

definePage({ meta: { title: '{Title}' } });

// ======== 数据 ========
const loading = ref(false);
const total = ref(0);
const tableData = ref<any[]>([]);
const queryParams = reactive({ page: 1, pageSize: 10, name: '', status: undefined as number | undefined });

// ======== 弹窗 ========
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const formData = reactive({ id: 0, name: '', status: 1 });
const formRules = { name: [{ required: true, message: '名称不能为空', trigger: 'blur' }] };

// ======== 加载数据 ========
async function loadData() {
  loading.value = true;
  try {
    const res = await page{Module}Api(queryParams);
    tableData.value = res.list;
    total.value = res.total;
  } catch { ElMessage.error('加载失败'); }
  finally { loading.value = false; }
}

function handleQuery() { queryParams.page = 1; loadData(); }
function resetQuery() { Object.assign(queryParams, { page: 1, name: '', status: undefined }); loadData(); }

// ======== 增删改 ========
function handleAdd() {
  isEdit.value = false; dialogTitle.value = '新增'; Object.assign(formData, { id: 0, name: '', status: 1 });
  dialogVisible.value = true;
}
function handleEdit(row: any) {
  isEdit.value = true; dialogTitle.value = '编辑'; Object.assign(formData, { id: row.id, name: row.name, status: row.status });
  dialogVisible.value = true;
}
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    isEdit.value ? await update{Module}Api(formData.id, formData) : await save{Module}Api(formData);
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功');
    dialogVisible.value = false; loadData();
  } catch { ElMessage.error('操作失败'); }
  finally { submitLoading.value = false; }
}
async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除"${row.name}"吗？`, '提示', { type: 'warning' });
  await delete{Module}Api(row.id);
  ElMessage.success('删除成功'); loadData();
}

onMounted(loadData);
</script>
```

---

## 📂 常见场景处理

### 场景 1：下拉选项（字典/枚举）

```typescript
// 从后端获取
const statusOptions = ref([{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]);

// 或从字典服务获取
import { useDictStore } from '#/store';
const dictStore = useDictStore();
const statusOptions = computed(() => dictStore.getOptions('order_status'));
```

```vue
<el-select v-model="formData.status">
  <el-option v-for="opt in statusOptions" :key="opt.value" v-bind="opt" />
</el-select>
```

### 场景 2：日期范围筛选

```typescript
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  startTime: '',
  endTime: '',
});
```

```vue
<el-date-picker
  v-model="dateRange"
  type="datetimerange"
  range-separator="至"
  value-format="YYYY-MM-DD HH:mm:ss"
  @change="(val) => { queryParams.startTime = val?.[0]; queryParams.endTime = val?.[1]; handleQuery(); }"
/>
```

### 场景 3：表格列权限控制

```vue
<el-table-column
  v-if="hasPermission('order:export')"
  label="导出"
  width="80"
>
  <template #default="{ row }">
    <el-button link type="primary" @click="handleExport(row)">导出</el-button>
  </template>
</el-table-column>
```

### 场景 4：文件上传

```vue
<el-upload
  :action="uploadUrl"
  :headers="{ Authorization: `Bearer ${accessToken}` }"
  :on-success="(res) => { formData.fileUrl = res.data.url; ElMessage.success('上传成功'); }"
  :on-error="() => ElMessage.error('上传失败')"
  accept=".xlsx,.xls"
>
  <el-button type="primary">上传文件</el-button>
</el-upload>
```

### 场景 5：确认框 + 批量操作

```typescript
async function handleBatchDelete() {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先选择'); return; }
  await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条数据吗？`, '批量删除', { type: 'warning' });
  await Promise.all(selectedRows.value.map((r) => deleteApi(r.id)));
  ElMessage.success('批量删除成功'); loadData();
}
```

---

## 📚 文档地址

| 文档 | 地址 |
|------|------|
| Swagger API 文档 | http://localhost:8080/api/swagger-ui.html |
| Vben Admin 官方文档 | https://vben.vvbin.cn/docs/ |
| Element Plus 组件 | https://element-plus.org/ |
| Vue3 官方文档 | https://vuejs.org/ |
| TypeScript 手册 | https://www.typescriptlang.org/docs/ |

---

## 📄 License

MIT © yaoSHIling
