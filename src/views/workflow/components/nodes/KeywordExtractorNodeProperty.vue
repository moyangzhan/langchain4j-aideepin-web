<script setup lang="ts">
import { NInputNumber } from 'naive-ui'
import NodePropertyInput from '../NodePropertyInput.vue'
import WfLLMSelector from '../WfLLMSelector.vue'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
}

const props = defineProps<Props>()
const nodeConfig = props.wfNode.nodeConfig as Workflow.NodeConfigKeywordExtractor

function llmSelected(modelName: string) {
  console.log('nodeConfig.modelName', nodeConfig.model_name, modelName)
  nodeConfig.model_name = modelName
}
</script>

<template>
  <div class="flex flex-col w-full">
    <!-- <div>welcome word</div> -->
    <NodePropertyInput :workflow="workflow" :wf-node="wfNode" :show-var-name="false" />
    <div class="mt-6">
      <div class="text-xl mb-1">
        模型
      </div>
      <div>
        <WfLLMSelector :model-name="nodeConfig.model_name" @llm-selected="llmSelected" />
      </div>
    </div>
    <div class="mt-6">
      <div class="text-xl mb-1">
        关键词数量
      </div>
      <div>
        <NInputNumber v-model:value="nodeConfig.top_n" :min="1" :max="30" />
      </div>
    </div>
  </div>
</template>
