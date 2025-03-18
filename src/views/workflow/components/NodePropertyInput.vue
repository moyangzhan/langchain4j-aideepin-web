<script setup lang="ts">
import { generate } from 'random-words'
import { NButton, NCollapse, NCollapseItem, NInput, NList, NListItem } from 'naive-ui'
import { v4 as uuidv4 } from 'uuid'
import WfVariableSelector from './WfVariableSelector.vue'
import { SvgIcon } from '@/components/common'
import { useWfStore } from '@/store'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
}
const props = defineProps<Props>()
const wfStore = useWfStore()
function onAdd() {
  const oneNode = wfStore.getOneNode(props.workflow.uuid)
  let nodeUuid = ''
  let nodeParamaName = ''
  if (oneNode && oneNode.wfComponent.name === 'Start' && oneNode.inputConfig.user_inputs.length > 0) {
    nodeUuid = oneNode.uuid
    nodeParamaName = oneNode.inputConfig.user_inputs[0].name
  }

  wfStore.addRefInputToNode(props.workflow.uuid, props.wfNode.uuid, {
    uuid: uuidv4().replace(/-/g, ''),
    name: `var_${generate({ minLength: 1, maxLength: 20 })}` as string,
    node_param_name: nodeParamaName,
    node_uuid: nodeUuid,
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
            <NInput v-model:value="refInput.name" maxlength="50" show-count class="mr-2 max-w-8 h-full" />
            <WfVariableSelector
              :workflow="workflow" :wf-node="wfNode" :wf-ref-var="refInput"
              :exclude-nodes="[props.wfNode.uuid]" class="mr-2 h-full max-w-8"
              style="max-width: 250px;" @variable-selected="onVariableSelected(refInput, $event)"
            />
            <SvgIcon
              class="text-3xl min-w-5 mr-0.5 h-full cursor-pointer" icon="ep:remove" style="min-width:16px"
              @click="onDelete(refInput)"
            />
          </div>
        </NListItem>
      </NList>
    </NCollapseItem>
  </NCollapse>
  <br>
  <NButton dashed @click="onAdd">
    +新增变量
  </NButton>
</template>
