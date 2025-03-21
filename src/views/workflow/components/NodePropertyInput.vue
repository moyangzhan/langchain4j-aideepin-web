<script setup lang="ts">
import { computed } from 'vue'
import { generate } from 'random-words'
import { NButton, NCollapse, NCollapseItem, NInput, NList, NListItem, useMessage } from 'naive-ui'
import { v4 as uuidv4 } from 'uuid'
import WfVariableSelector from './WfVariableSelector.vue'
import { SvgIcon } from '@/components/common'
import { useWfStore } from '@/store'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
  limit?: number
  showVarName?: boolean
  onlyShowStartNode?: boolean
  whiteListUserInputTypes?: number[]
}
const props = withDefaults(defineProps<Props>(), {
  limit: 50,
  showVarName: true,
  onlyShowStartNode: false,
  whiteListUserInputTypes: () => [],
})
const wfStore = useWfStore()
const ms = useMessage()
const inputsCount = computed(() => {
  return props.wfNode.inputConfig.ref_inputs.length + props.wfNode.inputConfig.user_inputs.length
})
function onAdd() {
  if (inputsCount.value > props.limit) {
    ms.warning(`最多只能添加${props.limit}个输入`)
    return
  }

  const oneNode = wfStore.getStartOrFirstNode(props.workflow.uuid)
  if (!oneNode) {
    console.warn('No node found')
    return
  }
  let nodeParamaName = ''
  if (oneNode.wfComponent.name === 'Start' && oneNode.inputConfig.user_inputs.length > 0) {
    if (props.whiteListUserInputTypes.length > 0) {
      const enableUserInput = oneNode.inputConfig.user_inputs.find(item => props.whiteListUserInputTypes.includes(item.type))
      nodeParamaName = enableUserInput?.name || ''
    } else {
      nodeParamaName = oneNode.inputConfig.user_inputs[0].name
    }
  } else {
    nodeParamaName = 'output'
  }

  wfStore.addRefInputToNode(props.workflow.uuid, props.wfNode.uuid, {
    uuid: uuidv4().replace(/-/g, ''),
    name: `var_${generate({ minLength: 1, maxLength: 20 })}` as string,
    node_param_name: nodeParamaName,
    node_uuid: oneNode.uuid,
  })
}

function onDelete(row: Workflow.NodeIORefDinition) {
  const idx = props.wfNode.inputConfig.ref_inputs.findIndex(item => item.uuid === row.uuid)
  wfStore.deleteRefInput(props.workflow.uuid, props.wfNode.uuid, idx)
}

function onVariableSelected(wfInput: Workflow.NodeIORefDinition, nodeUuidParamName: string[]) {
  wfInput.node_uuid = nodeUuidParamName[0]
  wfInput.node_param_name = nodeUuidParamName[1]
}
</script>

<template>
  <NCollapse :default-expanded-names="['1']">
    <NCollapseItem title="输入" name="1" class="text-lg border border-gray-200 rounded-md m-2 px-3 pb-3">
      <template #header>
        <div class="text-xl">
          输入
        </div>
      </template>
      <NList>
        <NListItem v-for="refInput in wfNode.inputConfig.ref_inputs" :key="refInput.uuid" class="h-12">
          <div class="flex items-center justify-start">
            <NInput
              v-show="showVarName" v-model:value="refInput.name" maxlength="50" show-count
              class="mr-2 max-w-8 h-full" style="max-width:200px"
            />
            <WfVariableSelector
              :workflow="workflow" :wf-node="wfNode" :wf-ref-var="refInput"
              :white-list-components="onlyShowStartNode ? ['Start'] : []"
              :white-list-user-input-types="whiteListUserInputTypes" :exclude-nodes="[props.wfNode.uuid]"
              class="mr-2 h-full flex-1" @variable-selected="onVariableSelected(refInput, $event)"
            />
            <SvgIcon
              class="text-3xl mr-0.5 h-full cursor-pointer" icon="ep:remove" style="width:16px"
              @click="onDelete(refInput)"
            />
          </div>
        </NListItem>
      </NList>
    </NCollapseItem>
  </NCollapse>
  <br>
  <NButton v-if="inputsCount < props.limit" dashed @click="onAdd">
    +新增变量
  </NButton>
</template>
