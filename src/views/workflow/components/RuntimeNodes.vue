<script lang="ts" setup>
import { computed } from 'vue'
import { SvgIcon } from '@/components/common'
import { getIconByComponentName, getIconClassByComponentName } from '@/utils/workflow-util'
import { useWfStore } from '@/store'

interface Props {
  nodes: Workflow.WfRuntimeNode[]
  workflow: Workflow.WorkflowInfo
}
const props = defineProps<Props>()
const wfStore = useWfStore()
const prologue = computed(() => {
  const startNode = wfStore.getStartNodeByWfId(props.workflow.id)
  return (startNode?.nodeConfig as Workflow.NodeConfigStart).prologue || ''
})
</script>

<template>
  <div>
    <div v-show="nodes.length === 0" class="text-center py-2 text-neutral-400">
      无内容
    </div>
    <div v-show="prologue" class="p-2">
      {{ prologue }}
    </div>
    <div
      v-for="node in nodes" :key="node.uuid"
      class="flex flex-col space-y-2 border border-gray-200 p-2 m-2 rounded-md" :title="node.nodeTitle"
      :name="node.uuid"
    >
      <div class="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-md">
        <SvgIcon
          v-if="node.wfComponent" class="text-base" :class="getIconClassByComponentName(node.wfComponent.name)"
          :icon="getIconByComponentName(node.wfComponent.name)"
        />
        <div class="text-base">
          {{ node.nodeTitle || '找不到节点标题' }}
        </div>
      </div>
      <div class="flex flex-col space-y-2">
        <div class="text-base border-b border-gray-200 py-1">
          输入
        </div>
        <div v-for="(content, name) in node.input" :key="`input_${name}`" class="flex">
          <div class="min-w-24">
            {{ name }}
          </div>
          <div>
            {{ content.value || '无内容' }}
          </div>
        </div>
        <div class="text-base border-b border-gray-200 py-1">
          输出
        </div>
        <div v-for="(content, name) in node.output" :key="`onput_${name}`" class="flex">
          <div class="min-w-24">
            {{ name }}
          </div>
          <div>
            {{ content.value || '无内容' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
