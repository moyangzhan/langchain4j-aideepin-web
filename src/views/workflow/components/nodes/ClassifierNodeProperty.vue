<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { generate } from 'random-words'
import { NButton, NCollapse, NCollapseItem, NInput } from 'naive-ui'
import NodeSelector from '../NodeSelector.vue'
import WfLLMSelector from '../WfLLMSelector.vue'
import { createNewEdge, deleteEdgesBySourceHandle, updateEdgeBySourceHandle } from '@/utils/workflow-util'

interface Props {
  workflow: Workflow.WorkflowInfo
  uiWorkflow: Workflow.UIWorkflow
  wfNode: Workflow.WorkflowNode
}

const props = defineProps<Props>()
const nodeConfig = props.wfNode.nodeConfig as Workflow.NodeConfigClassifier

function onLlmSelected(modelName: string) {
  nodeConfig.model_name = modelName
}

function onCategoryTargetSelected(category: Workflow.NodeConfigClassifierCategory, nodeUuid: string) {
  category.target_node_uuid = nodeUuid
  const params = {
    workflow: props.workflow,
    uiWorkflow: props.uiWorkflow,
    source: props.wfNode.uuid,
    sourceHandle: category.category_uuid,
    target: nodeUuid,
  }
  updateEdgeBySourceHandle(params)
}

function onAdd() {
  const uuid = uuidv4().replace(/-/g, '')
  nodeConfig.categories.push({
    category_uuid: uuid,
    category_name: `category_${generate({ minLength: 5, maxLength: 30 })}` as string,
    target_node_uuid: '',
  })
  const params = {
    workflow: props.workflow,
    uiWorkflow: props.uiWorkflow,
    uuid,
    source: props.wfNode.uuid,
    sourceHandle: uuid,
    target: '',
  }
  createNewEdge(params)
}

function onDeleteCategory(category: Workflow.NodeConfigClassifierCategory) {
  const idx = nodeConfig.categories.findIndex(item => item.category_uuid === category.category_uuid)
  if (idx >= 0) {
    deleteEdgesBySourceHandle(props.workflow, props.uiWorkflow, props.wfNode.uuid, category.category_uuid)
    nodeConfig.categories.splice(idx, 1)
  }
}
</script>

<template>
  <div class="flex flex-col w-full">
    <div>
      <div class="text-xl mb-1">
        模型
      </div>
      <div>
        <WfLLMSelector :model-name="nodeConfig.model_name" @llm-selected="onLlmSelected" />
      </div>
    </div>
    <div class="mt-6 flex flex-col">
      <div class="text-xl mb-1">
        类别
      </div>
      <NCollapse :default-expanded-names="['0']">
        <NCollapseItem
          v-for="(category, idx) in nodeConfig.categories" :key="category.category_uuid" :name="`${idx}`"
          class="border border-gray-200 rounded-md m-2"
        >
          <template #header>
            <div class="pl-1">
              分类{{ idx + 1 }}：{{ category.category_name.substring(0, 30) }}
            </div>
          </template>
          <template #header-extra>
            <div v-show="nodeConfig.categories.length > 2" class="p-2 cursor-pointer" @click="onDeleteCategory(category)">
              X
            </div>
          </template>
          <div class="flex flex-col w-full bg-gray-100 px-3">
            <div class="mt-2">
              类别名称
            </div>
            <div class="mb-2">
              <NInput v-model:value="category.category_name" type="textarea" :autosize="{ minRows: 1, maxRows: 3 }" />
            </div>
            <div>下一步</div>
            <div class="mb-3">
              <NodeSelector
                :workflow="props.workflow" :wf-node="props.wfNode" :selected="category.target_node_uuid"
                @node-selected="onCategoryTargetSelected(category, $event)"
              />
            </div>
          </div>
        </NCollapseItem>
      </NCollapse>
    </div>
    <br>
    <NButton dashed @click="onAdd">
      +新增类别
    </NButton>
  </div>
</template>
