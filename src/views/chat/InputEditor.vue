<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAutoComplete, NButton, NCard, NInput, NModal, useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { useChat } from './hooks/useChat'
import { SvgIcon } from '@/components/common'
import AudioRecorder from '@/components/AudioRecorder.vue'
import { useAppStore, useAuthStore, useChatStore, usePromptStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { emptyAudioPlayState, emptyChatMessage } from '@/utils/functions'
import { AUDIO_SYNTHESIZER_SIDE, CHAT_MESSAGE_CONTENT_TYPE } from '@/utils/constant'
import { t } from '@/locales'
import api from '@/api'

interface Props {
  conversationUuid: string
  imageUuids: string[]
}
const props = withDefaults(defineProps<Props>(), {
  conversationUuid: '',
})
const emit = defineEmits<Emit>()
interface Emit {
  (ev: 'sseStarted', questionUuid: string): void
  (ev: 'messageReceiving', questionUuid: string): void
  (ev: 'messageComplelted', questionUuid: string): void
  (ev: 'isChatting', isChatting: boolean): void
}
const prompt = ref<string>('')
const { isMobile } = useBasicLayout()
const { addMessage, updateMessageSomeFields, appendChunk } = useChat()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const ms = useMessage()
const promptStore = usePromptStore()
// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplateList } = storeToRefs<any>(promptStore)
const isChatting = ref<boolean>(false)
const chattingMsg = ref<Chat.ChatMessage>(emptyChatMessage())
const showAudioRecorderModal = ref<boolean>(false)
const messages = computed(() => {
  return chatStore.getMsgsByConv(props.conversationUuid)
})
let controller = new AbortController()
let arrowKeyIdx = -1

async function searchRemote() {
  const resp = await api.searchPrompts<PageResponse>(1, 10, prompt.value.substring(1))
  promptTemplateList.value.splice(0, promptTemplateList.value.length)
  if (resp.success && resp.data.records) {
    resp.data.records.forEach((item: Chat.Prompt) => {
      promptTemplateList.value.push({
        label: item.act,
        value: item.prompt,
      })
    })
  }
}
function getShow(value: string) {
  if (value.indexOf('/') === 0)
    return true

  return false
}

function handleUp(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' && prompt.value.indexOf('/') !== 0) {
    event.preventDefault()
    const msgLength = messages.value.length
    if (msgLength === 0)
      return

    if (arrowKeyIdx === -1)
      arrowKeyIdx = msgLength - 1
    else
      arrowKeyIdx--

    const nextMessage = messages.value[arrowKeyIdx]
    if (nextMessage)
      prompt.value = nextMessage.remark
    else
      arrowKeyIdx++
  }
}

function handleDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && prompt.value.indexOf('/') !== 0) {
    event.preventDefault()
    const msgLength = messages.value.length
    if (msgLength === 0)
      return

    if (arrowKeyIdx === -1)
      arrowKeyIdx = 0
    else
      arrowKeyIdx++

    const preMessage = messages.value[arrowKeyIdx]
    if (preMessage)
      prompt.value = preMessage.remark
    else
      arrowKeyIdx--
  }
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  } else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  arrowKeyIdx = -1
}

function handleStop() {
  if (isChatting.value) {
    controller.abort()
    isChatting.value = false
  }
}

function handleSubmit() {
  createChatTask()
}

function handleShowAudioRecorderModal() {
  if (!authStore.token) {
    authStore.setLoginView(true)
    return
  }
  showAudioRecorderModal.value = true
}

const fetchChatAPIOnce = async (message: string, userAudioUuid: string, userAudioDuration: number) => {
  console.log('input editor chat')
  const conv = chatStore.getConvByUuid(props.conversationUuid)
  if (!conv) {
    ms.error('会话不存在或已被删除')
    return
  }
  api.sseProcess({
    options: {
      prompt: message,
      conversationUuid: props.conversationUuid,
      regenerateQuestionUuid: '',
      modelName: appStore.selectedLLM.modelName,
      imageUrls: props.imageUuids,
      audioUuid: userAudioUuid,
      audioDuration: userAudioDuration,
    },
    signal: controller.signal,
    startCallback(chunk) {
      emit('sseStarted', chattingMsg.value.uuid)
    },
    messageRecived: (chunk) => {
      try {
        const answer = chattingMsg.value.children[0]
        for (let i = 0; i < chunk.length; i++) {
          appendChunk(
            props.conversationUuid,
            answer.uuid,
            chunk[i],
          )
          emit('messageReceiving', chattingMsg.value.uuid)
        }
        // 使用浏览器的语音合成功能朗读文本
        const answerContentType = chatStore.answerContentType(conv, userAudioUuid)
        console.log(`answerContentType: ${answerContentType}, conv?.answerType: ${conv?.answerContentType}, userAudioUuid: ${userAudioUuid},conv?.isAutoplayAnswer: ${conv.isAutoplayAnswer}`)
        const ttsPartText = chunk.replace('\n', '')
        if (ttsPartText && appStore.audioSynthesizerSide === AUDIO_SYNTHESIZER_SIDE.client && answerContentType === CHAT_MESSAGE_CONTENT_TYPE.audio && conv.isAutoplayAnswer) {
          // settimeout是防止执行太快导致 AudioMessage 中的 watch 没有触发
          setTimeout(() => {
            answer.audioPlayState.msgPart = ttsPartText
          }, 0)
        }
      } catch (error) {
        console.error(error)
      }
    },
    audioDataRecived(audioFrame) {
      // AudioMessage 监听audioFrame的变化并自动播放
      if (!conv.isAutoplayAnswer || !audioFrame) {
        console.log('AudioMessage audioFrame is empty or autoplay is disabled')
        return
      }
      console.log('AudioMessage audioFrame received')
      setTimeout(() => {
        chattingMsg.value.children[0].audioPlayState.audioFrame = audioFrame
      }, 0)
    },
    doneCallback: (chunk) => {
      const answer = chattingMsg.value.children[0]
      if (chunk.includes('[META]')) {
        const meta = chunk.replace('[META]', '')
        const metaData: Chat.MetaData = JSON.parse(meta)
        updateMessageSomeFields(props.conversationUuid, chattingMsg.value.uuid, { ...metaData.question, loading: false })
        updateMessageSomeFields(props.conversationUuid, answer.uuid, { ...metaData.answer, loading: false })
        if (metaData.audioInfo) {
          answer.audioPlayState.audioUrl = metaData.audioInfo.url
          answer.audioDuration = metaData.audioInfo.duration
          answer.audioUuid = metaData.audioInfo.uuid
        }
      } else {
        updateMessageSomeFields(props.conversationUuid, chattingMsg.value.uuid, { loading: false })
        updateMessageSomeFields(props.conversationUuid, answer.uuid, { loading: false })
      }
      emit('messageComplelted', chattingMsg.value.uuid)
      isChatting.value = false
    },
    errorCallback: (error) => {
      ms.warning(error)
      isChatting.value = false
      const question = messages.value[messages.value.length - 1]
      updateMessageSomeFields(props.conversationUuid, question.children[0].uuid, { remark: `系统提示：${error}`, loading: false })
    },
  })
}

async function createChatTask(userAudioUuid = '', userAudioUrl = '', audioDuration = 0) {
  if (!authStore.token) {
    authStore.setLoginView(true)
    return
  }

  const message = prompt.value

  if (isChatting.value)
    return

  if ((!message || message.trim() === '') && !userAudioUuid)
    return

  isChatting.value = true
  prompt.value = ''
  try {
    const questionUuid = uuidv4().replace(/-/g, '')
    const answerUuid = uuidv4().replace(/-/g, '')
    controller = new AbortController()

    const conv = chatStore.getConvByUuid(props.conversationUuid)
    if (!conv) {
      ms.error('会话不存在或已被删除')
      return
    }
    const answerContentType = chatStore.answerContentType(conv, userAudioUuid)

    const audioPlayState = emptyAudioPlayState()
    audioPlayState.audioUrl = userAudioUrl
    audioPlayState.audioUuid = userAudioUuid
    chattingMsg.value = {
      uuid: questionUuid,
      contentType: userAudioUuid ? CHAT_MESSAGE_CONTENT_TYPE.audio : CHAT_MESSAGE_CONTENT_TYPE.text,
      createTime: new Date().toLocaleString(),
      remark: message,
      audioUuid: userAudioUuid,
      audioUrl: userAudioUrl,
      audioDuration,
      children: [{
        uuid: answerUuid,
        contentType: answerContentType, // 2: text, 3: audio
        createTime: new Date().toLocaleString(),
        remark: '',
        audioUuid: '',
        audioUrl: '',
        audioDuration: 0,
        children: [],
        loading: true,
        inversion: false,
        error: false,
        aiModelPlatform: appStore.selectedLLM.modelPlatform,
        attachmentUrls: [],
        audioPlayState: emptyAudioPlayState(),
      }],
      inversion: true,
      error: false,
      attachmentUrls: [],
      audioPlayState,
    }
    // add my question
    addMessage(
      props.conversationUuid,
      chattingMsg.value,
      true,
    )
    await fetchChatAPIOnce(message, userAudioUuid, audioDuration)
  } catch (error: any) {
    console.error(`fetchChatAPIOnce error:${error}`)
    const errorMessage = error?.message ?? t('common.wrong')
    ms.error(errorMessage)
  } finally {
    isChatting.value = false
  }
}

function handleAudioRecorded(audioUrl: string, audioBlob: Blob, audioDuration: number) {
  console.log(`handleAudioRecorded, url:${audioUrl}`)
}

function handleAudioSubmitted(uuid: string, url: string, audioDuration: number) {
  console.log(`handleAudioSubmitted, uuid:${uuid}, url:${url}, audioDuration:${audioDuration}`)
  showAudioRecorderModal.value = false
  createChatTask(uuid, url, audioDuration)
}

const buttonDisabled = computed(() => {
  return isChatting.value || !prompt.value || prompt.value.trim() === ''
})

watch(() => isChatting.value, () => {
  console.log(`isChatting changed to ${isChatting.value}`)
  emit('isChatting', isChatting.value)
})

const searchOptions = computed(() => {
  if (prompt.value.indexOf('/') === 0)
    searchRemote()

  return promptTemplateList.value
})

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return 'Shift + Enter = 换行 ；/ 开头显示提示词'
})

defineExpose({
  handleStop,
})
</script>

<template>
  <div class="flex items-center space-x-2">
    <NAutoComplete v-model:value="prompt" class="grow" :options="searchOptions" :get-show="getShow">
      <template #default="{ handleInput, handleBlur, handleFocus }">
        <NInput
          ref="inputRef" v-model:value="prompt" type="textarea" :placeholder="placeholder"
          :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }" @input="handleInput" @focus="handleFocus"
          @blur="handleBlur" @keyup.up="handleUp" @keyup.down="handleDown" @keypress="handleEnter"
        />
      </template>
    </NAutoComplete>
    <NButton class="flex-none" type="primary" :disabled="buttonDisabled" @click="handleSubmit">
      <template #icon>
        <span class="dark:text-black">
          <SvgIcon icon="ri:send-plane-fill" />
        </span>
      </template>
    </NButton>
    <NButton class="flex-none" type="primary" @click="handleShowAudioRecorderModal">
      <template #icon>
        <span class="dark:text-black">
          <SvgIcon icon="icon-park-outline:voice" />
        </span>
      </template>
    </NButton>
    <NModal :show="showAudioRecorderModal">
      <NCard style="max-width: 600px" title="语音对话" size="huge" :bordered="false" role="dialog" aria-modal="true">
        <AudioRecorder
          @recorded="handleAudioRecorded" @submitted="handleAudioSubmitted"
          @exit="showAudioRecorderModal = false"
        />
      </NCard>
    </NModal>
  </div>
</template>
