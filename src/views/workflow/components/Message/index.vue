<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NDropdown } from 'naive-ui'
import AvatarComponent from '@/views/chat/components/Message/Avatar.vue'
import TextComponent from '@/views/chat/components/Message/Text.vue'
import { SvgIcon } from '@/components/common'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'

interface Props {
  wfRuntime: Workflow.WorkflowRuntime
  ioObject: any
  workflow?: Workflow.WorkflowInfo
  inversion?: boolean
  showAvatar?: boolean
  error?: boolean
  loading?: boolean
}
withDefaults(defineProps<Props>(), {
  showAvatar: true,
})
const emit = defineEmits<Emit>()

interface Emit {
  (ev: 'delete'): void
}
const { iconRender } = useIconRender()
const textRef = ref<HTMLElement>()
const messageRef = ref<HTMLElement>()
const options = computed(() => {
  const common = [
    {
      label: t('common.delete'),
      key: 'delete',
      icon: iconRender({ icon: 'ri:delete-bin-line' }),
    },
  ]
  return common
})

function handleSelect(key: 'copyText' | 'setPublic' | 'setPrivate' | 'delete') {
  switch (key) {
    case 'delete':
      emit('delete')
  }
}
</script>

<template>
  <div ref="messageRef" class="flex w-full mb-6 overflow-hidden" :class="[{ 'flex-row-reverse': inversion }]">
    <div
      v-if="showAvatar"
      class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
      :class="[inversion ? 'ml-2' : 'mr-2']"
    >
      <AvatarComponent :name="inversion ? 'user' : (workflow ? workflow.title : '')" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
        {{ wfRuntime.createTime }}
      </p>
      <div class="flex items-center w-full" :class="[{ 'flex-row-reverse': inversion }]">
        <!-- 1、渲染文字 -->
        <div v-if="Object.keys(ioObject).length === 0" class="flex items-start gap-1 mt-2">
          <TextComponent
            ref="textRef" :inversion="inversion" :error="error" text="无内容" :loading="loading"
            :as-raw-text="true"
          />
        </div>
        <TextComponent
          v-if="Object.keys(ioObject).length === 1" ref="textRef" :inversion="inversion" :error="error"
          :text="`${(Object.entries(ioObject)[0][1] as Workflow.UserInputContent).value}`" :loading="loading"
          :as-raw-text="true"
        />
        <div v-for="(inputContent, propName) in ioObject" v-else :key="`${propName}_${inputContent.title}`">
          <template v-if="(`${propName}`).indexOf('_wf_user_input_title') === -1">
            <div class="flex items-start gap-1 mt-2" :class="[inversion ? 'flex-row-reverse' : 'flex-row']">
              <template v-if="inputContent.type === 1 || inputContent.type === 2 || inputContent.type === 5">
                <TextComponent
                  ref="textRef" :inversion="inversion" :error="error"
                  :text="`##${inputContent.title}\n\r${inputContent.value}`" :loading="loading"
                  :as-raw-text="true"
                />
              </template>
            </div>
          </template>
        </div>
        <!-- 消息框侧边下拉选择列表 -->
        <div v-show="inversion" class="flex flex-col">
          <NDropdown
            trigger="click" :placement="!inversion ? 'right' : 'left'" :options="options"
            @select="handleSelect"
          >
            <button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
              <SvgIcon icon="ri:more-2-fill" />
            </button>
          </NDropdown>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>
