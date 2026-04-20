# 代码模板库

本目录包含可直接复制使用的代码模板。

## 目录结构

```
_templates/
├── api-module/      # API 层模板
│   └── index.ts   # TypeScript API 模块模板
└── page-module/   # 页面模板
    ├── README.md
    └── index.vue  # 标准 CRUD 页面模板
```

## 快速使用

### API 模块

复制到你的模块目录：

```bash
cp _templates/api-module/index.ts apps/web-ele/src/api/modules/{module}/index.ts
```

然后修改：
- `{Module}` → PascalCase 模块名（如 `Order`）
- `{module}` → kebab-case 模块名（如 `order`）

### 页面模块

```bash
cp _templates/page-module/index.vue apps/web-ele/src/views/{module}/index.vue
```

然后修改 API 引用和字段配置。

## 推荐开发流程

```
1. 用生成器生成骨架
   node scripts/gen-module.cjs --module order --title "订单管理"

2. 修改 API 接口
   apps/web-ele/src/api/modules/order/index.ts
   → 将 /placeholder 改为实际后端接口路径

3. 修改页面逻辑
   apps/web-ele/src/views/order/index.vue
   → 修改表格列、搜索栏、弹窗表单

4. 注册菜单
   → 在 Vben Admin 后台菜单管理中添加
```

## 脚手架生成器

使用 `scripts/gen-module.cjs` 一键生成模块，比手动复制模板更快：

```bash
node scripts/gen-module.cjs --module order --title "订单管理"
```
