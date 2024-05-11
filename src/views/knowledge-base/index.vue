<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, nextTick, onActivated, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NIcon, NInput, NSelect, useDialog, useMessage } from 'naive-ui'
import type { MessageReactive } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { v4 as uuidv4 } from 'uuid'
import { Message } from '../chat/components'
import { useScroll } from '../chat/hooks/useScroll'
import { useCopyCode } from '../chat/hooks/useCopyCode'
import HeaderComponent from '../chat/components/Header/index.vue'
import { SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useKbStore } from '@/store'
import api from '@/api'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'
import { knowledgeBaseEmptyRecord } from '@/utils/functions'

let controller = new AbortController()

const route = useRoute()
const router = useRouter()
const ms = useMessage()
const dialog = useDialog()
const appStore = useAppStore()
const kbStore = useKbStore()
const { isMobile } = useBasicLayout()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom, scrollTo } = useScroll()
const { kbUuid: currKbUuid } = route.params as { kbUuid: string }
console.log('currKbUUid', currKbUuid)
const prompt = ref<string>('')
const inputRef = ref<Ref | null>(null)

const loadedAll = ref<boolean>(false)
const sseRequesting = ref<boolean>(false)
const pageSize = 20
let currentPage = 1
let prevScrollTop: number
let loadingms: MessageReactive

useCopyCode()

if (currKbUuid === 'default' && !!kbStore.activeKbUuid)
  router.replace({ name: 'QADetail', params: { kbUuid: kbStore.activeKbUuid } })

function handleChangeModel(value: string) {
  appStore.setSelectedLLM(value)
}

async function handleSubmit() {
  const message = prompt.value

  if (!message || message.trim() === '')
    return

  if (sseRequesting.value)
    return

  sseRequesting.value = true
  controller = new AbortController()

  prompt.value = ''
  scrollToBottom()

  const tmpUuid = uuidv4().replace(/-/g, '')
  const tmpRecord = knowledgeBaseEmptyRecord()
  tmpRecord.uuid = tmpUuid
  tmpRecord.question = message
  tmpRecord.kbUuid = currKbUuid
  tmpRecord.answer = '生成中...'
  tmpRecord.loading = true
  tmpRecord.aiModelPlatform = appStore.selectedLLM.modelPlatform

  try {
    kbStore.appendRecord(currKbUuid, tmpRecord)

    await api.knowledgeBaseQaSseAsk({
      options: {
        kbUuid: currKbUuid,
        question: message,
        modelName: appStore.selectedLLM.modelName,
      },
      signal: controller.signal,
      startCallback: (chunk) => {
        tmpRecord.answer = ''
        kbStore.updateRecord(currKbUuid, tmpUuid, tmpRecord)
      },
      messageRecived: (chunk) => {
        // Always process the final line
        if (!chunk)
          chunk = '\r\n'
        try {
          kbStore.appendChunk(
            currKbUuid,
            tmpUuid,
            chunk,
          )
        } catch (error) {
          console.error(error)
        }
        scrollToBottomIfAtBottom()
      },
      doneCallback: (chunk) => {
        if (chunk.includes('[META]')) {
          const meta = chunk.replace('[META]', '')
          const metaData: Chat.MetaData = JSON.parse(meta)
          console.info('metaData', metaData)
        } else {
          kbStore.appendChunk(
            currKbUuid,
            tmpUuid,
            chunk,
          )
        }
        tmpRecord.loading = false
        tmpRecord.error = false
        kbStore.updateRecord(currKbUuid, tmpUuid, tmpRecord)
        sseRequesting.value = false
      },
      errorCallback: (error) => {
        sseRequesting.value = false
        ms.warning(`系统提示：${error}`)
        tmpRecord.answer = `系统提示：${error}`
        tmpRecord.loading = false
        tmpRecord.error = true
        kbStore.updateRecord(currKbUuid, tmpUuid, tmpRecord)
      },
    })
  } catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')
    ms.error(errorMessage)
    tmpRecord.answer = errorMessage
    tmpRecord.error = true
    sseRequesting.value = false
  }
}

async function loadMoreMessage(event: any) {
  if (kbStore.loadingRecords.get(currKbUuid) || loadedAll.value)
    return

  loadingms = ms.loading(
    '加载中...', {
      duration: 3000,
    })
  try {
    kbStore.setLoadingRecords(currKbUuid, true)

    const scrollPosition = event.target.scrollHeight - event.target.scrollTop
    const { data } = await api.knowledgeBaseQaRecordSearch<KnowledgeBase.QaRecordListResp>(currKbUuid, '', currentPage, pageSize)
    console.log('kb record response:', data)
    if (data.records)
      kbStore.appendRecords(currKbUuid, data.records)

    nextTick(() => scrollTo(event.target.scrollHeight - scrollPosition))

    if (data.records.length < pageSize) {
      loadedAll.value = true
      loadingms.destroy()
      loadingms = ms.warning('没有更多了', {
        duration: 1000,
      })
    }
  } catch (error) {
    console.error(`loadMoreMessage${error}`)
  } finally {
    currentPage++
    kbStore.setLoadingRecords(currKbUuid, false)
    loadingms.destroy()
  }
}
const handleLoadMoreMessage = debounce(loadMoreMessage, 300)
async function handleScroll(event: any) {
  const scrollTop = event.target.scrollTop
  if (scrollTop < 50 && (scrollTop < prevScrollTop || prevScrollTop === undefined))
    handleLoadMoreMessage(event)

  prevScrollTop = scrollTop
}

function handleDelete(qaRecordUuid: string) {
  if (kbStore.loadingRecords.get(currKbUuid))
    return
  dialog.warning({
    title: t('chat.deleteMessage'),
    content: '提问及对应的答案会一起删除，继续执行？',
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      api.knowledgeBaseQaRecordDel(qaRecordUuid)
      kbStore.deleteRecord(currKbUuid, qaRecordUuid)
    },
  })
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
}

function handleStop() {
  if (kbStore.loadingRecords.get(currKbUuid)) {
    controller.abort()
    sseRequesting.value = false
  }
}

const qaRecords = computed(() => {
  console.log('qaRecords computed')
  return kbStore.getRecords(currKbUuid)
})

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return sseRequesting.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

onMounted(async () => {
  console.log('knowledge-base onmounted', currKbUuid)
  if (!!qaRecords.value && !kbStore.loadingRecords.get(currKbUuid) && !kbStore.kbUuidToQaRecords.get(currKbUuid)) {
    try {
      kbStore.setLoadingRecords(currKbUuid, true)
      const resp = await api.knowledgeBaseQaRecordSearch<KnowledgeBase.QaRecordListResp>(currKbUuid, '', currentPage, pageSize)
      if (resp.data.records) {
        kbStore.appendRecords(currKbUuid, resp.data.records)
        if (resp.data.records.length < pageSize)
          loadedAll.value = true
      }
    } finally {
      kbStore.setLoadingRecords(currKbUuid, false)
      currentPage++
    }
    nextTick(() => {
      scrollToBottom()
    })
    if (inputRef.value && !isMobile.value)
      inputRef.value?.focus()
  }
})

onUnmounted(() => {
  if (kbStore.loadingRecords.get(currKbUuid))
    controller.abort()
})

onActivated(async () => {
  scrollToBottom()
})
</script>

<template>
  <div class="chat-box flex flex-col w-full h-full">
    <HeaderComponent v-if="isMobile" :using-context="false" />
    <main class="flex-1 overflow-hidden">
      <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
        <div
          id="image-wrapper" class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <template v-if="!qaRecords.length">
            <div class="flex items-center justify-center mt-4 text-center text-neutral-400">
              <NIcon :component="Cat" size="32" />
              <span class="pl-1">Roar~</span>
            </div>
          </template>

          <template v-else>
            <div v-for="qaRecord of qaRecords" :key="qaRecord.uuid">
              <Message
                :date-time="qaRecord.createTime" :text="qaRecord.question" :regenerate="false" type="text"
                :inversion="true" :error="qaRecord.error" :loading="false" @delete="handleDelete(qaRecord.uuid)"
              />
              <Message
                :date-time="qaRecord.createTime" :text="!!qaRecord.answer ? qaRecord.answer : '[无答案]'"
                :regenerate="false" type="text" :inversion="false" :error="qaRecord.error" :loading="qaRecord.loading"
                :ai-model-platform="qaRecord.aiModelPlatform"
                @delete="handleDelete(qaRecord.uuid)"
              />
            </div>
          </template>
        </div>
      </div>
      <div class="sticky bottom-0 left-0 flex justify-center">
        <NButton v-if="sseRequesting" size="tiny" @click="handleStop">
          <template #icon>
            <SvgIcon icon="ri:stop-circle-line" />
          </template>
          Stop Responding
        </NButton>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <div class="w-48">
            <NSelect :value="appStore.selectedLLM.modelId" :options="appStore.llms" @update:value="handleChangeModel" />
          </div>
          <NInput
            ref="inputRef" v-model:value="prompt" type="textarea" :placeholder="placeholder"
            :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }" @keypress="handleEnter"
          />
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
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
