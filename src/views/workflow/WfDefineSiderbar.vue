<script lang="ts" setup>
import { useWfStore } from '@/store'
import { SvgIcon } from '@/components/common'
import { getIconByComponentName, getIconClassByComponentName } from '@/utils/workflow-util'
const wfStore = useWfStore()

// TODO
const todoComponents = ['Google', 'Draw', 'DocumentExtractor', 'KeywordExtractor', 'KnowledgeRetrieval']

function onDragStart(event: DragEvent, nodeType: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <aside>
    <div class="flex flex-col w-full">
      <template v-for="component in wfStore.wfComponents" :key="component.uuid">
        <div
          v-if="component.isEnable && !todoComponents.includes(component.name)"
          class="flex mt-2 border border-gray-200 cursor-grab text-base h-10 pl-1.5 rounded" :draggable="true"
          @dragstart="(event: DragEvent) => onDragStart(event, component.name)"
        >
          <SvgIcon
            class="mt-3 mr-2" :class="getIconClassByComponentName(component.name)"
            :icon="getIconByComponentName(component.name)"
          />
          <div class="leading-10">
            {{ component.title }}
          </div>
        </div>
        <!-- <div v-else>
        {{ component.title }}
      </div> -->
      </template>
      <!-- todo -->
      <div class="w-full text-center leading-10">
        --- 以下为待接入组件 ---
      </div>
      <template v-for="component in wfStore.wfComponents" :key="component.uuid">
        <div
          v-if="todoComponents.includes(component.name)"
          class="flex mt-2 border border-gray-200 text-base h-10 pl-1.5 rounded"
        >
          <SvgIcon
            class="mt-3 mr-2" :class="getIconClassByComponentName(component.name)"
            :icon="getIconByComponentName(component.name)"
          />
          <div class="leading-10">
            {{ component.title }}
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>
