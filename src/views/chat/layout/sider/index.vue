<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NButton, NInput, NLayoutSider, NModal, NSpace, useMessage } from 'naive-ui'
import List from './List.vue'
// import Footer from './Footer.vue'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import api from '@/api'
import { t } from '@/locales'

const appStore = useAppStore()
const chatStore = useChatStore()
const ms = useMessage()
const convSaving = ref<boolean>(false)
const showModal = ref<boolean>(false)
const tmpTitle = ref<string>('')
const tmpRemark = ref<string>('')

const { isMobile } = useBasicLayout()
// const show = ref(false)

const collapsed = computed(() => appStore.siderCollapsed)

function handleAdd() {
  if (chatStore.allConvsCount >= 50) {
    ms.warning(t('chat.converstaionReachLimit50'), {
      duration: 1000,
    })
    return
  }
  showModal.value = true
  // chatStore.addConv(defaultConv())
  // if (isMobile.value)
  //   appStore.setSiderCollapsed(true)
}

async function handleSave(event?: KeyboardEvent) {
  event?.stopPropagation()
  if (!tmpTitle.value) {
    ms.error('标题不能为空', {
      duration: 2000,
    })
    return
  }
  convSaving.value = true
  const params = { title: tmpTitle.value, aiSystemMessage: tmpRemark.value }
  try {
    const { data: newConv } = await api.convAdd<Chat.Conversation>(params)
    chatStore.addConv(newConv)

    showModal.value = false
    tmpTitle.value = ''
    tmpRemark.value = ''
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
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed" :collapsed-width="0" :width="260" :show-trigger="isMobile ? false : true"
    position="absolute" bordered :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full" :style="mobileSafeArea">
      <main class="flex flex-col flex-1 min-h-0">
        <div class="p-4">
          <NButton dashed block @click="handleAdd">
            {{ $t('chat.newChatButton') }}
          </NButton>
        </div>
        <div class="flex-1 min-h-0 pb-4 overflow-hidden">
          <List />
        </div>
        <!-- <div class="p-4">
          <NButton block @click="show = true">
            {{ $t('store.siderButton') }}
          </NButton>
        </div> -->
      </main>
      <!-- <Footer /> -->
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 bg-black/40" @click="handleUpdateCollapsed" />
  </template>
  <NModal v-model:show="showModal" style="width: 90%; max-width: 640px" preset="card">
    <NSpace vertical justify="space-between">
      <NInput v-model:value="tmpTitle" type="text" size="large" :placeholder="$t('store.title')" />
      <NInput v-model:value="tmpRemark" type="textarea" size="large" :placeholder="$t('setting.role')" />
      <NButton block type="primary" @click="handleSave()">
        {{ $t('common.save') }}
      </NButton>
    </NSpace>
  </NModal>
</template>
