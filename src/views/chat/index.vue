<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NIcon, NTabPane, NTabs, useDialog, useLoadingBar, useMessage } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { v4 as uuidv4 } from 'uuid'
import { AudioMessage, Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import { useCopyCode } from './hooks/useCopyCode'
import HeaderComponent from './components/Header/index.vue'
import PcHeader from './components/Header/pc.vue'
import InputToolbar from './InputToolbar.vue'
import InputEditor from './InputEditor.vue'
import LoginTip from '@/views/user/LoginTip.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'
import { defaultConv } from '@/store/modules/chat/helper'
import { AUDIO_SYNTHESIZER_SIDE, CHAT_MESSAGE_CONTENT_TYPE } from '@/utils/constant'
import { SvgIcon } from '@/components/common'
import api from '@/api'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'
import { emptyAudioPlayState } from '@/utils/functions'
let controller = new AbortController()

const pageSize = 10
const appStore = useAppStore()
const route = useRoute()
const ms = useMessage()
const dialog = useDialog()
const chatStore = useChatStore()
const authStore = useAuthStore()
const loaddingBar = useLoadingBar()
const { isMobile } = useBasicLayout()
const { unshiftAnswer, updateMessageSomeFields, appendChunk } = useChat()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom, scrollTo } = useScroll()
const { uuid: curConvUuid } = route.params as { uuid: string }
const regenerateQuestionUuid = ref<string>('')
const inputEditorRef = ref()
const tabsActiveTab = ref<string[]>([])
const messages = computed(() => {
  return chatStore.getMsgsByConv(curConvUuid)
})
const currConv = computed(() => chatStore.getCurConv || defaultConv())
const imageUuids = ref<string[]>([])
const isChatting = ref<boolean>(false)
const loadingMsgs = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)

let prevScrollTop: number
useCopyCode()

// 未知原因刷新页面，loading 状态不会重置，手动重置
messages.value.forEach((item: { loading?: boolean; uuid: string }) => {
  if (item.loading)
    updateMessageSomeFields(curConvUuid, item.uuid, { loading: false })
})

function chatMessageReceiving(questionUuid: string) {
  nextTick(() => {
    scrollToBottomIfAtBottom()
  })
}

function messageComplelted(questionUuid: string) {
  nextTick(() => {
    scrollToBottom()
  })
}

function handleStop() {
  if (isChatting.value) {
    controller.abort()
    isChatting.value = false
  }
  inputEditorRef.value?.handleStop()
}

const fetchChatAPIOnce = async (regenerateQuestionUuid: string, childAudioPlayState: AudioPlayState) => {
  console.log('begin sseProcess')

  const convUuid = currConv.value.uuid
  const conv = chatStore.getConvByUuid(convUuid)
  if (!conv) {
    ms.error('会话不存在或已被删除')
    return
  }
  api.sseProcess({
    options: {
      prompt: '',
      conversationUuid: convUuid,
      regenerateQuestionUuid,
      modelName: appStore.selectedLLM.modelName,
      imageUrls: imageUuids.value,
      audioUuid: '',
      audioDuration: 0,
    },
    signal: controller.signal,
    startCallback(chunk) {
    },
    messageRecived: (chunk) => {
      const question = messages.value.find((q: { uuid: string }) => q.uuid === regenerateQuestionUuid)
      if (!question) {
        ms.error('找不到提问')
        return
      }
      try {
        for (let i = 0; i < chunk.length; i++) {
          appendChunk(
            convUuid,
            question.children[0].uuid,
            chunk[i],
          )
          chatMessageReceiving(question.uuid)
        }
      } catch (error) {
        console.error(error)
      }
      const answerContentType = chatStore.answerContentType(conv, question.audioUuid)
      const ttsPartText = chunk.replace('\n', '')
      if (ttsPartText && appStore.audioSynthesizerSide === AUDIO_SYNTHESIZER_SIDE.client && answerContentType === CHAT_MESSAGE_CONTENT_TYPE.audio && conv.isAutoplayAnswer) {
        // settimeout是防止执行太快导致 AudioMessage 中的 watch 没有触发
        setTimeout(() => {
          childAudioPlayState.msgPart = chunk
        }, 0)
      }
    },
    audioDataRecived(audioFrame) {
      // AudioMessage 监听pcmPart的变化并决定要不要自动播放
      if (appStore.audioSynthesizerSide !== AUDIO_SYNTHESIZER_SIDE.client && audioFrame)
        childAudioPlayState.audioFrame = audioFrame
    },
    doneCallback: (chunk) => {
      const question = messages.value.find((q: { uuid: string }) => q.uuid === regenerateQuestionUuid)
      if (!question) {
        ms.error('找不到提问')
        return
      }
      const answer = question.children[0]
      if (chunk.includes('[META]')) {
        const meta = chunk.replace('[META]', '')
        const metaData: Chat.MetaData = JSON.parse(meta)
        updateMessageSomeFields(convUuid, question.uuid, { ...metaData.question, loading: false })
        // 保留临时answer的uuid以方便自动选中最新答案
        updateMessageSomeFields(convUuid, answer.uuid, { ...metaData.answer, uuid: answer.uuid, loading: false })
        if (metaData.audioInfo) {
          answer.audioPlayState.audioUrl = metaData.audioInfo.url
          answer.audioDuration = metaData.audioInfo.duration
          answer.audioUuid = metaData.audioInfo.uuid
        }
      } else {
        updateMessageSomeFields(convUuid, regenerateQuestionUuid, { loading: false })
        updateMessageSomeFields(convUuid, answer.uuid, { uuid: answer.uuid, loading: false })
      }
      messageComplelted(regenerateQuestionUuid)
    },
    errorCallback: (error) => {
      ms.warning(error)
      const question = messages.value.find((q: { uuid: string }) => q.uuid === regenerateQuestionUuid)
      if (!question) {
        ms.error('找不到提问')
        return
      }
      updateMessageSomeFields(convUuid, question.children[0].uuid, { remark: `系统提示：${error}`, loading: false })
    },
  })
}

async function onRegenerate(questionUuid: string) {
  console.log(`onRegenerate,question uuid:${questionUuid}`)
  if (isChatting.value)
    return

  regenerateQuestionUuid.value = questionUuid
  const message = chatStore.getMsgByCurConv(questionUuid)
  if (!message)
    return

  isChatting.value = true
  controller = new AbortController()

  try {
    const answerContentType = chatStore.answerContentType(currConv.value, message.audioUuid)
    const answerUuid = uuidv4().replace(/-/g, '')
    const audioPlayState = emptyAudioPlayState()
    unshiftAnswer(
      curConvUuid,
      questionUuid,
      {
        uuid: answerUuid,
        contentType: answerContentType,
        createTime: new Date().toLocaleString(),
        remark: '',
        audioUuid: '',
        audioUrl: '',
        audioDuration: 0,
        children: [],
        inversion: false,
        error: false,
        loading: true,
        attachmentUrls: [],
        audioPlayState,
      },
    )
    await fetchChatAPIOnce(questionUuid, audioPlayState)
    selectedLatestAnswer(questionUuid)
  } catch (error: any) {
    console.error(error)
    ms.error(error ?? 'error')
  } finally {
    isChatting.value = false
  }
}

function selectedLatestAnswer(questionUuid: string) {
  nextTick(() => {
    console.log('fetchChatAPIOnce nextTick')
    const index = messages.value.findIndex((msg: { uuid: string }) => msg.uuid === questionUuid)
    if (index !== -1 && messages.value[index].children[0]) {
      tabsActiveTab.value[index] = `tab_${messages.value[index].children[0].uuid}`
      console.log(`tabsActiveTab[${index}]: ${tabsActiveTab.value[index]}`)
    }
  })
}

async function loadMoreMessage(callback?: Function) {
  if (currConv.value.loadedAll || loadingMsgs.value)
    return

  loadingMsgs.value = true
  loaddingBar.start()
  try {
    const minMsgUuid = chatStore.getCurConv?.minMsgUuid || ''
    const { data } = await api.fetchMessages<Chat.ConvMsgListResp>(curConvUuid, minMsgUuid, pageSize)

    if (data.msgList.length < pageSize) {
      chatStore.updateConv(curConvUuid, { minMsgUuid: data.minMsgUuid, loadedAll: true })
      ms.warning('没有更多了', {
        duration: 3000,
      })
    } else {
      chatStore.updateConv(curConvUuid, { minMsgUuid: data.minMsgUuid })
      chatStore.unshiftMessages(curConvUuid, data.msgList)
    }
  } catch (error) {
    console.error(`loadMoreMessage${error}`)
  } finally {
    loadingMsgs.value = false
    loaddingBar.finish()

    if (callback)
      callback()
  }
}

const handleLoadMoreMessage = debounce(loadMoreMessage, 300)
async function handleScroll(event: any) {
  const scrollTop = event.target.scrollTop
  const lastScrollClient = event.target.scrollHeight
  if (scrollTop < 50 && (scrollTop < prevScrollTop || prevScrollTop === undefined)) {
    handleLoadMoreMessage(() => {
      nextTick(() => {
        scrollTo(event.target.scrollHeight - lastScrollClient)
      })
    })
  }
  prevScrollTop = scrollTop
}

function handleDelete(questionUuid: string, answerUuid: string, isQuestion = false) {
  if (isChatting.value)
    return

  let tip = t('chat.deleteMessageConfirm')
  if (isQuestion)
    tip = '删除提问也会把答案一起删除'

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: tip,
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      if (isQuestion) {
        chatStore.deleteQuestion(curConvUuid, questionUuid)
        api.messageDel(questionUuid)
      } else {
        chatStore.deleteAnswer(curConvUuid, questionUuid, answerUuid)
        api.messageDel(answerUuid)
        setTimeout(() => {
          selectedLatestAnswer(questionUuid)
        }, 3000)
      }
    },
  })
}

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

function toggleUsingContext() {
  api.convToggleUsingContext(currConv.value.uuid, !currConv.value.understandContextEnable)
  currConv.value.understandContextEnable = !currConv.value.understandContextEnable
  if (currConv.value.understandContextEnable)
    ms.success(t('chat.turnOnContext'))
  else
    ms.warning(t('chat.turnOffContext'))
}

function imagesChange(uuids: string[]) {
  imageUuids.value = uuids
}

watch(
  () => currConv.value.loadedFirstPageMsg,
  () => {
    if (currConv.value.loadedFirstPageMsg)
      scrollToBottom()
  },
  { immediate: true },
)

onMounted(() => {
  console.info('chat,onmounted')
  nextTick(() => {
    scrollToBottom()
  })
  if (inputRef.value && !isMobile.value)
    inputRef.value?.focus()
})

onUnmounted(() => {
  if (isChatting.value)
    controller.abort()
})

onActivated(async () => {
  console.log('onActivated')
  if (!curConvUuid && chatStore.active)
    await chatStore.setActive(chatStore.active)

  scrollToBottom()
})

onDeactivated(() => {
  console.log('onDeactivated')
})
</script>

<template>
  <div class="chat-box flex flex-col w-full h-full">
    <HeaderComponent
      v-if="isMobile" :using-context="currConv.understandContextEnable"
      @toggle-using-context="toggleUsingContext"
    />
    <PcHeader v-if="!isMobile" :conversation="currConv" />
    <main class="flex-1 overflow-hidden">
      <div ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
        <div
          id="image-wrapper" class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <template v-if="!authStore.token">
            <LoginTip />
          </template>
          <template v-else-if="!messages.length">
            <div class="flex items-center justify-center mt-4 text-center text-neutral-400">
              <NIcon :component="Cat" size="32" />
              <span class="pl-1">Roar~</span>
            </div>
          </template>

          <template v-else>
            <div v-for="(qaMessage, index) of messages" :key="index">
              <!-- 用户消息 start -->

              <!-- 多模态的请求消息，携带有附件 -->
              <template v-if="qaMessage.attachmentUrls.length > 0">
                <!-- 语音聊天 -->
                <AudioMessage
                  v-if="qaMessage.contentType === CHAT_MESSAGE_CONTENT_TYPE.audio" :inversion="true"
                  :conversation="currConv" :message-uuid="qaMessage.uuid" :date-time="qaMessage.createTime"
                  :audio-play-state="qaMessage.audioPlayState" :duration="qaMessage.audioDuration"
                  @delete="handleDelete(qaMessage.uuid, '', true)"
                />
                <!-- 文本聊天 -->
                <Message
                  v-else :date-time="qaMessage.createTime" :text="qaMessage.remark"
                  :image-urls="qaMessage.attachmentUrls" type="text-image" :inversion="true" :error="qaMessage.error"
                  :loading="false" @regenerate="onRegenerate(qaMessage.uuid)"
                  @delete="handleDelete(qaMessage.uuid, '', true)"
                />
              </template>
              <!-- 非多模态的请求消息，没有附件 -->
              <template v-if="qaMessage.attachmentUrls.length === 0">
                <!-- 语音聊天 -->
                <AudioMessage
                  v-if="qaMessage.contentType === CHAT_MESSAGE_CONTENT_TYPE.audio" :inversion="true"
                  :conversation="currConv" :message-uuid="qaMessage.uuid" :date-time="qaMessage.createTime"
                  :audio-play-state="qaMessage.audioPlayState" :duration="qaMessage.audioDuration"
                  @delete="handleDelete(qaMessage.uuid, '', true)"
                />
                <!-- 文本聊天 -->
                <Message
                  v-else :date-time="qaMessage.createTime" :text="qaMessage.remark" type="text" :inversion="true"
                  :error="qaMessage.error" :loading="false" @regenerate="onRegenerate(qaMessage.uuid)"
                  @delete="handleDelete(qaMessage.uuid, '', true)"
                />
              </template>

              <!-- 用户消息 end -->

              <!-- LLM回复 start -->

              <!-- LLM的多条回复消息 -->
              <template v-if="qaMessage.children.length > 1">
                <NTabs
                  v-model:value="tabsActiveTab[index]" pane-wrapper-style="margin: -30px -30px"
                  pane-style="padding-left: 4px; box-sizing: border-box;" type="bar" placement="left" size="small"
                  animated
                >
                  <NTabPane
                    v-for="(answer, index) of qaMessage.children" :key="`tab_${answer.uuid}`"
                    :name="`tab_${answer.uuid}`" :tab="`答案${index + 1}`"
                  >
                    <AudioMessage
                      v-if="answer.contentType === CHAT_MESSAGE_CONTENT_TYPE.audio" :conversation="currConv"
                      :duration="answer.audioDuration" :inversion="false" :message-uuid="answer.uuid"
                      :date-time="answer.createTime" :audio-play-state="answer.audioPlayState" :loading="answer.loading"
                      :ai-model-platform="answer.aiModelPlatform" @delete="handleDelete(qaMessage.uuid, answer.uuid)"
                    />
                    <Message
                      v-else :show-avatar="false" :date-time="answer.createTime" :text="answer.remark"
                      type="text" :inversion="false" :regenerate="true" :error="answer.error" :loading="answer.loading"
                      :ai-model-platform="answer.aiModelPlatform" @regenerate="onRegenerate(qaMessage.uuid)"
                      @delete="handleDelete(qaMessage.uuid, answer.uuid)"
                    />
                  </NTabPane>
                </NTabs>
              </template>

              <!-- LLM的单条回复消息 -->
              <template v-if="qaMessage.children.length === 1">
                <AudioMessage
                  v-if="qaMessage.children[0].contentType === CHAT_MESSAGE_CONTENT_TYPE.audio"
                  :conversation="currConv" :duration="qaMessage.children[0].audioDuration" :inversion="false"
                  :message-uuid="qaMessage.children[0].uuid" :date-time="qaMessage.children[0].createTime"
                  :audio-play-state="qaMessage.children[0].audioPlayState" :loading="qaMessage.children[0].loading"
                  :ai-model-platform="qaMessage.children[0].aiModelPlatform"
                  @delete="handleDelete(qaMessage.uuid, qaMessage.children[0].uuid)"
                />
                <Message
                  v-else :date-time="qaMessage.children[0].createTime" :text="qaMessage.children[0].remark"
                  type="text" :inversion="qaMessage.children[0].inversion" :regenerate="true"
                  :error="qaMessage.children[0].error" :loading="qaMessage.children[0].loading"
                  :ai-model-platform="qaMessage.children[0].aiModelPlatform" @regenerate="onRegenerate(qaMessage.uuid)"
                  @delete="handleDelete(qaMessage.uuid, qaMessage.children[0].uuid)"
                />
              </template>

              <!-- LLM回复 end -->
            </div>
          </template>
        </div>
        <div class="sticky bottom-0 left-0 flex justify-center">
          <NButton v-if="isChatting" size="tiny" @click="handleStop">
            <template #icon>
              <SvgIcon icon="ri:stop-circle-line" />
            </template>
            停止请求
          </NButton>
        </div>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto border-t">
        <InputToolbar @images-change="imagesChange" />
        <InputEditor
          ref="inputEditorRef" :conversation-uuid="curConvUuid" :image-uuids="imageUuids"
          @message-receiving="chatMessageReceiving" @message-complelted="messageComplelted"
          @is-chatting="(chatting) => isChatting = chatting"
        />
      </div>
    </footer>
  </div>
</template>
<!-- <style scoped lang="less">
.chat-box {
  :deep(.n-tabs-tab-wrapper) {
    height: 20px !important;
  }
}
</style> -->
