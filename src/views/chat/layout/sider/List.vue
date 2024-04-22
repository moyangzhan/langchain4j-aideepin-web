<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NFlex, NInput, NModal, NPopconfirm, NScrollbar, NSpace } from 'naive-ui'
import { useRoute } from 'vue-router'
import { SvgIcon } from '@/components/common'
import { useAppStore, useAuthStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { debounce } from '@/utils/functions/debounce'
import api from '@/api'

const { isMobile } = useBasicLayout()
const route = useRoute()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
const authStoreRef = ref<AuthState>(authStore)
const showModal = ref<boolean>(false)
const tmpUuid = ref<string>('')
const tmpTitle = ref<string>('')
const tmpSystemMessage = ref<string>('')
const mouseEnterKbUuid = ref<string>('')

async function handleSelect({ uuid }: Chat.Conversation) {
  console.log('click chat', uuid)
  if (isActive(uuid))
    return

  if (chatStore.active)
    chatStore.updateConv(chatStore.active, {})
  await chatStore.setActive(uuid)

  const minMsgUuid = chatStore.getCurConv?.minMsgUuid || ''
  const cacheMessages = chatStore.getMsgsByConv(uuid)
  if (cacheMessages.length === 0) {
    const { data } = await api.fetchMessages<Chat.ConvMsgListResp>(uuid, minMsgUuid, 20)
    data.msgList.forEach((messageRecord) => {
      chatStore.addMessage(uuid, messageRecord, false)
    })
    chatStore.updateConv(uuid, { minMsgUuid: data.minMsgUuid, loadedFirstPageMsg: true })
  }

  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleMouseEnter({ uuid }: Chat.Conversation) {
  mouseEnterKbUuid.value = uuid
}
function handleMouseLeave() {
  mouseEnterKbUuid.value = ''
}
function openEditView(item: Chat.Conversation, event?: KeyboardEvent) {
  showModal.value = true
  tmpUuid.value = item.uuid
  tmpTitle.value = item.title
  tmpSystemMessage.value = item.aiSystemMessage
}

function handleEdit(event?: KeyboardEvent) {
  event?.stopPropagation()
  const conv = { uuid: tmpUuid.value, title: tmpTitle.value, aiSystemMessage: tmpSystemMessage.value }
  api.convEdit(conv)
  chatStore.updateConv(conv.uuid, conv)
  showModal.value = false
}

function handleDelete(uuid: string, event?: MouseEvent | TouchEvent) {
  event?.stopPropagation()
  api.convDel(uuid)
  chatStore.deleteConv(uuid)
  if (isMobile.value)
    appStore.setSiderCollapsed(true)

  showModal.value = false
}

const handleDeleteDebounce = debounce(handleDelete, 600)

function isActive(uuid: string) {
  return chatStore.active === uuid
}

async function fetchHistory() {
  const { data: convs } = await api.fetchConvs<Chat.Conversation[]>()
  if (convs.length > 0) {
    chatStore.clearDefault()
    chatStore.addConvs(convs)

    const active = route.params.uuid as string
    console.log('active', active)
    if (active === 'default')
      await handleSelect(convs[0])
  }
}

const convList = computed(() => chatStore.conversations)

watch(
  () => authStoreRef.value.token,
  (newVal) => {
    if (newVal) {
      console.log('token change, reaload')
      fetchHistory()
    }
  },
)

onMounted(() => {
  console.log('chat list onMounted')
  if (authStoreRef.value.token)
    fetchHistory()
})
</script>

<template>
  <NModal v-model:show="showModal" style="width: 90%; max-width: 640px" preset="card">
    <NSpace vertical justify="space-between">
      <NInput v-model:value="tmpTitle" type="text" size="large" :placeholder="$t('store.title')" />
      <NInput v-model:value="tmpSystemMessage" type="textarea" size="large" :placeholder="$t('setting.role')" />
      <NFlex justify="space-between">
        <NButton type="primary" @click="handleEdit()">
          {{ $t('common.save') }}
        </NButton>
        <NPopconfirm placement="top" @positive-click.stop="handleDeleteDebounce(tmpUuid, $event)">
          <template #trigger>
            <NButton type="error" ghost>
              {{ $t('common.delete') }}
            </NButton>
          </template>
          {{ $t('chat.deleteConversationConfirm') }}
        </NPopconfirm>
      </NFlex>
    </NSpace>
  </NModal>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!convList.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="(item, index) of convList" :key="index">
          <a
            class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
            :class="isActive(item.uuid) && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]']"
            @click="handleSelect(item)"
            @mouseenter="handleMouseEnter(item)"
            @mouseleave="handleMouseLeave"
          >
            <span>
              <SvgIcon icon="ri:message-3-line" />
            </span>
            <div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
              <span>{{ item.title }}</span>
            </div>
            <div v-if="mouseEnterKbUuid === item.uuid" class="absolute z-10 flex visible right-1 bg-neutral-100 pd-2">
              <button class="p-1">
                <SvgIcon icon="ri:edit-line" @click.stop="openEditView(item)" />
              </button>
            </div>
          </a>
        </div>
      </template>
    </div>
  </NScrollbar>
</template>
