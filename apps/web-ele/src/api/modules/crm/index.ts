import type { PageResult, PageParams } from '#/types';
import { requestClient } from '#/api/request';

export namespace CrmApi {
  /** 客户状态枚举 */
  export const CustomerStatus = {
    POTENTIAL: 1,  // 潜在
    INTENT: 2,     // 意向
    DEAL: 3,       // 成交
    LOST: 4,       // 流失
  } as const;

  /** 客户等级 */
  export const CustomerLevel = {
    KEY: 1,        // 重点
    IMPORTANT: 2,  // 重要
    NORMAL: 3,     // 普通
  } as const;

  /** 跟进方式 */
  export const FollowupType = {
    PHONE: 1,   // 电话
    VISIT: 2,   // 上门拜访
    WECHAT: 3,  // 微信
    EMAIL: 4,   // 邮件
    OTHER: 5,   // 其他
  } as const;

  // ===== 客户相关 =====

  export interface Customer {
    id: number;
    name: string;
    mobile?: string;
    company?: string;
    industry?: string;
    source?: string;
    level: number;
    status: number;
    assigneeId?: number;
    lastFollowupAt?: string;
    nextFollowupAt?: string;
    remark?: string;
    createdTime: string;
  }

  export interface CustomerPageQuery extends PageParams {
    name?: string;
    level?: number;
    status?: number;
    assigneeId?: number;
  }

  export interface CustomerSaveDTO {
    name: string;
    mobile?: string;
    company?: string;
    industry?: string;
    source?: string;
    level?: number;
    assigneeId?: number;
    remark?: string;
  }

  // ===== 跟进记录 =====

  export interface Followup {
    id: number;
    customerId: number;
    followupType: number;
    content: string;
    nextPlan?: string;
    nextFollowupAt?: string;
    createdBy: number;
    createdTime: string;
  }

  export interface FollowupSaveDTO {
    customerId: number;
    followupType: number;
    content: string;
    nextPlan?: string;
    nextFollowupAt?: string;
  }

  // ===== 跟进任务 =====

  export interface FollowupTask {
    id: number;
    customerId: number;
    taskType: string;
    title: string;
    content?: string;
    dueAt: string;
    status: number;
    priority: number;
    assigneeId: number;
    completedAt?: string;
    createdTime: string;
  }

  export interface TaskPageQuery extends PageParams {
    customerId?: number;
    assigneeId?: number;
    status?: number;
    priority?: number;
  }

  export interface TaskSaveDTO {
    customerId: number;
    taskType?: string;
    title: string;
    content?: string;
    dueAt: string;
    priority?: number;
    assigneeId?: number;
  }
}

/** 客户分页查询 */
export async function pageCustomersApi(query: CrmApi.CustomerPageQuery) {
  return requestClient.get<PageResult<CrmApi.Customer>>('/crm/customer/page', { params: query });
}

/** 获取客户详情 */
export async function getCustomerApi(id: number) {
  return requestClient.get<CrmApi.Customer>(`/crm/customer/${id}`);
}

/** 新增客户 */
export async function saveCustomerApi(data: CrmApi.CustomerSaveDTO) {
  return requestClient.post<number>('/crm/customer', data);
}

/** 修改客户 */
export async function updateCustomerApi(id: number, data: CrmApi.CustomerSaveDTO) {
  return requestClient.put(`/crm/customer/${id}`, data);
}

/** 删除客户 */
export async function deleteCustomerApi(id: number) {
  return requestClient.delete(`/crm/customer/${id}`);
}

/** 客户统计 */
export async function customerStatsApi() {
  return requestClient.get<any>('/crm/customer/stats');
}

/** 添加跟进记录 */
export async function addFollowupApi(data: CrmApi.FollowupSaveDTO) {
  return requestClient.post<number>('/crm/followup', data);
}

/** 跟进记录列表 */
export async function listFollowupsApi(customerId: number) {
  return requestClient.get<CrmApi.Followup[]>('/crm/followup/list', {
    params: { customerId },
  });
}

/** 创建跟进任务 */
export async function createTaskApi(data: CrmApi.TaskSaveDTO) {
  return requestClient.post<number>('/crm/task', data);
}

/** 完成任务 */
export async function completeTaskApi(id: number) {
  return requestClient.post(`/crm/task/${id}/complete`);
}

/** 我的待办任务列表 */
export async function pendingTasksApi() {
  return requestClient.get<CrmApi.FollowupTask[]>('/crm/task/pending');
}

/** 任务分页查询 */
export async function pageTasksApi(query: CrmApi.TaskPageQuery) {
  return requestClient.get<PageResult<CrmApi.FollowupTask>>('/crm/task/page', { params: query });
}
