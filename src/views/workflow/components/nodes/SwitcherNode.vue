<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import CommonNodeHeader from '../CommonNodeHeader.vue'
import { useWfStore } from '@/store'
import { getInputLabelFromParamName } from '@/utils/workflow-util'

interface WfProps {
  workflow: Workflow.WorkflowInfo
}
interface CombinedProps extends NodeProps, WfProps {}
const props = defineProps<CombinedProps>()
const wfStore = useWfStore()

// 计算所有分支的位置
const branchPositions = computed(() => {
  let y = 40 // 初始值
  const positions = []

  // 添加头部高度
  positions.push(y)
  y += 36

	props.data.nodeConfig.cases.forEach((wfCase: Workflow.NodeConfigSwitcherCase) => {
    positions.push(y) // 分支标题
    y += 36

    wfCase.conditions.forEach((_: Workflow.NodeConfigSwitcherCaseCondition, cidx: number) => {
      positions.push(y) // 条件项
      y += 36

      if (cidx !== wfCase.conditions.length - 1) {
        positions.push(y) // "与"/"或"标签
        y += 12
      }
    })
  })

  positions.push(y) // 保底情况
  return positions
})
</script>

<template>
  <div class="flex flex-col w-full">
    <Handle type="target" :position="Position.Left" />
    <CommonNodeHeader :wf-node="data" :data-yposition="branchPositions[0]" />

    <div class="flex-1 flex-col">
      <!-- 使用索引从 branchPositions 中取对应值 -->
      <div v-for="(wfCase, idx) in data.nodeConfig.cases" :key="wfCase.target_node_uuid" class="flex flex-col">
        <div class="h-8 leading-8 mt-1 px-1 bg-gray-200 rounded-md" :data-yposition="branchPositions[1 + idx * 5]">
          分支情况{{ idx + 1 }}
          <Handle :id="wfCase.uuid" type="source" :position="Position.Right" :style="`top: ${branchPositions[1 + idx * 5]}px`" />
        </div>

        <!-- 条件项 -->
        <div class="flex flex-col items-center">
          <div
            v-for="(condition, cidx) in wfCase.conditions"
            :key="condition.uuid"
            class="flex w-full h-8 mt-1 p-1 bg-gray-100 rounded-md"
            :data-yposition="branchPositions[2 + idx * 5 + cidx * 2]"
          >
						<div class="max-w-24 h-6 leading-6 overflow-hidden text-gray-500 px-1 rounded-md text-xs">
              {{ getInputLabelFromParamName(workflow, condition.node_uuid, condition.node_param_name) }}
            </div>
            <div class="h-6 leading-6 overflow-hidden px-1 text-xs">
              {{ wfStore.getOperatorDesc(condition.operator) }}
            </div>
            <div class="h-6 leading-6 flex-1 overflow-hidden text-gray-500 px-1 rounded-md text-xs">
              {{ condition.value }}
            </div>
            <div
              v-if="cidx !== wfCase.conditions.length - 1"
              class="absolute text-blue-400 text-xs"
              :style="`right:10px;top: ${branchPositions[2 + idx * 5 + cidx * 2] + 12}px`"
            >
              {{ wfCase.operator === 'and' ? '与' : '或' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 保底情况 -->
      <div class="h-8 leading-8 mt-1 px-1 bg-gray-200 rounded-md" :data-yposition="branchPositions[branchPositions.length - 1]">
        保底情况
        <Handle id="default_handle" type="source" :position="Position.Right" :style="`top:${branchPositions[branchPositions.length - 1]}px`" />
      </div>
    </div>
  </div>
</template>
