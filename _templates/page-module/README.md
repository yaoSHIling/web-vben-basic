# 页面模板

此目录包含标准 CRUD 页面的参考模板文件。

## 快速使用

复制 `index.vue` 到你的模块目录，然后修改：

```bash
cp _templates/page-module/index.vue apps/web-ele/src/views/{your-module}/index.vue
```

## 模板结构

```
_template/page-module/
├── README.md      ← 本文件
└── index.vue     ← 标准 CRUD 页面模板
```

## 模板包含的功能

| 功能 | 说明 |
|------|------|
| 搜索栏 | 名称/状态筛选，支持重置 |
| 工具栏 | 新增按钮 |
| 数据表格 | stripe 表格 + loading |
| 分页 | el-pagination 自动同步 |
| 弹窗 | 新增/编辑共用一个弹窗 |
| 表单校验 | el-form rules |
| 删除确认 | ElMessageBox.confirm |
| 错误处理 | ElMessage.error 自动提示 |

## 修改指南

1. **替换 API 引用**
   ```typescript
   // 改为你的 API
   import { pageXxxApi, saveApi, updateApi, deleteApi } from '#/api/modules/your-module';
   import type { XxxApi } from '#/api/modules/your-module';
   ```

2. **修改搜索栏字段**
   - 对应 `queryParams` 中的字段
   - 添加/删除 `el-form-item`

3. **修改表格列**
   - 替换 `el-table-column` 中的 `prop` 和 `label`

4. **修改弹窗表单**
   - 对应 `formData` 中的字段
   - 添加/删除 `el-form-item`
