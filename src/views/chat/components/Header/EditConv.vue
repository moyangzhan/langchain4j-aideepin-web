<script lang="ts" setup>
import { ref, watch } from 'vue'
import { NButton, NFlex, NInput, NModal, NPopconfirm, NSpace } from 'naive-ui'
import { useChatStore } from '@/store'
import { debounce } from '@/utils/functions/debounce'
import api from '@/api'

interface Props {
  showModal: boolean
  conversation: Chat.Conversation
}
interface Emit {
  (ev: 'showModal', show: boolean): void
}
const props = withDefaults(defineProps<Props>(), {
  showModal: false,
})
const emit = defineEmits<Emit>()
const chatStore = useChatStore()
const innerShow = ref<boolean>(props.showModal)
const tmpUuid = ref<string>('')
const tmpTitle = ref<string>('')
const tmpRemark = ref<string>('')
const tmpSystemMessage = ref<string>('')

function initEditConv(item: Chat.Conversation) {
  tmpUuid.value = item.uuid
  tmpTitle.value = item.title
  tmpRemark.value = item.remark
  tmpSystemMessage.value = item.aiSystemMessage
}
function handleEdit(event?: KeyboardEvent) {
  event?.stopPropagation()
  const conv = { uuid: tmpUuid.value, title: tmpTitle.value, remark: tmpRemark.value, aiSystemMessage: tmpSystemMessage.value }
  try {
    api.convEdit(conv)
    chatStore.updateConv(conv.uuid, conv)
  } finally {
    emit('showModal', false)
  }
}

function handleDelete(uuid: string, event?: MouseEvent | TouchEvent) {
  event?.stopPropagation()
  try {
    api.convDel(uuid)
    chatStore.deleteConv(uuid)
  } finally {
    emit('showModal', false)
  }
}

watch(() => props.showModal, (val) => {
  innerShow.value = val
})

watch(() => props.conversation, (val) => {
  if (val)
    initEditConv(val)
})

watch(() => innerShow.value, (val) => {
  if (!val)
    emit('showModal', false)
})

const handleDeleteDebounce = debounce(handleDelete, 600)
</script>

<template>
  <NModal v-model:show="innerShow" style="width: 90%; max-width: 640px" preset="card">
    <NSpace vertical justify="space-between">
      <div class="text-neutral-500">
        名称
      </div>
      <NInput v-model:value="tmpTitle" type="text" size="large" placeholder="如：李白" />
      <div class="text-neutral-500">
        备注
      </div>
      <NInput v-model:value="tmpRemark" type="textarea" placeholder="如：多年写诗经验" />
      <div class="text-neutral-500">
        角色设定
      </div>
      <NInput v-model:value="tmpSystemMessage" type="textarea" placeholder="如：你是唐朝的李白，诗才出众，被誉为诗仙" />
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
</template>
