<script setup lang="ts">
import { NInput } from 'naive-ui'
import NodePropertyInput from '../NodePropertyInput.vue'
import WfLLMSelector from '../WfLLMSelector.vue'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
}

const props = defineProps<Props>()
const nodeConfig = props.wfNode.nodeConfig as Workflow.NodeConfigAnswer

function llmSelected(modelName: string) {
  console.log('nodeConfig.modelName', nodeConfig.model_name, modelName)
  nodeConfig.model_name = modelName
}
</script>

<template>
  <div class="flex flex-col w-full">
    <!-- <div>welcome word</div> -->
    <NodePropertyInput :workflow="workflow" :wf-node="wfNode" />
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
        提示词
      </div>
      <div>
        <NInput v-model:value="nodeConfig.prompt" type="textarea" :autosize="{ minRows: 3, maxRows: 10 }" />
      </div>
    </div>
  </div>
</template>
