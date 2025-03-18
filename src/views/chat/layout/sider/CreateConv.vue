<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import { NButton, NFlex, NFormItem, NInput, NList, NListItem, NModal, NScrollbar, NTabPane, NTabs, NThing, useMessage } from 'naive-ui'
import { useAuthStore, useChatStore } from '@/store'
import api from '@/api'

const authStore = useAuthStore()
const authStoreRef = ref<AuthState>(authStore)
const convSaving = ref<boolean>(false)
const loadingPresetConvs = ref<boolean>(false)
const loadingRels = ref<boolean>(false)
const tmpTitle = ref<string>('')
const tmpRemark = ref<string>('')
const tmpAiSystemMessage = ref<string>('')
const showModal = ref<boolean>(false)
const chatStore = useChatStore()
const ms = useMessage()

async function searchPresetConvs() {
  if (loadingPresetConvs.value)
    return

  loadingPresetConvs.value = true
  try {
    const { success, data: convs } = await api.searchPresetConvs<PageResponse>()
    if (success)
      chatStore.setPresetConvs(convs.records)
  } finally {
    loadingPresetConvs.value = false
  }
}

async function searchPresetConvRel() {
  if (loadingRels.value)
    return

  loadingRels.value = true
  try {
    const { success, data: rels } = await api.listConvPresetRels<Chat.ConvToPresetRel[]>()
    if (success && rels && rels.length > 0)
      chatStore.setUsedPresetConv(rels)
  } finally {
    loadingRels.value = false
  }
}

async function handleSave(event?: KeyboardEvent) {
  event?.stopPropagation()
  if (!tmpTitle.value) {
    ms.error('标题不能为空', {
      duration: 2000,
    })
    return
  }
  if (convSaving.value)
    return

  convSaving.value = true
  const params = { title: tmpTitle.value, remark: tmpRemark.value, aiSystemMessage: tmpAiSystemMessage.value }
  try {
    const { data: newConv } = await api.convAdd<Chat.Conversation>(params)
    chatStore.addConvAndActive(newConv)

    tmpTitle.value = ''
    tmpAiSystemMessage.value = ''
  } catch (error: any) {
    console.log('addConv error', error)
    if (error.message) {
      ms.error(error.message, {
        duration: 2000,
      })
    }
  } finally {
    convSaving.value = false
    showModal.value = false
  }
}

async function handleUsePresetConv(presetConvUuid: string) {
  if (convSaving.value)
    return

  convSaving.value = true
  try {
    const { data: newConv } = await api.convAddByPreset<Chat.Conversation>({ presetConvUuid })
    chatStore.addConvAndActive(newConv)

    showModal.value = false
  } catch (error: any) {
    console.log('addConv error', error)
    if (error.message) {
      ms.error(error.message, {
        duration: 2000,
      })
    }
  } finally {
    convSaving.value = false
  }

  await searchPresetConvRel()
}

watch(
  () => authStoreRef.value.token,
  (newVal) => {
    if (newVal) {
      searchPresetConvs()
      searchPresetConvRel()
    }
  },
)

onMounted(async () => {
  if (authStoreRef.value.token) {
    searchPresetConvs()
    searchPresetConvRel()
  }
})

function toggleModal() {
  showModal.value = !showModal.value
}
defineExpose({ toggleModal })
</script>

<template>
  <NModal v-model:show="showModal" style="min-width:200px; width: 60%;" preset="card">
    <NTabs type="line" justify-content="space-evenly" animated>
      <NTabPane name="newConv" tab="新的角色">
        <NFlex class="grow" justify="space-between" vertical>
          <NFormItem label="名称" :show-feedback="false" :show-require-mark="true">
            <NInput v-model:value="tmpTitle" type="text" size="large" placeholder="如：李白" />
          </NFormItem>
          <NFormItem label="备注" :show-feedback="false">
            <NInput v-model:value="tmpRemark" type="text" size="large" placeholder="如：多年写诗经验" />
          </NFormItem>
          <NFormItem label="角色设定" :show-feedback="false">
            <NInput
              v-model:value="tmpAiSystemMessage" type="textarea" size="large"
              placeholder="如：你是唐朝的李白，诗才出众，被誉为诗仙"
            />
          </NFormItem>
          <NButton block type="primary" @click="handleSave()">
            {{ $t('common.save') }}
          </NButton>
        </NFlex>
      </NTabPane>
      <NTabPane name="presetConv" tab="预设角色">
        <NScrollbar class="max-h-96">
          <NList hoverable bordered>
            <NListItem v-for="presetConv in chatStore.presetConvs" :key="presetConv.id">
              <NThing :title="presetConv.title" content-style="margin-top: 10px;">
                {{ presetConv.remark }}
              </NThing>
              <template #suffix>
                <template v-if="presetConv.used">
                  <NButton size="small" disabled>
                    已使用
                  </NButton>
                </template>
                <template v-else>
                  <NButton size="small" @click="handleUsePresetConv(presetConv.uuid)">
                    使用
                  </NButton>
                </template>
              </template>
            </NListItem>
          </NList>
        </NScrollbar>
      </NTabPane>
    </NTabs>
  </NModal>
</template>
