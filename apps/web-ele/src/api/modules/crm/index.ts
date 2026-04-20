import type { PageResult, PageParams } from '#/types';
import { requestClient } from '#/api/request';

export namespace CrmApi {
  // ===================== 枚举 =====================

  /** 客户状态 */
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

  /** 客户来源 */
  export const CustomerSource = {
    OFFICIAL: '官网',        // 官网
    EXHIBITION: '展会',      // 展会
    REFERRAL: '转介绍',      // 转介绍
    OUTBOUND: '电话拓展',    // 电话拓展
    OTHER: '其他',           // 其他
  } as const;

  /** 跟进方式 */
  export const FollowupType = {
    PHONE: 1,   // 电话
    VISIT: 2,   // 上门拜访
    WECHAT: 3,  // 微信
    EMAIL: 4,   // 邮件
    OTHER: 5,   // 其他
  } as const;

  /** 任务状态 */
  export const TaskStatus = {
    PENDING: 0,   // 待办
    DONE: 1,      // 已完成
    OVERDUE: 2,   // 已逾期
  } as const;

  /** 任务优先级 */
  export const TaskPriority = {
    HIGH: 1,    // 高
    MEDIUM: 2,  // 中
    LOW: 3,     // 低
  } as const;

  // ===================== 类型 =====================

  /** 客户实体 */
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

  /** 客户分页查询 */
  export interface CustomerPageQuery extends PageParams {
    name?: string;
    level?: number;
    status?: number;
    assigneeId?: number;
  }

  /** 客户保存 DTO */
  export interface CustomerSaveDTO {
    id?: number;
    name: string;
    mobile?: string;
    company?: string;
    industry?: string;
    source?: string;
    level?: number;
    assigneeId?: number;
    remark?: string;
  }

  /** 跟进记录 */
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

  /** 跟进保存 DTO */
  export interface FollowupSaveDTO {
    customerId: number;
    followupType: number;
    content: string;
    nextPlan?: string;
    nextFollowupAt?: string;
  }

  /** 跟进任务 */
  export interface FollowupTask {
    id: number;
    customerId: number;
    taskType?: string;
    title: string;
    content?: string;
    dueAt: string;
    status: number;
    priority: number;
    assigneeId: number;
    completedAt?: string;
    createdTime: string;
  }

  /** 任务分页查询 */
  export interface TaskPageQuery extends PageParams {
    customerId?: number;
    assigneeId?: number;
    status?: number;
    priority?: number;
  }

  /** 任务保存 DTO */
  export interface TaskSaveDTO {
    id?: number;
    customerId: number;
    taskType?: string;
    title: string;
    content?: string;
    dueAt: string;
    priority?: number;
    assigneeId?: number;
  }

  /** 客户统计 */
  export interface CustomerStats {
    total: number;
    potential: number;
    intent: number;
    deal: number;
    lost: number;
    pendingTask: number;
    overdueTask: number;
  }
}

// ===================== API 方法 =====================

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
  return requestClient.get<CrmApi.CustomerStats>('/crm/customer/stats');
}

/** 跟进记录列表 */
export async function listFollowupsApi(customerId: number) {
  return requestClient.get<CrmApi.Followup[]>(`/crm/followup/list?customerId=${customerId}`);
}

/** 添加跟进记录 */
export async function addFollowupApi(data: CrmApi.FollowupSaveDTO) {
  return requestClient.post<number>('/crm/followup', data);
}

/** 任务分页查询 */
export async function pageTasksApi(query: CrmApi.TaskPageQuery) {
  return requestClient.get<PageResult<CrmApi.FollowupTask>>('/crm/task/page', { params: query });
}

/** 创建跟进任务 */
export async function createTaskApi(data: CrmApi.TaskSaveDTO) {
  return requestClient.post<number>('/crm/task', data);
}

/** 完成任务 */
export async function completeTaskApi(id: number) {
  return requestClient.post(`/crm/task/${id}/complete`);
}

/** 我的待办列表 */
export async function pendingTasksApi() {
  return requestClient.get<CrmApi.FollowupTask[]>('/crm/task/pending');
}
