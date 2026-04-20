import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/workflow',
    name: 'Workflow',
    meta: { title: '工作流引擎', icon: 'lucide:git-branch', order: 20 },
    children: [
      {
        name: 'WorkflowDesignerNew',
        path: '/workflow/designer',
        component: () => import('#/views/workflow/designer/index.vue'),
        meta: { title: '创建工作流' },
      },
      {
        name: 'WorkflowDesignerEdit',
        path: '/workflow/designer/:id',
        component: () => import('#/views/workflow/designer/index.vue'),
        meta: { title: '编辑工作流', hide: true },
      },
      {
        name: 'WorkflowInstance',
        path: '/workflow/instance',
        component: () => import('#/views/workflow/instance/index.vue'),
        meta: { title: '执行记录' },
      },
    ],
  },
];

export default routes;
