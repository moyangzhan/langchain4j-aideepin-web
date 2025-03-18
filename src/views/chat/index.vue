<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NAutoComplete, NButton, NIcon, NInput, NTabPane, NTabs, useDialog, useLoadingBar, useMessage } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { v4 as uuidv4 } from 'uuid'
import { Message } from './components'
import { useScroll } from './hooks/useScroll'
import { useChat } from './hooks/useChat'
import { useCopyCode } from './hooks/useCopyCode'
import HeaderComponent from './components/Header/index.vue'
import PcHeader from './components/Header/pc.vue'
import InputToolbar from './InputToolbar.vue'
import LoginTip from '@/views/user/LoginTip.vue'
import { SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore, usePromptStore } from '@/store'
import { defaultConv } from '@/store/modules/chat/helper'
import api from '@/api'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'
let controller = new AbortController()

const pageSize = 10
const route = useRoute()
const ms = useMessage()
const dialog = useDialog()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const loaddingBar = useLoadingBar()
const { isMobile } = useBasicLayout()
const { addMessage, unshiftAnswer, updateMessageSomeFields, appendChunk } = useChat()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom, scrollTo } = useScroll()
const { uuid: curConvUuid } = route.params as { uuid: string }
const regenerateQuestionUuid = ref<string>('')
const tabsActiveTab = ref<string[]>([])
const messages = computed(() => {
  return chatStore.getMsgsByConv(curConvUuid)
})
const currConv = computed(() => chatStore.getCurConv || defaultConv())
const imageUuids = ref<string[]>([])
const prompt = ref<string>('')
const loading = ref<boolean>(false)
const loadingMsgs = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)
let arrowKeyIdx = -1

// 添加PromptStore
const promptStore = usePromptStore()
// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplateList } = storeToRefs<any>(promptStore)
let prevScrollTop: number

useCopyCode()

// 未知原因刷新页面，loading 状态不会重置，手动重置
messages.value.forEach((item: { loading?: boolean; uuid: string }) => {
  if (item.loading)
    updateMessageSomeFields(curConvUuid, item.uuid, { loading: false })
})

function handleSubmit() {
  createChatTask()
}

const fetchChatAPIOnce = async (message: string, regenerateQuestionUuid: string) => {
  console.log('begin sseProcess')
  api.sseProcess({
    options: {
      prompt: message,
      conversationUuid: curConvUuid,
      regenerateQuestionUuid,
      modelName: appStore.selectedLLM.modelName,
      imageUrls: imageUuids.value,
    },
    signal: controller.signal,
    startCallback(chunk) {
    },
    messageRecived: (chunk) => {
      let question = null
      if (regenerateQuestionUuid) {
        question = messages.value.find((q: { uuid: string }) => q.uuid === regenerateQuestionUuid)
        if (!question) {
          ms.error('找不到提问')
          return
        }
      } else {
        question = messages.value[messages.value.length - 1]
      }
      try {
        for (let i = 0; i < chunk.length; i++) {
          appendChunk(
            curConvUuid,
            question.children[0].uuid,
            chunk[i],
          )
        }
      } catch (error) {
        console.error(error)
      }
      scrollToBottomIfAtBottom()
    },
    doneCallback: (chunk) => {
      if (chunk.includes('[META]')) {
        const meta = chunk.replace('[META]', '')
        const metaData: Chat.MetaData = JSON.parse(meta)
        let question = null
        if (regenerateQuestionUuid) {
          question = messages.value.find((q: { uuid: string }) => q.uuid === regenerateQuestionUuid)
          if (!question) {
            ms.error('找不到提问')
            return
          }
        } else {
          question = messages.value[messages.value.length - 1]
        }
        updateMessageSomeFields(curConvUuid, question.uuid, { ...metaData.question, loading: false })
        updateMessageSomeFields(curConvUuid, question.children[0].uuid, { ...metaData.answer, loading: false })
        selectedLatestAnswer(question.uuid)
      }
      loading.value = false
    },
    errorCallback: (error) => {
      ms.warning(error)
      loading.value = false
      let question = null
      if (regenerateQuestionUuid) {
        question = messages.value.find((q: { uuid: string }) => q.uuid === regenerateQuestionUuid)
        if (!question) {
          ms.error('找不到提问')
          return
        }
      } else {
        question = messages.value[messages.value.length - 1]
      }
      updateMessageSomeFields(curConvUuid, question.children[0].uuid, { remark: `系统提示：${error}`, loading: false })
    },
  })
}

async function createChatTask() {
  if (!authStore.token) {
    authStore.setLoginView(true)
    return
  }

  const message = prompt.value

  if (loading.value)
    return

  if (!message || message.trim() === '')
    return

  const questionUuid = uuidv4().replace(/-/g, '')
  const answerUuid = uuidv4().replace(/-/g, '')
  controller = new AbortController()

  // add my question
  addMessage(
    curConvUuid,
    {
      uuid: questionUuid,
      createTime: new Date().toLocaleString(),
      remark: message,
      children: [{
        uuid: answerUuid,
        createTime: new Date().toLocaleString(),
        remark: '',
        children: [],
        loading: true,
        inversion: false,
        error: false,
        aiModelPlatform: appStore.selectedLLM.modelPlatform,
        attachmentUrls: [],
      }],
      inversion: true,
      error: false,
      attachmentUrls: [],
    },
    true,
  )

  loading.value = true
  prompt.value = ''

  scrollToBottom()

  try {
    fetchChatAPIOnce(message, '')
  } catch (error: any) {
    console.error(`fetchChatAPIOnce error:${error}`)
    loading.value = false
    const errorMessage = error?.message ?? t('common.wrong')
    ms.error(errorMessage)
  }
}

async function onRegenerate(questionUuid: string) {
  console.log(`onRegenerate,question uuid:${questionUuid}`)
  if (loading.value)
    return

  regenerateQuestionUuid.value = questionUuid
  const message = chatStore.getMsgByCurConv(questionUuid)
  if (!message)
    return

  loading.value = true
  controller = new AbortController()

  const answerUuid = uuidv4().replace(/-/g, '')

  unshiftAnswer(
    curConvUuid,
    questionUuid,
    {
      uuid: answerUuid,
      createTime: new Date().toLocaleString(),
      remark: '',
      children: [],
      inversion: false,
      error: false,
      loading: true,
      attachmentUrls: [],
    },
  )

  try {
    await fetchChatAPIOnce('', questionUuid)
    selectedLatestAnswer(questionUuid)
  } catch (error: any) {
    console.error(error)
    ms.error(error ?? 'error')
  } finally {
    loading.value = false
  }
}

function selectedLatestAnswer(questionUuid: string) {
  nextTick(() => {
    console.log('fetchChatAPIOnce nextTick')
    const index = messages.value.findIndex((msg: { uuid: string }) => msg.uuid === questionUuid)
    if (index !== -1 && messages.value[index].children[0])
      tabsActiveTab.value[index] = `tab_${messages.value[index].children[0].uuid}`
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
  if (loading.value)
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
  if (loading.value) {
    controller.abort()
    loading.value = false
  }
}

const searchOptions = computed(() => {
  if (prompt.value.indexOf('/') === 0)
    searchRemote()

  return promptTemplateList.value
})

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

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return 'Shift + Enter = 换行 ；/ 开头显示提示词'
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

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
  if (loading.value)
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
            <div v-for="(question, index) of messages" :key="index">
              <!-- 多模态的请求消息，携带有附件 -->
              <template v-if="question.attachmentUrls.length > 0">
                <Message
                  :date-time="question.createTime" :text="question.remark" :image-urls="question.attachmentUrls"
                  type="text-image" :inversion="true" :error="question.error" :loading="false"
                  @regenerate="onRegenerate(question.uuid)" @delete="handleDelete(question.uuid, '', true)"
                />
              </template>
              <!-- 非多模态的请求消息，没有附件 -->
              <template v-if="question.attachmentUrls.length === 0">
                <Message
                  :date-time="question.createTime" :text="question.remark" type="text" :inversion="true"
                  :error="question.error" :loading="false" @regenerate="onRegenerate(question.uuid)"
                  @delete="handleDelete(question.uuid, '', true)"
                />
              </template>

              <!-- LLM的多条回复消息 -->
              <template v-if="question.children.length > 1">
                <NTabs
                  v-model:value="tabsActiveTab[index]" pane-wrapper-style="margin: -30px -30px"
                  pane-style="padding-left: 4px; box-sizing: border-box;" type="bar" placement="left" size="small"
                  animated
                >
                  <NTabPane
                    v-for="(answer, index) of question.children" :key="`tab_${answer.uuid}`"
                    :name="`tab_${answer.uuid}`" :tab="`答案${index + 1}`"
                  >
                    <Message
                      :show-avatar="false" :date-time="answer.createTime" :text="answer.remark" type="text"
                      :inversion="false" :regenerate="true" :error="answer.error" :loading="answer.loading"
                      :ai-model-platform="answer.aiModelPlatform" @regenerate="onRegenerate(question.uuid)"
                      @delete="handleDelete(question.uuid, answer.uuid)"
                    />
                  </NTabPane>
                </NTabs>
              </template>

              <!-- LLM的单条回复消息 -->
              <template v-if="question.children.length === 1">
                <Message
                  :date-time="question.children[0].createTime" :text="question.children[0].remark" type="text"
                  :inversion="question.children[0].inversion" :regenerate="true" :error="question.children[0].error"
                  :loading="question.children[0].loading" :ai-model-platform="question.children[0].aiModelPlatform"
                  @regenerate="onRegenerate(question.uuid)"
                  @delete="handleDelete(question.uuid, question.children[0].uuid)"
                />
              </template>
            </div>
          </template>
        </div>
      </div>
      <div class="sticky bottom-0 left-0 flex justify-center">
        <NButton v-if="loading" size="tiny" @click="handleStop">
          <template #icon>
            <SvgIcon icon="ri:stop-circle-line" />
          </template>
          停止请求
        </NButton>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto border-t">
        <InputToolbar @images-change="imagesChange" />
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
        </div>
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
