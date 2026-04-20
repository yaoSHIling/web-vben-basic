import type { RouteRecordRaw } from 'vue-router';

/**
 * 工作流模块路由
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/workflow',
    name: 'Workflow',
    meta: { title: '工作流管理', icon: 'lucide:git-branch', order: 20 },
    children: [
      {
        name: 'WorkflowDesigner',
        path: '/workflow/designer',
        component: () => import('#/views/workflow/designer/index.vue'),
        meta: { title: '工作流设计器' },
      },
      {
        name: 'WorkflowDesignerEdit',
        path: '/workflow/designer/:id',
        component: () => import('#/views/workflow/designer/index.vue'),
        meta: { title: '编辑工作流', hide: true },
      },
      {
        name: 'WorkflowMyTasks',
        path: '/workflow/my',
        component: () => import('#/views/workflow/instance/index.vue'),
        meta: { title: '我的审批' },
      },
    ],
  },
];

export default routes;
