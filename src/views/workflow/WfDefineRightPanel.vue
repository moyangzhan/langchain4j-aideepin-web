<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { NInput } from 'naive-ui'
import { AnswerNodeProperty, ClassifierNodeProperty, EndNodeProperty, StartNodeProperty, SwticherNodeProperty, TemplateNodeProperty } from './components/nodes'
import { useWfStore } from '@/store'
import { SvgIcon } from '@/components/common'
import { getIconByComponentName, getIconClassByComponentName } from '@/utils/workflow-util'
import { emptyWorkflowNode } from '@/utils/functions'

interface Props {
  workflow: Workflow.WorkflowInfo
  uiWorkflow: Workflow.UIWorkflow
  hidePropertyPanel: boolean
  wfNode?: Workflow.WorkflowNode
}

const props = withDefaults(defineProps<Props>(), {
  hidePropertyPanel: false,
  wfNode: () => emptyWorkflowNode(),
})

const wfStore = useWfStore()
const nodeTitle = ref<string>(props.wfNode.title)

watch(
  () => props.wfNode,
  (newVal) => {
    if (newVal)
      nodeTitle.value = newVal.title
  },
  { immediate: true, deep: true },
)
watch(
  () => nodeTitle,
  (newVal) => {
    if (newVal)
      wfStore.updateWfNodeTitle(props.workflow.uuid, props.wfNode.uuid, newVal.value)
  },
  { immediate: true, deep: true },
)
const innerHeight = window.innerHeight < 800 ? 800 : window.innerHeight
onMounted(() => {
  console.log('props.wfNode.title', props.wfNode.title)
  nodeTitle.value = props.wfNode.title
})
</script>

<template>
  <div class="absolute right-0 top-20 bg-white rounded-lg shadow-xl">
    <!-- 右侧属性面板 -->
    <div v-if="!hidePropertyPanel && wfNode" class="px-3 pt-5 h-full" style="width:600px">
      <div class="w-full flex flex-col border-b divide-gray-400 pb-3 mb-5">
        <div class="text-3xl flex items-center h-10 mb-2">
          <SvgIcon
            class="mt-1 mr-2" :class="getIconClassByComponentName(wfNode.wfComponent.name)"
            :icon="getIconByComponentName(wfNode.wfComponent.name)"
          />
          <NInput
            v-model:value="nodeTitle" placeholder="节点名称" class="h-8 border-gray-100"
            style="font-size: 1rem;line-height: 1.5rem;font-weight: 700;"
          />
        </div>
        <!-- <div class="mb-2">
                    <NInput v-model:value="selectedNode.data.remark" placeholder="该节点功能描述" />
                  </div> -->
        <div class="text-sm text-gray-500">
          组件功能：{{ wfNode.wfComponent.remark }}
        </div>
      </div>
      <div class="overflow-y-auto" :style="`height:${innerHeight - 250}px`">
        <StartNodeProperty
          v-if="wfNode.wfComponent.name === 'Start'" :key="wfNode.uuid" :workflow="workflow"
          :wf-node="wfNode"
        />
        <AnswerNodeProperty
          v-else-if="wfNode.wfComponent.name === 'Answer'" :key="`answer_${wfNode.uuid}`"
          :workflow="workflow" :wf-node="wfNode"
        />
        <ClassifierNodeProperty
          v-else-if="wfNode.wfComponent.name === 'Classifier'" :key="`classifier_${wfNode.uuid}`"
          :workflow="workflow" :ui-workflow="uiWorkflow" :wf-node="wfNode"
        />
        <SwticherNodeProperty
          v-else-if="wfNode.wfComponent.name === 'Switcher'" :key="`switcher_${wfNode.uuid}`"
          :workflow="workflow" :ui-workflow="uiWorkflow" :wf-node="wfNode"
        />
        <TemplateNodeProperty
          v-else-if="wfNode.wfComponent.name === 'Template'" :key="`template_${wfNode.uuid}`"
          :workflow="workflow" :ui-workflow="uiWorkflow" :wf-node="wfNode"
        />
        <EndNodeProperty
          v-else-if="wfNode.wfComponent.name === 'End'" :key="`end_${wfNode.uuid}`"
          :workflow="workflow" :ui-workflow="uiWorkflow" :wf-node="wfNode"
        />
      </div>
    </div>
    <!-- 右侧属性面板 end -->
  </div>
</template>
