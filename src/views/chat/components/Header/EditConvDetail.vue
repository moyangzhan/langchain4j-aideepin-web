<script lang="ts" setup>
import { ref, watch } from 'vue'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NIcon, NInput, NPopconfirm, NTooltip, useMessage } from 'naive-ui'
import { QuestionCircle16Regular } from '@vicons/fluent'
import { useChatStore, useMcpStore } from '@/store'
import { router } from '@/router'
import { debounce } from '@/utils/functions/debounce'
import { emptyConv } from '@/utils/functions'
import api from '@/api'

interface Props {
  conversation: Chat.Conversation
}
interface Emit {
  (ev: 'submitted', show: boolean): void
}
const props = withDefaults(defineProps<Props>(), {})
const emit = defineEmits<Emit>()
const chatStore = useChatStore()
const mcpStore = useMcpStore()
const tmpConv = ref<Chat.Conversation>(emptyConv())
const ms = useMessage()
const submitting = ref<boolean>(false)

function initEditConv(item: Chat.Conversation) {
  Object.assign(tmpConv.value, item)
}
async function handleEdit(event?: KeyboardEvent) {
  event?.stopPropagation()
  if (submitting.value) {
    ms.warning('正在提交，请稍候', {
      duration: 2000,
    })
    return
  }
  if (!tmpConv.value.title) {
    ms.error('标题不能为空', {
      duration: 2000,
    })
    return
  }
  try {
    submitting.value = true
    if (tmpConv.value.uuid === '') {
      const { data: newConv } = await api.convAdd<Chat.Conversation>(tmpConv.value)
      chatStore.addConvAndActive(newConv)
    } else {
      await api.convEdit(tmpConv.value)
      chatStore.updateConv(tmpConv.value.uuid, tmpConv.value)
    }
  } catch (error: any) {
    console.log('handleEdit error', error)
    if (error.message) {
      ms.error(error.message, {
        duration: 2000,
      })
    }
  } finally {
    submitting.value = false
    emit('submitted', false)
  }
}

function handleDelete(uuid: string, event?: MouseEvent | TouchEvent) {
  event?.stopPropagation()
  try {
    api.convDel(uuid)
    chatStore.deleteConv(uuid)
  } finally {
    emit('submitted', false)
  }
}

function gotoMcp() {
  router.push({ name: 'Mcp' })
  emit('submitted', false)
}

watch(() => props.conversation.uuid, (val) => {
  if (val)
    initEditConv(props.conversation)
}, { immediate: true })

const handleDeleteDebounce = debounce(handleDelete, 600)
</script>

<template>
  <div class="flex flex-col space-y-3">
    <div>
      <div class="font-bold">
        名称
      </div>
      <NInput v-model:value="tmpConv.title" type="text" size="large" placeholder="如：李白" />
    </div>
    <div>
      <div class="font-bold">
        备注
      </div>
      <NInput v-model:value="tmpConv.remark" type="textarea" placeholder="如：多年写诗经验" :autosize="{ minRows: 1, maxRows: 10 }" />
    </div>
    <div>
      <div class="font-bold">
        角色设定
      </div>
      <NInput v-model:value="tmpConv.aiSystemMessage" type="textarea" placeholder="如：你是唐朝的李白，诗才出众，被誉为诗仙" :autosize="{ minRows: 1, maxRows: 10 }" />
    </div>
    <div class="flex flex-col space-y-2">
      <div class="flex space-x-2 font-bold">
        服务与工具(MCP)
        <NTooltip trigger="hover">
          <template #trigger>
            <NIcon style="margin-top: 0.2rem">
              <QuestionCircle16Regular />
            </NIcon>
          </template>
          <span>选中项表示本角色可能会用到该服务中的各种工具</span>
        </NTooltip>
        <NButton type="primary" size="tiny" text tag="a" class="ml-4" @click="gotoMcp">
          去启用更多AI工具
        </NButton>
      </div>
      <NCheckboxGroup v-model:value="tmpConv.mcpIds" class="flex flex-wrap space-x-2">
        <NCheckbox v-for="userMcp in mcpStore.myUserMcpList" :key="userMcp.uuid" :value="userMcp.mcpInfo.id" :label="userMcp.mcpInfo.title" />
      </NCheckboxGroup>
    </div>
    <NFlex justify="space-between">
      <NButton type="primary" :loading="submitting" :disabled="submitting" @click="handleEdit()">
        {{ $t('common.save') }}
      </NButton>
      <NPopconfirm placement="top" @positive-click.stop="handleDeleteDebounce(tmpConv.uuid, $event)">
        <template #trigger>
          <NButton type="error" text tag="a" :loading="submitting" :disabled="submitting">
            {{ $t('common.delete') }}
          </NButton>
        </template>
        {{ $t('chat.deleteConversationConfirm') }}
      </NPopconfirm>
    </NFlex>
  </div>
</template>
