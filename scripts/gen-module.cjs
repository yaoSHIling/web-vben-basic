#!/usr/bin/env node
/**
 * web-vben-basic 脚手架生成器
 * 
 * 一键生成完整的 CRUD 模块，包含：
 *   - API 层（api/modules/{module}/index.ts）
 *   - 页面层（views/{module}/index.vue）
 *   - 路由注册（router/routes/modules/{module}.ts）
 * 
 * 使用方式：
 *   node scripts/gen-module.js                           # 交互式
 *   node scripts/gen-module.js --module order          # 指定模块名
 *   node scripts/gen-module.js --module order --title "订单管理"  # 完整参数
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ===== 配置 =====
const ROOT = path.resolve(__dirname, '..');

// ===== 颜色输出 =====
const C = { r: '\x1b[0m', b: '\x1b[1m', g: '\x1b[32m', y: '\x1b[33m', bl: '\x1b[34m', re: '\x1b[31m', c: '\x1b[36m' };
const log = (msg, c = C.r) => console.log(`${c}${msg}${C.r}`);
const ok = (msg) => log(`  ✅ ${msg}`, C.g);
const inf = (msg) => log(`  ℹ ${msg}`, C.bl);
const wr = (msg) => log(`  ⚠ ${msg}`, C.y);
const er = (msg) => log(`  ❌ ${msg}`, C.re);

// ===== 工具函数 =====

function toPascal(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toCamel(str) {
  const p = toPascal(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filepath, content) {
  if (fs.existsSync(filepath)) {
    wr(`跳过（已存在）：${path.relative(ROOT, filepath)}`);
    return false;
  }
  fs.writeFileSync(filepath, content, 'utf-8');
  ok(`+ ${path.relative(ROOT, filepath)}`);
  return true;
}

function tpl(template, vars) {
  let result = template;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
  }
  return result;
}

// ===== 文件生成 =====

function generateApi(module, v) {
  const apiDir = path.join(ROOT, `apps/web-ele/src/api/modules/${module}`);
  ensureDir(apiDir);
  const code = `import type { PageResult, PageParams } from '#/types';
import { requestClient } from '#/api/request';

export namespace {{Module}}Api {
  export interface Entity {
    id: number;
    name: string;
    status: number;
    remark?: string;
    createdTime: string;
  }

  export interface PageQuery extends PageParams {
    name?: string;
    status?: number;
  }

  export interface SaveDTO {
    id?: number;
    name: string;
    status: number;
    remark?: string;
  }
}

// 分页查询
export async function page{{Module}}Api(query: {{Module}}Api.PageQuery) {
  return requestClient.get<PageResult<{{Module}}Api.Entity>>(
    '/{{module}}/page',
    { params: query }
  );
}

// 根据ID查询
export async function getByIdApi(id: number) {
  return requestClient.get<{{Module}}Api.Entity>(\`/{{module}}/\${id}\`);
}

// 新增
export async function saveApi(data: {{Module}}Api.SaveDTO) {
  return requestClient.post<number>('/{{module}}', data);
}

// 修改
export async function updateApi(id: number, data: {{Module}}Api.SaveDTO) {
  return requestClient.put(\`/{{module}}/\${id}\`, data);
}

// 删除
export async function deleteApi(id: number) {
  return requestClient.delete(\`/{{module}}/\${id}\`);
}
`;
  writeFile(path.join(apiDir, 'index.ts'), tpl(code, v));
}

function generatePage(module, v) {
  const pageDir = path.join(ROOT, `apps/web-ele/src/views/${module}`);
  ensureDir(pageDir);

  const code = `<template>
  <div>
    <!-- 搜索栏 -->
    <el-form inline :model="queryParams" label-width="80" class="mb-4">
      <el-form-item label="名称">
        <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="全部" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <icon-search class="mr-1" />搜索
        </el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <div class="mb-4">
      <el-button type="primary" @click="handleAdd">
        <icon-plus class="mr-1" />新增
      </el-button>
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
      <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      <el-table-column prop="createdTime" label="创建时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @pagination="loadData"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
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
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="备注信息" />
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
  page{{Module}}Api,
  saveApi,
  updateApi,
  deleteApi,
  type {{Module}}Api,
} from '#/api/modules/{{module}}';

definePage({ meta: { title: '{{title}}' } });

// ======== 数据 ========
const loading = ref(false);
const total = ref(0);
const tableData = ref<{{Module}}Api.Entity[]>([]);

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  status: undefined as number | undefined,
});

// ======== 弹窗 ========
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const formData = reactive<{{Module}}Api.SaveDTO>({
  id: undefined,
  name: '',
  status: 1,
  remark: '',
});

const formRules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
};

// ======== 加载数据 ========
async function loadData() {
  loading.value = true;
  try {
    const res = await page{{Module}}Api(queryParams);
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.page = 1;
  loadData();
}

function resetQuery() {
  queryParams.name = '';
  queryParams.status = undefined;
  queryParams.page = 1;
  loadData();
}

// ======== 增删改 ========
function handleAdd() {
  isEdit.value = false;
  dialogTitle.value = '新增{{title}}';
  Object.assign(formData, { id: undefined, name: '', status: 1, remark: '' });
  dialogVisible.value = true;
}

function handleEdit(row: {{Module}}Api.Entity) {
  isEdit.value = true;
  dialogTitle.value = '编辑{{title}}';
  Object.assign(formData, { id: row.id, name: row.name, status: row.status, remark: row.remark || '' });
  dialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateApi(formData.id!, formData);
      ElMessage.success('修改成功');
    } else {
      await saveApi(formData);
      ElMessage.success('新增成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch {
    ElMessage.error('操作失败，请稍后重试');
  } finally {
    submitLoading.value = false;
  }
}

async function handleDelete(row: {{Module}}Api.Entity) {
  await ElMessageBox.confirm(\`确定删除"\$\{row.name\}"吗？\`, '删除确认', { type: 'warning' });
  await deleteApi(row.id);
  ElMessage.success('删除成功');
  loadData();
}

onMounted(loadData);
</script>
`;
  writeFile(path.join(pageDir, 'index.vue'), tpl(code, v));
}

function generateRoute(module, v) {
  const code = `import type { RouteRecordRaw } from 'vue-router';

/**
 * {{title}} 路由配置
 * 访问路径：/{{module}}/list
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/{{module}}',
    name: '{{PascalModule}}',
    meta: {
      icon: '{{icon}}',
      title: '{{title}}',
      order: 10,
    },
    children: [
      {
        name: '{{PascalModule}}List',
        path: '/{{module}}/list',
        component: () => import('#/views/{{module}}/index.vue'),
        meta: {
          title: '{{title}}',
          icon: '{{icon}}',
        },
      },
    ],
  },
];

export default routes;
`;
  writeFile(path.join(ROOT, `apps/web-ele/src/router/routes/modules/${module}.ts`), tpl(code, v));
}

// ===== 主函数 =====

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function main() {
  console.log();
  log('╔══════════════════════════════════════════════╗', C.c);
  log('║   web-vben-basic  模块生成器 v1.0            ║', C.c);
  log('║   快速生成 CRUD 模块（API + 页面 + 路由）    ║', C.c);
  log('╚══════════════════════════════════════════════╝', C.c);
  console.log();

  const args = process.argv.slice(2);
  let module = '';
  let title = '';
  let icon = 'lucide:box';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--module' && args[i + 1]) module = args[i + 1];
    if (args[i] === '--title' && args[i + 1]) title = args[i + 1];
    if (args[i] === '--icon' && args[i + 1]) icon = args[i + 1];
    if (args[i] === '--help') {
      console.log(`
用法: node scripts/gen-module.js [选项]

选项:
  --module <name>     模块名称（英文，kebab-case）必填
  --title <text>     菜单标题（中文）默认：PascalCase 模块名
  --icon <lucide>    菜单图标，默认：lucide:box
  --skip <items>     跳过生成步骤，如：api,page,route
  --help             显示帮助

示例:
  node scripts/gen-module.js --module order --title "订单管理"
  node scripts/gen-module.js --module product --title "商品管理" --icon lucide:shopping-bag
      `);
      process.exit(0);
    }
  }

  if (!module) {
    module = await prompt('请输入模块名称（英文，kebab-case，如 order）：');
  }
  if (!module) {
    er('模块名称不能为空');
    process.exit(1);
  }
  if (!title) {
    const d = toPascal(module);
    const a = await prompt('请输入菜单标题（中文）[' + d + ']：');
    title = a || d;
  }
  if (!title) title = toPascal(module);

  const PascalModule = toPascal(module);

  const skipSet = new Set();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skip' && args[i + 1]) {
      args[i + 1].split(',').forEach(s => skipSet.add(s.trim()));
    }
  }

  console.log();
  log('📦 模块信息：', C.b);
  inf(`  模块名：${module}`);
  inf(`  Pascal名：${PascalModule}`);
  inf(`  标题：${title}`);
  inf(`  图标：${icon}`);
  console.log();

  wr('⚠️  生成前请确保后端已实现以下接口：');
  console.log();
  console.log(`  GET    /${module}/page     — 分页查询`);
  console.log(`  GET    /${module}/{id}     — 根据ID查询`);
  console.log(`  POST   /${module}          — 新增`);
  console.log(`  PUT    /${module}/{id}    — 修改`);
  console.log(`  DELETE /${module}/{id}    — 删除`);
  console.log();

  const confirm = await prompt('确认生成？（y/n）[y]：');
  if (confirm && confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    inf('已取消');
    process.exit(0);
  }

  const v = { module, PascalModule, title, icon };

  console.log();
  log('📝 开始生成文件...\n', C.b);

  if (!skipSet.has('api')) { log('API 层：', C.b); generateApi(module, v); }
  if (!skipSet.has('page')) { log('页面层：', C.b); generatePage(module, v); }
  if (!skipSet.has('route')) { log('路由层：', C.b); generateRoute(module, v); }

  console.log();
  log(`✅ 模块 [${title}] 生成完成！\n`, C.g);
  log('📋 下一步：', C.b);
  console.log('   1. 修改 API 接口路径，对接后端接口');
  console.log('   2. 在 Vben Admin 后台菜单管理中添加路由，或手动注册');
  console.log('   3. 重启前端：pnpm dev:web-ele');
  console.log();
}

main().catch((err) => { er(err.message); process.exit(1); });
