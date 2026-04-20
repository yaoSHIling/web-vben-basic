import type { PageResult } from '#/types';
import { requestClient } from '#/api/request';

export namespace WorkflowApi {

  // ===== 节点类型（与 Coze 对齐）=====
  // start / end / llm / code / condition / approval / http /
  // variable / loop / subflow / message / database

  export interface WfGraph {
    nodes: WfNode[];
    edges: WfEdge[];
  }

  export interface WfNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: WfNodeData;
  }

  export type NodeType =
    | 'start' | 'end'
    | 'llm' | 'code' | 'condition'
    | 'approval' | 'http' | 'variable'
    | 'loop' | 'subflow' | 'message' | 'database';

  export interface WfNodeData {
    name: string;

    // LLM 节点
    model?: string;
    prompt?: string;
    systemPrompt?: string;

    // Code 节点
    language?: 'javascript' | 'python';
    code?: string;

    // Condition 节点
    branches?: WfBranch[];
    defaultBranch?: WfBranch;

    // Approval 节点
    assigneeType?: number;     // 1=指定人 2=角色 3=自选
    assigneeExpr?: string;     // user:123 / role:manager / ${initiator}
    assigneeIds?: string;
    titleTemplate?: string;
    contentTemplate?: string;

    // HTTP 节点
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;

    // Variable 节点
    variableName?: string;
    variableType?: 'String' | 'Number' | 'Boolean' | 'Object' | 'Array';
    variableValue?: any;
    isList?: boolean;

    // Loop 节点
    loopType?: 'for' | 'while' | 'forEach';
    loopTimes?: number;
    loopArray?: string;
    maxLoopTimes?: number;

    // Subflow 节点
    subflowCode?: string;
    subflowInput?: Record<string, any>;

    // Message 节点
    channel?: 'weixin' | 'email' | 'dingtalk' | 'webhook' | 'serverchan';
    toUser?: string;
    title?: string;
    content?: string;

    // Database 节点
    sql?: string;
    datasource?: string;
    isSelect?: boolean;
  }

  export interface WfBranch {
    id: string;
    name: string;
    conditionExpr: string;    // 如：amount > 1000
    targetNodeId: string;
  }

  export interface WfEdge {
    id: string;
    source: string;
    target: string;
    data?: { label?: string };
  }

  // ===== Definition =====
  export interface WfDefinition {
    id: number;
    name: string;
    code: string;
    description?: string;
    version: number;
    status: number;
    graphData?: WfGraph;
    variables?: Record<string, any>;
    createdBy: number;
    createdTime: string;
  }

  // ===== Instance =====
  export interface WfInstance {
    id: number;
    definitionId: number;
    definitionCode: string;
    status: number;
    inputData?: any;
    outputData?: any;
    errorMsg?: string;
    currentNodeId?: string;
    initiatorId: number;
    startedAt: string;
    finishedAt?: string;
  }

  // ===== Instance Log =====
  export interface WfInstanceLog {
    id: number;
    instanceId: number;
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: number;
    inputData?: any;
    outputData?: any;
    errorMsg?: string;
    startedAt: string;
    finishedAt?: string;
    elapsedMs?: number;
  }

  export interface WfTask {
    id: number;
    instanceId: number;
    definitionId?: number;
    definitionCode?: string;
    nodeId: string;
    nodeName: string;
    assigneeType?: number;
    assigneeExpr?: string;
    assigneeId?: number;
    assigneeName?: string;
    title?: string;
    content?: string;
    status: number;
    opinion?: string;
    action?: string;
    operatorId?: number;
    operatorName?: string;
    operatedAt?: string;
    createdTime?: string;
  }
}

// ==================== API 方法 ====================

export const workflowDefinitionApi = {
  page: (params: any) =>
    requestClient.get<PageResult<WorkflowApi.WfDefinition>>('/workflow/definition/page', { params }),

  get: (id: number) =>
    requestClient.get<WorkflowApi.WfDefinition>(`/workflow/definition/${id}`),

  save: (data: any) =>
    requestClient.post<number>('/workflow/definition', data),

  publish: (id: number) =>
    requestClient.post(`/workflow/definition/${id}/publish`),

  disable: (id: number) =>
    requestClient.post(`/workflow/definition/${id}/disable`),

  delete: (id: number) =>
    requestClient.delete(`/workflow/definition/${id}`),
};

export const workflowInstanceApi = {
  trigger: (definitionCode: string, data: any) =>
    requestClient.post<number>(`/workflow/trigger/${definitionCode}`, { data }),

  get: (id: number) =>
    requestClient.get<WorkflowApi.WfInstance>(`/workflow/instance/${id}`),

  logs: (id: number) =>
    requestClient.get<WorkflowApi.WfInstanceLog[]>(`/workflow/instance/${id}/logs`),

  my: (params: any) =>
    requestClient.get<PageResult<WorkflowApi.WfInstance>>('/workflow/instance/my', { params }),
};

export const workflowTaskApi = {
  instance: (instanceId: number) =>
    requestClient.get<WorkflowApi.WfTask[]>(`/workflow/task/instance/${instanceId}`),

  my: (params: any) =>
    requestClient.get<PageResult<WorkflowApi.WfTask>>('/workflow/task/my', { params }),

  approve: (data: {
    instanceId: number;
    taskId: number;
    approved: boolean;
    opinion?: string;
    operatorId?: number;
    operatorName?: string;
  }) => requestClient.post('/workflow/callback/approve', data),
};
