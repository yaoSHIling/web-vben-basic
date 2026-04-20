// =====================================================================
// API 模块模板
//
// 使用方式：复制此文件到 api/modules/{your-module}/index.ts
// 然后修改接口路径和类型定义
// =====================================================================

import type { PageResult, PageParams } from '#/types';
import { requestClient } from '#/api/request';

// ===== 1. 定义类型命名空间 =====

export namespace {Module}Api {

  // 实体类型（对应数据库表）
  export interface Entity {
    id: number;
    name: string;
    status: number;
    remark?: string;
    createdTime: string;
  }

  // 分页查询参数
  export interface PageQuery extends PageParams {
    name?: string;
    status?: number;
    startTime?: string;
    endTime?: string;
  }

  // 新增 DTO
  export interface SaveDTO {
    name: string;
    status: number;
    remark?: string;
  }

  // 更新 DTO
  export interface UpdateDTO extends SaveDTO {
    id: number;
  }
}

// ===== 2. 定义 API 方法 =====

/**
 * 分页查询
 * 后端接口：GET /{module}/page
 */
export async function page{Module}Api(query: {Module}Api.PageQuery) {
  return requestClient.get<PageResult<{Module}Api.Entity>>(
    '/{module}/page',
    { params: query }
  );
}

/**
 * 根据ID查询
 * 后端接口：GET /{module}/{id}
 */
export async function getByIdApi(id: number) {
  return requestClient.get<{Module}Api.Entity>(
    `/{module}/${id}`
  );
}

/**
 * 新增
 * 后端接口：POST /{module}
 */
export async function saveApi(data: {Module}Api.SaveDTO) {
  return requestClient.post<number>(
    '/{module}',
    data
  );
}

/**
 * 修改
 * 后端接口：PUT /{module}/{id}
 */
export async function updateApi(id: number, data: {Module}Api.SaveDTO) {
  return requestClient.put(
    `/{module}/${id}`,
    data
  );
}

/**
 * 删除
 * 后端接口：DELETE /{module}/{id}
 */
export async function deleteApi(id: number) {
  return requestClient.delete(`/{module}/${id}`);
}
