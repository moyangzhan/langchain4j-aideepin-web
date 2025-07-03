<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NDropdown, useMessage } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { useAuthStore } from '@/store'
import { SvgIcon } from '@/components/common'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import api from '@/api'

const props = withDefaults(defineProps<Props>(), {
  showAvatar: true,
})
const emit = defineEmits<Emit>()

interface Props {
  dateTime?: string
  inversion?: boolean
  showAvatar?: boolean
  error?: boolean
  loading?: boolean
  aiModelPlatform?: string // openai,dashscope,qianfan,ollama,deepseek
  messageUuid: string
  audioPlayState: AudioPlayState
  duration: number // In seconds
}

interface Emit {
  (ev: 'delete'): void
}
const ms = useMessage()
const authStore = useAuthStore()
const { isMobile } = useBasicLayout()
const { iconRender } = useIconRender()
const textRef = ref<HTMLElement>()
const asRawText = ref(props.inversion)
const messageRef = ref<HTMLElement>()
const token = ref<string>(authStore.token)

function playAudio() {
  const audioPlayState = props.audioPlayState
  if (!audioPlayState.audioUrl) {
    ms.warning('音频文件不可用或已被删除')
    return
  }
  if (!audioPlayState.playing) {
    audioPlayState.playDuration = 0
    audioPlayState.playing = true
    playDurationCount()
    if (!audioPlayState.audio) {
      audioPlayState.audio = new Audio(`/api${audioPlayState.audioUrl}?token=${token.value}`)
      audioPlayState.audio.addEventListener('ended', () => {
        console.log('Audio playback finished')
        audioPlayState.playDuration = 0
        audioPlayState.playing = false
        audioPlayState.audio = null
      }, {
        once: true,
      })
    }
    audioPlayState.audio.play().catch((error: any) => {
      console.error('Audio play error:', error)
      audioPlayState.playDuration = 0
      audioPlayState.playing = false
      audioPlayState.audio = null
      ms.error('播放音频失败，请检查浏览器设置或音频文件是否可用')
    })
  } else if (audioPlayState.playing && audioPlayState.audio) {
    audioPlayState.audio.pause()
    audioPlayState.playing = false
  } else if (audioPlayState.playing && !audioPlayState.audio) {
    ms.warning('音频文件不可用或已被删除')
  }
}

function playDurationCount() {
  const audioPlayState = props.audioPlayState
  if (!audioPlayState.playing)
    return
  if (audioPlayState.playDuration + 1 > props.duration)
    return

  audioPlayState.playDuration = audioPlayState.playDuration + 1
  setTimeout(playDurationCount, 1000)
}

const options = computed(() => {
  let txtOrAudio = {
    label: '显示文字',
    key: 'showText',
    icon: iconRender({ icon: 'carbon:text-scale' }),
  }
  if (props.audioPlayState.showText) {
    txtOrAudio = {
      label: '显示音频',
      key: 'showAudio',
      icon: iconRender({ icon: 'lucide:audio-lines' }),
    }
  }
  const common = [
    txtOrAudio,
    {
      label: t('common.delete'),
      key: 'delete',
      icon: iconRender({ icon: 'ri:delete-bin-line' }),
    },
  ]

  return common
})

function handleSelect(key: 'delete' | 'showText' | 'showAudio') {
  const audioPlayState = props.audioPlayState
  switch (key) {
    case 'showText':
      audioPlayState.showText = true
      if (!audioPlayState.text) {
        asRawText.value = false
        api.messageTextByAudio(audioPlayState.audioUuid).then((res) => {
          audioPlayState.text = res.data
        })
      }
      return
    case 'showAudio':
      audioPlayState.showText = false
      return
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
      <AvatarComponent :name="inversion ? 'user' : aiModelPlatform" />
    </div>
    <div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
      <p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
        {{ dateTime }}
      </p>
      <div class="flex items-start gap-1 mt-2" :class="[inversion ? 'flex-row-reverse' : 'flex-row']">
        <TextComponent
          v-if="props.audioPlayState.showText" ref="textRef" :inversion="inversion" :error="error"
          :text="props.audioPlayState.text" :loading="loading" :as-raw-text="asRawText"
        />
        <div
          v-else class="bg bg-[#d2f9d1] rounded-md py-1 px-2 mb-2 cursor-pointer flex items-center"
          @click="playAudio"
        >
          <SvgIcon class="text-2xl cursor-pointer custom-hover mr-2" icon="mingcute:voice-2-line" />
          <span v-if="props.audioPlayState.playDuration" class="text-sm pl-2">{{ props.audioPlayState.playDuration
          }}/{{ duration }}</span>
          <span v-else class="text-sm px-2">{{ duration }}</span>
        </div>
        <!-- 消息框侧边下拉选择列表 -->
        <div class="flex flex-col">
          <NDropdown
            :trigger="isMobile ? 'click' : 'hover'" :placement="!inversion ? 'right' : 'left'"
            :options="options" @select="handleSelect"
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
