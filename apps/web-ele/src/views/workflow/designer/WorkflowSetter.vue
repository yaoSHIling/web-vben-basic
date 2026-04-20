<template>
  <div class="wf-setter" v-if="node">
    <div class="wf-setter__header">
      <span class="wf-setter__title">
        <span class="wf-setter__icon">{{ nodeIcons[node.type] }}</span>
        {{ node.data?.name || node.id }}
      </span>
      <el-tag size="small" :type="tagType(node.type)">{{ node.type }}</el-tag>
      <el-button link class="wf-setter__close" @click="$emit('update:node', null)">
        <icon-x />
      </el-button>
    </div>

    <div class="wf-setter__body">
      <!-- ========== 通用：节点名称 ========== -->
      <div class="wf-setter__section">
        <div class="wf-setter__section-title">基本信息</div>
        <el-form label-width="80" size="small">
          <el-form-item label="节点名称" required>
            <el-input v-model="node.data.name" placeholder="如：部门主管审批" @change="emit('update')" />
          </el-form-item>
          <el-form-item label="节点ID">
            <el-input :value="node.id" disabled />
          </el-form-item>
        </el-form>
      </div>

      <!-- ========== LLM 节点 ========== -->
      <template v-if="node.type === 'llm'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">大模型配置</div>
          <el-form label-width="80" size="small">
            <el-form-item label="模型">
              <el-select v-model="node.data.model" placeholder="选择模型" @change="emit('update')">
                <el-option label="MiniMax-M* (默认)" value="MiniMax-M*" />
                <el-option label="GPT-4o" value="gpt-4o" />
                <el-option label="Claude-3.5" value="claude-3.5-sonnet" />
                <el-option label="DeepSeek-V3" value="deepseek-v3" />
              </el-select>
            </el-form-item>
            <el-form-item label="系统提示">
              <el-input v-model="node.data.systemPrompt" type="textarea" :rows="3"
                placeholder="你是一个专业的助手..." @change="emit('update')" />
            </el-form-item>
            <el-form-item label="提示词模板">
              <el-input v-model="node.data.prompt" type="textarea" :rows="4"
                placeholder="{{ user_input }}，请帮我..." @change="emit('update')" />
              <div class="wf-setter__hint">使用 {{ variable }} 引用变量</div>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Code 节点 ========== -->
      <template v-if="node.type === 'code'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">代码配置</div>
          <el-form label-width="80" size="small">
            <el-form-item label="语言">
              <el-radio-group v-model="node.data.language" @change="emit('update')">
                <el-radio label="javascript">JavaScript</el-radio>
                <el-radio label="python">Python</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="代码">
              <el-input v-model="node.data.code" type="textarea" :rows="8" monospace
                placeholder="// 输入变量可直接使用&#10;// 将输出写入 _output&#10;_output.result = input * 2;"
                style="font-family: Consolas, monospace; font-size: 12px;"
                @change="emit('update')" />
              <div class="wf-setter__hint">使用 _output.xxx = value 输出结果</div>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Condition 节点 ========== -->
      <template v-if="node.type === 'condition'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">条件分支</div>
          <div v-for="(branch, idx) in (node.data.branches || [])" :key="idx" class="wf-branch">
            <div class="wf-branch__header">
              <el-input v-model="branch.name" placeholder="分支名称" size="small"
                style="width: 100px;" @change="emit('update')" />
              <el-button link type="danger" size="small" @click="removeBranch(idx)">
                <icon-delete />
              </el-button>
            </div>
            <el-input v-model="branch.conditionExpr" placeholder="条件表达式，如：amount > 1000"
              size="small" class="mb-1" @change="emit('update')" />
            <el-input v-model="branch.targetNodeId" placeholder="目标节点ID" size="small"
              @change="emit('update')" />
          </div>
          <el-button size="small" class="mt-2" @click="addBranch">
            <icon-plus /> 添加分支
          </el-button>

          <el-divider />
          <div class="wf-branch">
            <div class="wf-branch__header">
              <span class="text-sm text-gray-500">默认分支</span>
            </div>
            <el-input v-model="node.data.defaultBranch.targetNodeId"
              placeholder="条件都不满足时，跳转到..." size="small" @change="emit('update')" />
          </div>
        </div>
      </template>

      <!-- ========== Approval 节点 ========== -->
      <template v-if="node.type === 'approval'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">审批配置</div>
          <el-form label-width="90" size="small">
            <el-form-item label="审批人类型">
              <el-radio-group v-model="node.data.assigneeType" @change="emit('update')">
                <el-radio :label="1">指定人员</el-radio>
                <el-radio :label="2">角色</el-radio>
                <el-radio :label="3">发起人自选</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="node.data.assigneeType === 1" label="指定人员">
              <el-input v-model="node.data.assigneeExpr" placeholder="格式：user:123"
                @change="emit('update')" />
            </el-form-item>
            <el-form-item v-if="node.data.assigneeType === 2" label="角色">
              <el-input v-model="node.data.assigneeExpr" placeholder="格式：role:manager"
                @change="emit('update')" />
            </el-form-item>
            <el-form-item label="标题模板">
              <el-input v-model="node.data.titleTemplate"
                placeholder="{{ name }} - 申请" @change="emit('update')" />
            </el-form-item>
            <el-form-item label="内容模板">
              <el-input v-model="node.data.contentTemplate" type="textarea" :rows="3"
                placeholder="申请人：{{ name }}" @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== HTTP 节点 ========== -->
      <template v-if="node.type === 'http'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">HTTP 请求</div>
          <el-form label-width="70" size="small">
            <el-form-item label="URL">
              <el-input v-model="node.data.url" placeholder="https://api.example.com/..."
                @change="emit('update')" />
            </el-form-item>
            <el-form-item label="方法">
              <el-select v-model="node.data.method" @change="emit('update')">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </el-form-item>
            <el-form-item label="Body">
              <el-input v-model="node.data.bodyStr" type="textarea" :rows="3" monospace
                placeholder='{"key": "{{ value }}"}' @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Variable 节点 ========== -->
      <template v-if="node.type === 'variable'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">变量操作</div>
          <el-form label-width="80" size="small">
            <el-form-item label="变量名">
              <el-input v-model="node.data.variableName" placeholder="如：amount"
                @change="emit('update')" />
            </el-form-item>
            <el-form-item label="变量类型">
              <el-select v-model="node.data.variableType" @change="emit('update')">
                <el-option label="String" value="String" />
                <el-option label="Number" value="Number" />
                <el-option label="Boolean" value="Boolean" />
                <el-option label="Object" value="Object" />
                <el-option label="Array" value="Array" />
              </el-select>
            </el-form-item>
            <el-form-item label="变量值">
              <el-input v-model="node.data.variableValue" placeholder="直接值或 {{ xxx }}"
                @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Loop 节点 ========== -->
      <template v-if="node.type === 'loop'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">循环配置</div>
          <el-form label-width="80" size="small">
            <el-form-item label="循环类型">
              <el-radio-group v-model="node.data.loopType" @change="emit('update')">
                <el-radio label="for">固定次数</el-radio>
                <el-radio label="while">条件循环</el-radio>
                <el-radio label="forEach">遍历数组</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="循环次数">
              <el-input-number v-model="node.data.loopTimes" :min="1" :max="1000"
                @change="emit('update')" />
            </el-form-item>
            <el-form-item label="最大次数">
              <el-input-number v-model="node.data.maxLoopTimes" :min="1" :max="10000"
                @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Message 节点 ========== -->
      <template v-if="node.type === 'message'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">消息配置</div>
          <el-form label-width="80" size="small">
            <el-form-item label="渠道">
              <el-select v-model="node.data.channel" @change="emit('update')">
                <el-option label="微信" value="weixin" />
                <el-option label="邮件" value="email" />
                <el-option label="钉钉" value="dingtalk" />
                <el-option label="企业微信" value="wecom" />
                <el-option label="Server酱" value="serverchan" />
                <el-option label="Webhook" value="webhook" />
              </el-select>
            </el-form-item>
            <el-form-item label="接收人">
              <el-input v-model="node.data.toUser" placeholder="用户ID/邮箱/手机" @change="emit('update')" />
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="node.data.title" placeholder="通知标题" @change="emit('update')" />
            </el-form-item>
            <el-form-item label="内容">
              <el-input v-model="node.data.content" type="textarea" :rows="3"
                placeholder="{{ name }}，您好..." @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Database 节点 ========== -->
      <template v-if="node.type === 'database'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">数据库操作</div>
          <el-form label-width="70" size="small">
            <el-form-item label="SQL类型">
              <el-radio-group v-model="node.data.isSelect" @change="emit('update')">
                <el-radio :label="true">查询 (SELECT)</el-radio>
                <el-radio :label="false">执行 (INSERT/UPDATE/DELETE)</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="SQL">
              <el-input v-model="node.data.sql" type="textarea" :rows="4" monospace
                placeholder="SELECT * FROM table WHERE id = {{ id }}"
                @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- ========== Subflow / HTTP / 其他 ========== -->
      <template v-if="node.type === 'subflow'">
        <div class="wf-setter__section">
          <div class="wf-setter__section-title">子流程</div>
          <el-form label-width="80" size="small">
            <el-form-item label="子流程编码">
              <el-input v-model="node.data.subflowCode" placeholder="子流程 code"
                @change="emit('update')" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <!-- 删除节点 -->
      <div class="wf-setter__footer">
        <el-button type="danger" plain size="small" @click="emit('delete', node.id)">
          <icon-delete /> 删除节点
        </el-button>
      </div>
    </div>
  </div>

  <!-- 空状态 -->
  <div v-else class="wf-setter wf-setter--empty">
    <div class="wf-setter__empty-hint">
      <span class="text-2xl">\ud83d\udca1</span>
      <p>点击节点查看配置</p>
    </div>
    <el-divider />
    <div class="wf-setter__node-guide">
      <p class="wf-setter__guide-title">节点类型说明</p>
      <div v-for="(desc, type) in nodeDescriptions" :key="type" class="wf-setter__guide-item">
        <span class="wf-setter__guide-icon">{{ nodeIcons[type] }}</span>
        <div>
          <b>{{ type }}</b>: {{ desc }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="WorkflowSetter">
import { ElMessageBox } from 'element-plus';

interface WfNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

const props = defineProps<{ node: WfNode | null }>();
const emit = defineEmits<{
  (e: 'update'): void;
  (e: 'update:node', val: WfNode | null): void;
  (e: 'delete', nodeId: string): void;
}>();

const nodeIcons: Record<string, string> = {
  start: '\ud83d\udd28', end: '\u2705', llm: '\ud83e\udde0', code: '\ud83d\udcbb',
  condition: '\ud83d\udd22', approval: '\ud83d\udcbc', http: '\ud83d\udcce',
  variable: '\u2699\ufe0f', loop: '\ud83d\udd01', subflow: '\ud83d\udcda',
  message: '\ud83d\udce7', database: '\ud83d\udcbe',
};

const tagType = (type: string) => ({
  start: 'success', end: 'danger', llm: 'purple', code: 'primary',
  condition: 'warning', approval: 'pink', http: 'cyan', variable: 'info',
  loop: 'orange', subflow: 'blue', message: 'default', database: 'green',
}[type] || 'default');

const nodeDescriptions: Record<string, string> = {
  start: '流程入口，定义输入参数',
  end: '流程结束，返回输出结果',
  llm: '调用大模型（AI对话/生成）',
  code: '执行自定义脚本代码',
  condition: '按条件表达式分流',
  approval: '等待人工审批',
  http: '发送 HTTP 请求',
  variable: '读取/设置变量',
  loop: '循环执行（for/while）',
  subflow: '调用其他工作流',
  message: '发送通知（微信/邮件等）',
  database: '执行 SQL 数据库操作',
};

function addBranch() {
  if (!props.node) return;
  if (!props.node.data.branches) props.node.data.branches = [];
  props.node.data.branches.push({
    id: `branch_${Date.now()}`,
    name: `分支${props.node.data.branches.length + 1}`,
    conditionExpr: '',
    targetNodeId: '',
  });
  emit('update');
}

function removeBranch(idx: number) {
  if (!props.node) return;
  props.node.data.branches.splice(idx, 1);
  emit('update');
}
</script>

<style scoped>
.wf-setter {
  width: 300px;
  height: 100%;
  background: white;
  border-left: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.wf-setter--empty {
  justify-content: center;
  align-items: center;
  padding: 24px;
  text-align: center;
}

.wf-setter__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-weight: 500;
}

.wf-setter__title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.wf-setter__icon { font-size: 16px; }

.wf-setter__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.wf-setter__section {
  margin-bottom: 20px;
}

.wf-setter__section-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}

.wf-setter__hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.wf-branch {
  padding: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  margin-bottom: 8px;
}

.wf-branch__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.wf-setter__footer {
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-light);
  text-align: center;
}

.wf-setter__empty-hint {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}
.wf-setter__empty-hint p { margin-top: 8px; font-size: 14px; }

.wf-setter__guide-title {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  text-align: left;
}

.wf-setter__guide-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 8px;
  text-align: left;
}

.wf-setter__guide-icon { font-size: 14px; flex-shrink: 0; }
</style>
