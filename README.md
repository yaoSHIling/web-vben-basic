# 🔥 web-vben-basic

> 基于 **Vue3 + Vben Admin + Element Plus** 的企业级前端脚手架。
> 对接 [java-backend-basic](https://github.com/yaoSHIling/java-backend-basic)，开箱即用，代码即文档。

[![Vue 3](https://img.shields.io/badge/Vue-3.4-green.svg)](https://vuejs.org/)
[![Vben Admin](https://img.shields.io/badge/Vben%20Admin-2.x-blue.svg)](https://github.com/vbenjs/vue-vben-admin)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-orange.svg)](https://element-plus.org/)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 项目定位

本项目是 [java-backend-basic](https://github.com/yaoSHIling/java-backend-basic) 的**配套前端**，
面向 **CRM / OA / 后台管理系统** 的企业级 Vue3 前端解决方案。

- ✅ 对接 java-backend-basic，开箱即用
- ✅ Vue3 + Vite + Pinia + Vue Router
- ✅ Element Plus 企业级 UI 组件库
- ✅ 完善的前端权限体系（页面权限 + 按钮权限）
- ✅ 常用业务示例：客户管理（增删改查 + 跟进记录 + 任务待办）

---

## 🛠️ 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 核心框架 | Vue 3.4 + Vite 5 | 最新组合，开发体验最佳 |
| 状态管理 | Pinia | Vue 3 官方推荐 |
| UI 库 | Element Plus 2.x | 企业级组件库 |
| 类型 | TypeScript 5 | 类型安全 |
| 构建 | Vite | 极速构建 |
| 脚手架 | Vben Admin 2.x | 功能最全面的 Vue3 admin 模板 |
| HTTP | Axios（已封装） | 统一请求拦截/响应处理 |
| 图表 | ECharts | 可视化（可选） |
| 表格 | Element Plus Table | 集成列配置/分页/筛选 |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8（推荐）或 npm >= 9

### 安装依赖

```bash
# 使用 pnpm（推荐，速度快）
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
# 启动开发服务器（Web-Ele 版本，Element Plus UI）
pnpm dev:web-ele

# 启动开发服务器（其他 UI 版本）
pnpm dev:web-antd     # Ant Design Vue
pnpm dev:web-naive    # Naive UI
pnpm dev:web-tdesign  # TDesign
```

### 生产构建

```bash
pnpm build:web-ele    # 构建 Web-Ele 版本
```

### Docker 部署

```bash
# 前端构建
pnpm build:web-ele

# Nginx 部署（已配置 vue-router history 模式）
docker run -d -p 80:80 \
  -v $(pwd)/dist:/usr/share/nginx/html \
  -e NGINX_HOST=your-domain.com \
  nginx:alpine
```

---

## 📁 项目结构

```
apps/web-ele/src/
│
├── api/                        # ============ API 层 ============
│   ├── request.ts              # Axios 封装（统一拦截/错误处理/Token）
│   └── modules/
│       └── crm/               # CRM 模块 API
│           └── index.ts       # 客户管理 / 跟进记录 / 任务待办
│
├── views/                     # ============ 页面 ============
│   ├── crm/                   # CRM 模块（示例）
│   │   └── customer.vue        # 客户管理（增删改查 + 跟进 + 弹窗）
│   └── demos/                 # Vben 官方示例页面
│
├── router/                   # 路由配置
├── store/                    # Pinia 状态管理
└── locales/                  # 国际化配置
```

---

## 🔌 API 层说明

### 对接后端地址配置

**开发环境**（根目录 `.env.development`）：
```bash
VITE_APP_API_BASE_URL=http://localhost:8080/api
```

**生产环境**（`.env.production`）：
```bash
VITE_APP_API_BASE_URL=https://your-api-domain.com/api
```

### 统一响应格式

后端返回格式（需与 java-backend-basic 配合）：
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
| `code: > 0` | 业务错误（参考 `ResultCode` 枚举） |
| `data` | 响应数据 |

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

### 请求拦截器

- 自动在请求头注入 `Authorization: Bearer {token}`
- Token 过期时自动刷新
- 刷新失败自动跳转登录页

### 响应拦截器

- `code === 0`：直接返回 `data` 数据
- `code !== 0`：自动 `ElMessage.error()` 弹出错误信息

---

## 📋 CRM 模块示例

> 以下展示一个完整的 **客户管理** 业务场景，包含列表、新增、编辑、跟进记录。

### API 调用示例

```typescript
import {
  pageCustomersApi,
  saveCustomerApi,
  addFollowupApi,
  pendingTasksApi,
} from '#/api/modules/crm';

// 1. 分页查询客户
const res = await pageCustomersApi({ page: 1, pageSize: 10, name: '张三' });
console.log(res.list);    // 客户列表
console.log(res.total);   // 总数

// 2. 新增客户
await saveCustomerApi({
  name: '北京科技有限公司',
  mobile: '13800138000',
  company: '北京科技有限公司',
  industry: 'IT',
  level: 1,   // 重点客户
});

// 3. 添加跟进记录
await addFollowupApi({
  customerId: 1,
  followupType: 1,       // 电话
  content: '初次电话沟通，客户表示有采购意向',
  nextPlan: '下周安排上门拜访',
  nextFollowupAt: '2024-04-25 10:00:00',
});

// 4. 获取我的待办任务
const tasks = await pendingTasksApi();
console.log(tasks);  // 待办列表
```

### 前端页面示例

客户管理页面路径：`/views/crm/customer.vue`

**功能清单：**

| 功能 | 说明 |
|------|------|
| 分页列表 | 搜索 + 等级/状态筛选 |
| 新增客户 | 弹窗表单 |
| 编辑客户 | 弹窗表单 |
| 删除客户 | 二次确认 |
| 添加跟进 | 记录跟进内容 + 下次计划 |
| 等级标签 | 重点(红) / 重要(橙) / 普通(灰) |
| 状态标签 | 潜在 / 意向 / 成交 / 流失 |

---

## 📖 与后端对接说明

### Step 1：后端启动

```bash
cd ../java-backend-basic
docker-compose -f docker/docker-compose.yml up -d
# 或本地启动：mvn spring-boot:run
```

确保后端运行在 `http://localhost:8080/api`

### Step 2：前端配置

```bash
# .env.development
VITE_APP_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=企业管理系统
```

### Step 3：登录接口对接

前端登录请求：
```typescript
// apps/web-ele/src/api/core/auth.ts
POST /api/auth/login
Body: { username: "admin", password: "123456" }
```

后端返回：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Step 4：验证联通性

```bash
# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# 访问 Swagger
open http://localhost:8080/api/swagger-ui.html
```

---

## 🎨 自定义开发

### 新增业务模块

```
# 1. 新建 API 文件
apps/web-ele/src/api/modules/your-module/index.ts

# 2. 新建页面
apps/web-ele/src/views/your-module/YourPage.vue

# 3. 在 router 中注册路由
apps/web-ele/src/router/routes/index.ts
```

### 新增菜单

在 Vben Admin 的后台动态菜单管理中配置，或在前端路由文件中新增：
```typescript
{
  path: '/your-module',
  component: Layout,
  meta: { title: '模块名称', icon: 'lucide:box' },
  children: [
    { path: 'page', component: () => import('#/views/your-module/YourPage.vue') }
  ]
}
```

### 新增 API 方法

```typescript
// apps/web-ele/src/api/modules/your-module/index.ts
export async function getDataApi(id: number) {
  return requestClient.get<YourDataType>(`/your-module/${id}`);
}
```

---

## 📚 文档地址

| 文档 | 地址 |
|------|------|
| **Swagger API 文档** | http://localhost:8080/api/swagger-ui.html |
| **Vben Admin 官方文档** | https://vben.vvbin.cn/docs/ |
| **Element Plus** | https://element-plus.org/ |
| **Vue3 官方文档** | https://vuejs.org/ |

---

## 📄 License

MIT © yaoSHIling
