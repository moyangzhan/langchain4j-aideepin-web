<script setup lang="ts">
import { NIcon, NInput, NSelect, NTooltip } from 'naive-ui'
import { QuestionCircle16Regular } from '@vicons/fluent'
import NodePropertyInput from '../NodePropertyInput.vue'
import ReferComment from '../ReferComment.vue'
import { dalle3QualityOptions, dalle3SizeOptions } from '@/utils/constant'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
}
const props = defineProps<Props>()
const nodeConfig = props.wfNode.nodeConfig as Workflow.NodeConfigDalle3
</script>

<template>
  <div class="flex flex-col w-full">
    <NodePropertyInput :workflow="workflow" :wf-node="wfNode" />
    <div class="mt-6">
      <div class="text-xl mb-1">
        提示词
        <NTooltip trigger="hover">
          <template #trigger>
            <NIcon style="padding-top: 0.1rem">
              <QuestionCircle16Regular />
            </NIcon>
          </template>
          <div>为空则表示使用上一个节点的输出做为提示词</div>
        </NTooltip>
      </div>
      <div class="flex flex-col">
        <ReferComment />
        <NInput v-model:value="nodeConfig.prompt" type="textarea" :autosize="{ minRows: 3, maxRows: 10 }" />
      </div>
    </div>
    <div class="mt-6">
      <div class="text-xl mb-1">
        图像大小
      </div>
      <div>
        <NSelect v-model:value="nodeConfig.size" :options="dalle3SizeOptions" />
      </div>
    </div>
    <div class="mt-6">
      <div class="text-xl mb-1">
        图像质量
      </div>
      <div>
        <NSelect v-model:value="nodeConfig.quality" :options="dalle3QualityOptions" />
      </div>
    </div>
  </div>
</template>
