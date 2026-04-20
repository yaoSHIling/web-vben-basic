# Java 后端 + Vue 前端 对接说明

> 本文档详细说明如何将 `web-vben-basic` 前端项目与 `java-backend-basic` 后端项目对接。

---

## 📐 对接架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (web-vben-basic)                   │
│                    Vue3 + Vite + Element Plus                │
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│   │  Login   │───▶│  Router  │───▶│  API Layer (Axios)   │  │
│   └──────────┘    └──────────┘    │  /api/auth/login     │  │
│                                    │  /api/crm/customer   │  │
│                                    └──────────┬───────────┘  │
└──────────────────────────────────────────────┼────────────────┘
                                               │ HTTP (JSON)
                    ┌──────────────────────────┼────────────────┐
                    │                      后端 (java-backend-basic) │
                    │               Spring Boot 3 + MyBatis-Plus    │
                    │                                               │
                    │  ┌────────────────┐  ┌────────────────────┐ │
                    │  │ JwtAuthFilter  │  │ Result统一响应     │ │
                    │  │ (Token验证)    │──▶│ code:0 = 成功     │ │
                    │  └────────────────┘  │ code:>0 = 失败    │ │
                    │                      └────────────────────┘ │
                    │                              │              │
                    │  ┌───────────────────────────┴────────────┐│
                    │  │ Swagger UI  /api/swagger-ui.html       ││
                    │  └─────────────────────────────────────────┘│
                    └──────────────────────────────────────────────┘
                               port: 8080   port: 3000
```

---

## 1. 后端配置检查清单

### 1.1 确保后端运行

```bash
# Docker 启动
cd ../java-backend-basic
docker-compose -f docker/docker-compose.yml up -d

# 验证后端
curl http://localhost:8080/api/swagger-ui.html
```

### 1.2 检查跨域配置

后端 `CorsConfig.java` 应已配置允许前端 localhost:3000 访问：

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("http://localhost:3000");  // 前端地址
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
```

### 1.3 检查响应码

后端 `ResultCode.java` 必须使用 **code: 0** 表示成功：

```java
public enum ResultCode {
    SUCCESS(0, "操作成功"),    // ← 必须是 0
    ...
}
```

前端 `request.ts` 配置：
```typescript
client.addResponseInterceptor(
  defaultResponseInterceptor({
    codeField: 'code',
    dataField: 'data',
    successCode: 0,      // ← 与后端 SUCCESS code 对应
  }),
);
```

---

## 2. 前端配置

### 2.1 环境变量

**开发环境** `.env.development`：
```bash
VITE_APP_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=企业管理系统
```

**生产环境** `.env.production`：
```bash
VITE_APP_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_TITLE=企业管理系统
```

### 2.2 API 路由配置

前端请求基地址：`VITE_APP_API_BASE_URL`

完整请求 URL = `VITE_APP_API_BASE_URL` + `/crm/customer/page`

---

## 3. 核心接口对接

### 3.1 登录接口

**前端** → POST `/api/auth/login`
```typescript
// 请求
{ username: "admin", password: "123456" }

// 后端返回
{
  "code": 0,
  "msg": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

**前端处理**：
```typescript
// request.ts 拦截器自动处理：
// 1. 取出 data.accessToken
// 2. 存入 Pinia accessStore
// 3. 后续请求 Authorization: Bearer {token} 自动注入
```

### 3.2 带 Token 的请求

```typescript
// 所有带 @Login 注解的后端接口，前端自动携带 Token
const res = await pageCustomersApi({ page: 1, pageSize: 10 });

// 等价于：
GET /api/crm/customer/page?page=1&pageSize=10
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 3.3 错误处理

后端返回非 0 码时，前端自动弹出错误：
```json
{
  "code": 40001,
  "msg": "用户名已存在",
  "data": null
}
```
→ 前端弹出 `ElMessage.error("用户名已存在")`

---

## 4. 分页接口规范

### 4.1 请求格式

前端分页参数（Query String）：
```
GET /api/crm/customer/page?page=1&pageSize=10&name=张三&level=1
```

### 4.2 响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      { "id": 1, "name": "张三", "level": 1, ... }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### 4.3 前端分页组件

```vue
<el-pagination
  v-model:page="queryParams.page"
  v-model:page-size="queryParams.pageSize"
  :total="total"
  @pagination="loadData"
/>
```

---

## 5. 新增接口对接流程

以新增"订单管理"为例：

### 5.1 后端接口（参考 java-backend-basic）

```java
@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {

    @GetMapping("/page")
    @Login
    public Result<PageResult<OrderVO>> page(OrderPageQuery query) {
        return Result.success(orderService.page(query));
    }

    @PostMapping
    @Login
    @LogOperation("新增订单")
    public Result<Long> save(@RequestBody @Valid OrderSaveDTO dto) {
        return Result.success(orderService.saveOrder(dto));
    }
}
```

### 5.2 前端 API 层

```typescript
// apps/web-ele/src/api/modules/order/index.ts
export namespace OrderApi {
  export interface Order {
    id: number;
    orderNo: string;
    amount: number;
    status: number;
    createdTime: string;
  }
  export interface OrderSaveDTO {
    productId: number;
    quantity: number;
  }
}

export async function pageOrdersApi(query: any) {
  return requestClient.get<PageResult<OrderApi.Order>>('/order/page', { params: query });
}

export async function saveOrderApi(data: OrderApi.OrderSaveDTO) {
  return requestClient.post<number>('/order', data);
}
```

### 5.3 前端页面

```vue
<!-- apps/web-ele/src/views/order/order.vue -->
<template>
  <div>
    <el-table :data="tableData">
      <el-table-column prop="orderNo" label="订单编号" />
      <el-table-column prop="amount" label="金额" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { pageOrdersApi } from '#/api/modules/order';

const tableData = ref([]);
async function loadData() {
  const res = await pageOrdersApi({ page: 1, pageSize: 10 });
  tableData.value = res.list;
}
loadData();
</script>
```

---

## 6. 常见问题

### Q1: 登录失败，提示 "Token 无效"

**原因**：前端 Token 已过期或未正确存储。

**排查**：
```bash
# 1. 检查后端 JWT 配置
grep JWT_SECRET .env

# 2. 检查前端请求头
curl -v http://localhost:8080/api/user/info \
  -H "Authorization: Bearer your-token"
```

### Q2: 跨域报错

**原因**：后端 CORS 未允许前端地址。

**解决**：在后端 `CorsConfig.java` 中添加：
```java
config.addAllowedOriginPattern("http://localhost:3000");
```

### Q3: 前后端 code 不匹配

**原因**：前端期望 `successCode: 0`，后端返回 `SUCCESS(code=200)`。

**解决**：修改后端 `ResultCode.SUCCESS` 为 `(0, "操作成功")`。

### Q4: 前端请求 404

**排查步骤**：
```bash
# 1. 后端是否启动？
curl http://localhost:8080/api/swagger-ui.html

# 2. 接口路径是否正确？
#    前端：/api/auth/login
#    后端：/api/auth/login（注意 ContextPath = /api）

# 3. 检查环境变量
grep VITE_APP_API_BASE .env.development
```

---

## 7. 环境变量汇总

### 后端（java-backend-basic）

```bash
# .env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=java_backend_basic
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key-at-least-64-chars
JWT_EXPIRATION=604800000

SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
```

### 前端（web-vben-basic）

```bash
# .env.development
VITE_APP_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=企业管理系统

# .env.production
VITE_APP_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_TITLE=企业管理系统
```

---

## 8. 双仓库协作开发

```
your-workspace/
├── java-backend-basic/    # 后端仓库
│   ├── docker-compose.yml
│   └── ...
│
└── web-vben-basic/         # 前端仓库
    ├── .env.development
    ├── apps/web-ele/
    └── ...
```

**开发流程：**
```bash
# 终端1：后端
cd java-backend-basic
mvn spring-boot:run

# 终端2：前端
cd web-vben-basic
pnpm dev:web-ele
```
