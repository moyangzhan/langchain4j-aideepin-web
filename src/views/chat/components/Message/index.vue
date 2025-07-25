<script setup lang='ts'>
import { computed, h, ref } from 'vue'
import { NButton, NDropdown, NEmpty, NIcon, NImage, NSpace, NSpin, useDialog } from 'naive-ui'
import type { ImageRenderToolbarProps } from 'naive-ui'
import { Delete24Regular } from '@vicons/fluent'
import { Reload } from '@vicons/ionicons5'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
import { copyText } from '@/utils/format'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore } from '@/store'
import { getRealFileUrl } from '@/utils/functions'

import NoPic from '@/assets/no_pic.png'

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
})
const emit = defineEmits<Emit>()
const dialog = useDialog()
const authStore = useAuthStore()
const token = ref<string>(authStore.token)

interface Props {
  dateTime?: string
  text?: string
  imageUrls?: string[]
  inversion?: boolean
  regenerate?: boolean
  showAvatar?: boolean
  error?: boolean
  loading?: boolean
  type: string // text,text-image,image

  aiModelPlatform?: string // openai,dashscope,qianfan,ollama,deepseek
}

interface Emit {
  (ev: 'regenerate'): void
  (ev: 'delete'): void
  (ev: 'delOneImage', fileUrl: string): void
}

const { isMobile } = useBasicLayout()

const { iconRender } = useIconRender()

const textRef = ref<HTMLElement>()

const asRawText = ref(props.inversion)

const messageRef = ref<HTMLElement>()

const options = computed(() => {
  const common = [
    {
      label: t('chat.copy'),
      key: 'copyText',
      icon: iconRender({ icon: 'ri:file-copy-2-line' }),
    },
    {
      label: t('common.delete'),
      key: 'delete',
      icon: iconRender({ icon: 'ri:delete-bin-line' }),
    },
  ]

  if (!props.inversion) {
    common.unshift({
      label: asRawText.value ? t('chat.preview') : t('chat.showRawText'),
      key: 'toggleRenderType',
      icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }),
    })
  }

  return common
})

function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType') {
  switch (key) {
    case 'copyText':
      copyText({ text: props.text ?? '' })
      return
    case 'toggleRenderType':
      asRawText.value = !asRawText.value
      return
    case 'delete':
      emit('delete')
  }
}

function handleRegenerate() {
  messageRef.value?.scrollIntoView()
  emit('regenerate')
}

function handleDelImage(imageUrl: string) {
  dialog.warning({
    title: '删除图片确认',
    content: '只删除该图片，不删除对应的提示图',
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      emit('delOneImage', imageUrl)
    },
  })
}
function renderToolbarOut2(imageUrl: string) {
  return ({ nodes }: ImageRenderToolbarProps) => {
    return [
      ...Object.values(nodes),
      h(
        NButton,
        {
          quaternary: true,
          circle: true,
          color: 'white',
          onClick: () => {
            handleDelImage(imageUrl)
          },
        },
        {
          icon: () => h(Delete24Regular),
        },
      ),
    ]
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
      <AvatarComponent :name="inversion ? 'user' : aiModelPlatform" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
        {{ dateTime }}
      </p>
      <div class="flex items-start gap-1 mt-2" :class="[inversion ? 'flex-row-reverse' : 'flex-row']">
        <!-- 消息框侧边下拉选择列表 -->
        <template v-if="type === 'text' || type === 'text-image'">
          <TextComponent
            ref="textRef" :inversion="inversion" :error="error" :text="text" :loading="loading"
            :as-raw-text="asRawText"
          />
          <div class="flex flex-col">
            <button
              v-if="regenerate"
              class="mb-2 transition text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-300"
              @click="handleRegenerate"
            >
              <SvgIcon icon="ri:restart-line" />
            </button>
            <NDropdown
              :trigger="isMobile ? 'click' : 'hover'" :placement="!inversion ? 'right' : 'left'"
              :options="options" @select="handleSelect"
            >
              <button class="transition text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
                <SvgIcon icon="ri:more-2-fill" />
              </button>
            </NDropdown>
          </div>
        </template>
      </div>
      <NSpace class="mt-1" :style="inversion ? 'justify-content:flex-end;' : ''">
        <!-- render image -->
        <template v-if="type === 'image' || type === 'text-image'">
          <template v-if="loading">
            <NSpin size="medium">
              <template #icon>
                <NIcon>
                  <Reload />
                </NIcon>
              </template>
            </NSpin>
          </template>
          <template v-else>
            <template v-if="!imageUrls || imageUrls.length === 0">
              <NEmpty description="找不到图片" />
            </template>
            <template v-if="imageUrls && imageUrls.length > 0">
              <!-- <NImageGroup :render-toolbar="renderToolbar"> -->
              <NSpace>
                <template v-for="imageUrl in imageUrls" :key="imageUrl">
                  <NImage
                    v-if="imageUrl" width="100" :src="`${getRealFileUrl(imageUrl)}?token=${token}`"
                    :fallback-src="NoPic" :render-toolbar="renderToolbarOut2(imageUrl)"
                  />
                </template>
              </NSpace>
              <!-- </NImageGroup> -->
            </template>
          </template>
        </template>
      </NSpace>
      <slot />
    </div>
  </div>
</template>
