<script lang="ts" setup>
import { ref } from 'vue'
import { NTag } from 'naive-ui'
import { HoverButton, SvgIcon } from '@/components/common'
import { emptyWorkflowInfo } from '@/utils/functions'
import { useAuthStore, useUserStore, useWfStore } from '@/store'

interface Props {
  workflow: Workflow.WorkflowInfo
}
interface Emit {
  (ev: 'showView', type: string): void
}
const props = withDefaults(defineProps<Props>(), {
  workflow: () => emptyWorkflowInfo(),
})
const emit = defineEmits<Emit>()
const wfStore = useWfStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const showViewType = ref<string>('instanceList')
function toogleView() {
  if (!authStore.checkLoginOrShow())
    return
  showViewType.value = showViewType.value === 'instanceList' ? 'workflowDefine' : 'instanceList'
  emit('showView', showViewType.value)
}
function showEditView() {
  if (!authStore.checkLoginOrShow())
    return
  wfStore.setShowCreateView(true, props.workflow.uuid)
}
</script>

<template>
  <header
    class="sticky top-0 left-0 top-0 z-30 border-b dark:border-neutral-800 bg-white/80 dark:bg-black/20 backdrop-blur"
  >
    <div class="relative flex items-center justify-between max-w-screen-xl px-4 m-auto h-10">
      <div class="flex items-center">
        <HoverButton @click="showEditView()">
          <span class="text-xl">
            <SvgIcon class="text-xl" :icon="wfStore.activeWorkflowInfo.userUuid === userStore.userInfo.uuid ? 'carbon:edit' : 'carbon:information'" />
          </span>
        </HoverButton>
        <p class="text-sm">
          {{ workflow?.title ?? '' }}
        </p>
      </div>
      <HoverButton
        placement="left" class="w-[70px]" :tooltip="showViewType === 'instanceList' ? '切换到流程图' : '切换到请求列表'"
        @click="toogleView()"
      >
        <div class="text-xl flex items-center space-x-2">
          <NTag v-if="showViewType === 'instanceList'" round :bordered="false" :style="{ cursor: 'pointer' }">
            工作流
            <template #avatar>
              <SvgIcon class="text-xl" icon="carbon:flow" />
            </template>
          </NTag>
          <NTag v-if="showViewType !== 'instanceList'" round :bordered="false" :style="{ cursor: 'pointer' }">
            请求列表
            <template #avatar>
              <SvgIcon class="text-xl" icon="si:align-left-detailed-line" />
            </template>
          </NTag>
        </div>
      </HoverButton>
    </div>
  </header>
</template>
