# 脚手架工具说明

## gen-module.cjs — 一键生成 CRUD 模块

### 功能

自动生成完整的 Vue3 前端 CRUD 模块，包含：

- ✅ **API 层** — TypeScript 接口 + API 方法，自动对接后端 REST API
- ✅ **页面层** — 标准列表页面（搜索栏 + 表格 + 分页 + 弹窗）
- ✅ **路由层** — Vben Admin 路由配置，可直接复制到菜单管理

### 使用方式

#### 交互式（推荐新手）

```bash
cd web-vben-basic
node scripts/gen-module.cjs
```

会依次询问：
1. 模块名称（英文，kebab-case，如 `order`）
2. 菜单标题（中文，如 `订单管理`）

#### 参数式（推荐熟练后）

```bash
# 完整参数
node scripts/gen-module.cjs --module order --title "订单管理"

# 自定义图标
node scripts/gen-module.cjs --module product --title "商品管理" --icon lucide:shopping-bag

# 跳过某些步骤
node scripts/gen-module.cjs --module order --title "订单管理" --skip page
```

### 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `--module` | 模块名（kebab-case）| `order-management` |
| `--title` | 菜单显示标题 | `订单管理` |
| `--icon` | Lucide 图标名 | `lucide:file-text` |
| `--skip` | 跳过生成步骤 | `--skip api`（仅生成页面）|
| `--help` | 显示帮助 | |

### 生成的文件

以 `--module order --title "订单管理"` 为例：

```
apps/web-ele/src/
├── api/modules/order/
│   └── index.ts              ← API 接口（page / save / update / delete）
│
├── views/order/
│   └── index.vue             ← 列表页面
│
└── router/routes/modules/order.ts   ← 路由注册
```

### 生成后操作

**1. 修改 API 接口路径**

打开 `api/modules/order/index.ts`，将 `'/order/page'` 等路径改为实际后端接口：

```typescript
// 改为你的实际接口
return requestClient.get('/api/order/page', { params: query });
```

**2. 注册路由**

方式一：在 Vben Admin 后台 **系统管理 → 菜单管理** 中新增菜单，指向 `/order/list`

方式二：手动在路由文件中注册（已在 `order.ts` 中生成）

**3. 重启前端**

```bash
pnpm dev:web-ele
```

### 常用 Lucide 图标

| 场景 | 图标 |
|------|------|
| 订单 | `lucide:file-text` |
| 商品 | `lucide:shopping-bag` |
| 用户 | `lucide:users` |
| 仪表盘 | `lucide:layout-dashboard` |
| 设置 | `lucide:settings` |
| 文件 | `lucide:folder` |
| 报表 | `lucide:bar-chart-2` |
| 客户 | `lucide:user-check` |
| 权限 | `lucide:shield` |

### 跳过生成

```bash
# 只生成 API
node scripts/gen-module.cjs --module order --title "订单管理" --skip page,route

# 只生成页面
node scripts/gen-module.cjs --module order --title "订单管理" --skip api
```
