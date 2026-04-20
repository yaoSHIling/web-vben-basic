import type { RouteRecordRaw } from 'vue-router';

/**
 * CRM 模块路由
 *
 * 对应后端接口的前缀：/api/crm/*
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/crm',
    name: 'Crm',
    meta: {
      title: '客户管理',
      icon: 'lucide:users',
      order: 10,
    },
    children: [
      {
        name: 'CrmCustomer',
        path: '/crm/customer',
        component: () => import('#/views/crm/customer.vue'),
        meta: {
          title: '客户管理',
          icon: 'lucide:users',
        },
      },
      {
        name: 'CrmTask',
        path: '/crm/task',
        component: () => import('#/views/crm/task.vue'),
        meta: {
          title: '跟进任务',
          icon: 'lucide:check-square',
        },
      },
    ],
  },
];

export default routes;
