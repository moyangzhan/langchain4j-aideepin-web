<script lang="ts" setup>
import { ref, watch } from 'vue'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NIcon, NInput, NPopconfirm, NRadio, NRadioGroup, NTag, NTooltip, useMessage } from 'naive-ui'
import { QuestionCircle16Regular } from '@vicons/fluent'
import ConvKnowledgeSelector from '@/views/chat/ConvKnowledgeSelector.vue'
import { useScroll } from '@/views/chat/hooks/useScroll'
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
const { scrollRef } = useScroll()
const tmpConv = ref<Chat.Conversation>(emptyConv())
const ms = useMessage()
const submitting = ref<boolean>(false)
const knowledgeModalShow = ref<boolean>(false)

function initEditConv(item: Chat.Conversation) {
  Object.assign(tmpConv.value, item)
  tmpConv.value.kbIds = []
  tmpConv.value.convKnowledgeList = []
  tmpConv.value.kbIds.push(...item.kbIds)
  tmpConv.value.convKnowledgeList.push(...item.convKnowledgeList)
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
    if (!tmpConv.value.uuid) {
      const { data: newConv } = await api.convAdd<Chat.Conversation>(tmpConv.value)
      chatStore.addConvAndActive(newConv)
    } else {
      await api.convEdit(tmpConv.value.uuid, tmpConv.value)
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

function handleRemoveKnowledge(knowledgeId: string) {
  const index = tmpConv.value.convKnowledgeList.findIndex(kb => kb.id === knowledgeId)
  if (index !== -1) {
    tmpConv.value.convKnowledgeList.splice(index, 1)
    const idIndex = tmpConv.value.kbIds.findIndex(id => id === knowledgeId)
    if (idIndex !== -1)
      tmpConv.value.kbIds.splice(idIndex, 1)
  }
}

function handleKnowledgeSelectedChanged(knowledgeIds: string[], knowledgeList: Chat.ConvKnowledge[]) {
  tmpConv.value.kbIds = knowledgeIds
  tmpConv.value.convKnowledgeList = knowledgeList
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
  <div>
    <div ref="scrollRef" class="h-full overflow-hidden overflow-y-auto max-h-[700px]">
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
          <NInput
            v-model:value="tmpConv.remark" type="textarea" placeholder="如：多年写诗经验"
            :autosize="{ minRows: 1, maxRows: 10 }"
          />
        </div>
        <div>
          <div class="font-bold">
            角色设定
          </div>
          <NInput
            v-model:value="tmpConv.aiSystemMessage" type="textarea" placeholder="如：你是唐朝的李白，诗才出众，被誉为诗仙"
            :autosize="{ minRows: 1, maxRows: 10 }"
          />
        </div>
        <div>
          <div class="font-bold">
            深度思考
            <NTooltip trigger="hover">
              <template #trigger>
                <NIcon style="margin-top: 0.2rem">
                  <QuestionCircle16Regular />
                </NIcon>
              </template>
              <span>当选择的模型支持深度思考时，启用或关闭该功能<br></span>
              <span>注意：部分模型如deepseek-reasoner不支持关闭该功能</span>
            </NTooltip>
          </div>
          <NRadioGroup
            :value="tmpConv.isEnableThinking" name="isEnableThinkingRadio" class="flex flex-col space-y-2"
            size="small" @update:value="(checked) => tmpConv.isEnableThinking = checked"
          >
            <NRadio :value="false">
              关闭
            </NRadio>
            <NRadio :value="true">
              启用
            </NRadio>
          </NRadioGroup>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex space-x-2 font-bold">
            <span>知识库</span>
            <NButton type="primary" size="tiny" text tag="a" @click="knowledgeModalShow = !knowledgeModalShow">
              添加更多知识库
            </NButton>
          </div>
          <div v-if="!knowledgeModalShow">
            <div v-if="tmpConv.convKnowledgeList.length === 0">
              暂无数据
              <NButton type="primary" size="tiny" text tag="a" @click="knowledgeModalShow = !knowledgeModalShow">
                点击添加
              </NButton>
            </div>
            <NTag
              v-for="convKnowledge in tmpConv.convKnowledgeList" :key="convKnowledge.uuid" closable class="mr-2"
              @close="handleRemoveKnowledge(convKnowledge.id)"
            >
              {{ convKnowledge.title }}
            </NTag>
          </div>
          <div v-show="knowledgeModalShow" class="p-2">
            <ConvKnowledgeSelector
              :tmp-save="true" :conversation="tmpConv"
              @selected-changed="handleKnowledgeSelectedChanged"
            />
          </div>
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
            <NButton type="primary" size="tiny" text tag="a" @click="gotoMcp">
              去启用更多AI工具
            </NButton>
          </div>
          <NCheckboxGroup v-model:value="tmpConv.mcpIds" class="flex flex-wrap space-x-2">
            <NCheckbox
              v-for="userMcp in mcpStore.myUserMcpList" :key="userMcp.uuid" :value="userMcp.mcpInfo.id"
              :label="userMcp.mcpInfo.title"
            />
          </NCheckboxGroup>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex space-x-2 font-bold">
            AI回复内容格式
            <NTooltip trigger="hover">
              <template #trigger>
                <NIcon style="margin-top: 0.2rem">
                  <QuestionCircle16Regular />
                </NIcon>
              </template>
              <span>
                自动：AI的回复内容格式跟用户一致，<br>
                如用户以文字输入，则AI会以文字回复，如用户以语音输入，则AI以语音回复<br>
                文字：AI以文字回复<br>
                语音：AI以语音回复
              </span>
            </NTooltip>
          </div>
          <NRadioGroup
            :value="tmpConv.answerContentType" name="answerTypeRadio" class="flex flex-col space-y-2"
            size="small" @update:value="(checked) => tmpConv.answerContentType = checked"
          >
            <NRadio :value="1">
              自动
            </NRadio>
            <NRadio :value="2">
              文字
            </NRadio>
            <NRadio :value="3">
              语音
            </NRadio>
          </NRadioGroup>
        </div>
        <div class="flex flex-col space-y-2">
          <div class="flex space-x-2 font-bold">
            是否自动播放AI的回复语音
            <NTooltip trigger="hover">
              <template #trigger>
                <NIcon style="margin-top: 0.2rem">
                  <QuestionCircle16Regular />
                </NIcon>
              </template>
              <span>
                当AI回复格式是语音时，是否需要自动播放内容
              </span>
            </NTooltip>
          </div>
          <NCheckbox
            :checked="tmpConv.isAutoplayAnswer" label="是"
            @update:checked="(checked) => tmpConv.isAutoplayAnswer = checked"
          />
        </div>
      </div>
    </div>
    <NFlex justify="space-between" class="mt-2">
      <NPopconfirm placement="top" @positive-click.stop="handleDeleteDebounce(tmpConv.uuid, $event)">
        <template #trigger>
          <NButton type="error" text tag="a" :loading="submitting" :disabled="submitting">
            {{ $t('common.delete') }}
          </NButton>
        </template>
        确定删除 {{ tmpConv.title }} 角色？
      </NPopconfirm>
      <NButton type="primary" :loading="submitting" :disabled="submitting" @click="handleEdit()">
        {{ $t('common.save') }}
      </NButton>
    </NFlex>
  </div>
</template>
