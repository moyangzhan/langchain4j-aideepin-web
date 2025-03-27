<script setup lang="ts">
import { NIcon, NInput, NInputNumber, NSelect, NTooltip } from 'naive-ui'
import { QuestionCircle16Regular } from '@vicons/fluent'
import NodePropertyInput from '../NodePropertyInput.vue'
import ReferComment from '../ReferComment.vue'
import { googleCountryOptions, googleLanguageOptions } from '@/utils/constant'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
}
const props = defineProps<Props>()
const nodeConfig = props.wfNode.nodeConfig as Workflow.NodeConfigGoogleSearch
</script>

<template>
  <div class="flex flex-col w-full">
    <NodePropertyInput :workflow="workflow" :wf-node="wfNode" />
    <div class="mt-6">
      <div class="text-xl mb-1">
        查询内容
        <NTooltip trigger="hover">
          <template #trigger>
            <NIcon style="padding-top: 0.1rem">
              <QuestionCircle16Regular />
            </NIcon>
          </template>
          <div>为空则表示使用上一个节点的输出做为查询内容</div>
        </NTooltip>
      </div>
      <div class="flex flex-col">
        <ReferComment />
        <NInput v-model:value="nodeConfig.query" type="textarea" :autosize="{ minRows: 3, maxRows: 10 }" />
      </div>
    </div>
    <div class="mt-6">
      <div class="text-xl mb-1">
        提取数量
      </div>
      <div>
        <NInputNumber v-model:value="nodeConfig.top_n" :min="1" :max="30" />
      </div>
    </div>
    <div class="mt-6">
      <div class="text-xl mb-1">
        国家和地区
      </div>
      <div>
        <NSelect v-model:value="nodeConfig.country" :options="googleCountryOptions" />
      </div>
    </div>
    <div class="mt-6">
      <div class="text-xl mb-1">
        语言
      </div>
      <div>
        <NSelect v-model:value="nodeConfig.language" :options="googleLanguageOptions" />
      </div>
    </div>
  </div>
</template>
