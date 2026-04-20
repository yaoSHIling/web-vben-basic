import type { PageResult, PageParams } from '#/types';
import { requestClient } from '#/api/request';

export namespace WorkflowApi {

  // ===== 工作流定义 =====
  export interface WfDefinition {
    id: number;
    name: string;
    code: string;
    description?: string;
    version: number;
    status: number;
    formCode?: string;
    config?: WfDefinitionConfig;
    createdBy: number;
    createdTime: string;
  }

  // ===== 流程配置 =====
  export interface WfDefinitionConfig {
    nodes:WfNode[];
    edges: WfEdge[];
  }

  export interface WfNode {
    id: string;
    type: 'start' | 'approver' | 'condition' | 'end' | 'auto';
    data: WfNodeData;
    x?: number;
    y?: number;
  }

  export interface WfNodeData {
    name: string;
    assigneeType?: number;   // 1=指定人 2=角色 3=发起人自选
    assigneeExpr?: string;   // user:123 / role:manager / ${initiator}
    sequence?: number;
    conditions?: WfCondition[];
    defaultNodeId?: string;
  }

  export interface WfCondition {
    expr: string;      // 条件表达式：amount > 1000
    targetNodeId: string;
    label?: string;
  }

  export interface WfEdge {
    source: string;
    target: string;
    conditionExpr?: string;
    label?: string;
  }

  // ===== 工作流实例 =====
  export interface WfInstance {
    id: number;
    definitionId: number;
    definitionCode: string;
    businessId?: string;
    businessType?: string;
    title: string;
    status: number;
    formData?: any;
    currentNodeId?: string;
    initiatorId: number;
    startedAt: string;
    finishedAt?: string;
  }

  // ===== 审批任务 =====
  export interface WfTask {
    id: number;
    instanceId: number;
    nodeId: string;
    nodeName: string;
    assigneeId: number;
    assigneeName: string;
    assigneeType: number;
    assigneeExpr?: string;
    status: number;
    opinion?: string;
    action?: string;
    operatedAt?: string;
    operatorId?: number;
    sequence: number;
    createdTime: string;
  }

  // ===== 审批历史 =====
  export interface WfTaskHistory {
    id: number;
    taskId?: number;
    instanceId: number;
    nodeId: string;
    nodeName: string;
    operatorId: number;
    operatorName: string;
    action: string;
    opinion?: string;
    operatedAt: string;
  }
}

// ===== API 方法 =====

// --- 定义管理 ---
export function pageDefinitionsApi(params: any) {
  return requestClient.get<PageResult<WorkflowApi.WfDefinition>>(
    '/workflow/definition/page',
    { params }
  );
}

export function getDefinitionApi(id: number) {
  return requestClient.get<WorkflowApi.WfDefinition>(`/workflow/definition/${id}`);
}

export function saveDefinitionApi(data: any) {
  return requestClient.post<number>('/workflow/definition', data);
}

export function publishDefinitionApi(id: number) {
  return requestClient.post(`/workflow/definition/${id}/publish`);
}

export function disableDefinitionApi(id: number) {
  return requestClient.post(`/workflow/definition/${id}/disable`);
}

// --- 流程操作 ---
export function submitWorkflowApi(data: {
  definitionCode: string;
  businessId?: string;
  businessType?: string;
  title: string;
  formData?: any;
  assigneeId?: number;
}) {
  return requestClient.post<number>('/workflow/submit', data);
}

export function approveTaskApi(data: {
  taskId: number;
  action: 'agree' | 'reject' | 'transfer';
  opinion?: string;
  transferTo?: number;
}) {
  return requestClient.post('/workflow/task/approve', data);
}

export function revokeWorkflowApi(data: { instanceId: number; opinion?: string }) {
  return requestClient.post('/workflow/instance/revoke', data);
}

// --- 查询 ---
export function myTasksApi(params: any) {
  return requestClient.get<PageResult<WorkflowApi.WfTask>>(
    '/workflow/task/my',
    { params }
  );
}

export function myInstancesApi(params: any) {
  return requestClient.get<PageResult<WorkflowApi.WfInstance>>(
    '/workflow/instance/my',
    { params }
  );
}

export function getInstanceApi(id: number) {
  return requestClient.get<WorkflowApi.WfInstance>(`/workflow/instance/${id}`);
}

export function getInstanceHistoryApi(id: number) {
  return requestClient.get<WorkflowApi.WfTaskHistory[]>(
    `/workflow/instance/${id}/history`
  );
}
