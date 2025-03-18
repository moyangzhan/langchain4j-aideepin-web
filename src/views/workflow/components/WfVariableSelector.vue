<script setup lang="ts">
import { h, ref } from 'vue'
import { NSelect } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { SelectGroupOption, SelectOption } from 'naive-ui'
import { emptyWorkflowInfo } from '@/utils/functions'
import { getIconByComponentName, getIconClassByComponentName } from '@/utils/workflow-util'
import { SvgIcon } from '@/components/common'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
  wfRefVar: Workflow.NodeIORefDinition
  excludeNodes: string[]
}
const props = withDefaults(defineProps<Props>(), {
  workflow: () => emptyWorkflowInfo(),
})

const emit = defineEmits<Emit>()

interface Emit {
  (e: 'variableSelected', nodeUuidParanmName: string[]): void
}

const selectedVar = ref<string>('')

const userInputGroup = {
  type: 'group',
  label: '用户的输入',
  key: 'userInput',
  children: [] as Array<{ label: string; value: string }>,
}

const componentOutputGroup = {
  type: 'group',
  label: '节点的输出',
  key: 'componentOutput',
  children: [] as Array<{ label: string; value: string }>,
}

function renderDropdownLabel(option: SelectOption): VNodeChild {
  if (option.type === 'group')
    return option.label as string
  const val = option.value as string
  const nodeUuid = val.split('::')[0]
  const componentName = props.workflow.nodes.find(item => item.uuid === nodeUuid)?.wfComponent.name || ''
  return [
    h('div', { class: 'flex items-center' }, {
      default: () => [h(
        SvgIcon,
        {
          icon: getIconByComponentName(componentName),
          class: getIconClassByComponentName(componentName),
          imageSize: 20,
        },
      ),
      h(
        'div',
        {
          class: 'ml-1.5',
        },
        { default: () => option.label as string },
      ),
      ],
    }),
  ]
}

const options: Array<SelectOption | SelectGroupOption> = [userInputGroup, componentOutputGroup]
const nodes = props.workflow.nodes
for (let i = 0; i < nodes.length; i++) {
  const node = nodes[i]
  if (props.excludeNodes.includes(node.uuid) || node.wfComponent.name === 'End')
    continue

  const inputConfig = node.inputConfig
  if (node.wfComponent.name === 'Start') {
    for (let j = 0; j < inputConfig.user_inputs.length; j++) {
      userInputGroup.children.push({
        label: inputConfig.user_inputs[j].title,
        value: `${node.uuid}::${inputConfig.user_inputs[j].name}`,
      })
    }
  } else {
    componentOutputGroup.children.push({
      label: node.title,
      value: `${node.uuid}::output`,
    })
  }
}
console.log('options', options)
selectedVar.value = `${props.wfRefVar.node_uuid}::${props.wfRefVar.node_param_name}`
console.log('selectedVar.value', selectedVar.value)

function handleSelect(value: string) {
  const vs = value.split('::')
  emit('variableSelected', vs)
}
</script>

<template>
  <NSelect
    v-model:value="selectedVar" placement="top-start" trigger="click" :show-arrow="true"
    :render-label="renderDropdownLabel" :options="options" :consistent-menu-width="false" @update:value="handleSelect"
  />
</template>
