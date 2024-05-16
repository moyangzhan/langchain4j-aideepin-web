<script setup lang='ts'>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NTabPane, NTabs } from 'naive-ui'
import SubList from './SubList.vue'
import { useAuthStore, useKbStore } from '@/store'
import api from '@/api'

const router = useRouter()
const currentPage = ref<number>(1)
const pageSize = 20
const kbStore = useKbStore()
const { activeKbUuid, myKbInfos, publicKbInfos, selectedKbType, reloadKbInfosSignal } = storeToRefs<any>(kbStore)
const authStore = useAuthStore()
const authStoreRef = ref<AuthState>(authStore)

async function initList() {
  if (kbStore.loaddingKbList)
    return
  console.log('My knowledge base init')
  kbStore.setLoadingKbList(true)
  try {
    const { data } = await api.knowledgeBaseSearchMine<KnowledgeBase.InfoListResp>('', currentPage.value, pageSize)
    if (data.records) {
      kbStore.setMyKbInfos(data.records)
      nextTick(() => {
        if (!activeKbUuid.value) {
          kbStore.setActive(myKbInfos.value[0].uuid)
          router.replace({ name: 'QADetail', params: { kbUuid: activeKbUuid.value } })
        }
      })
    }

    const { data: publicData } = await api.knowledgeBaseSearchPublic<KnowledgeBase.InfoListResp>('', currentPage.value, pageSize)
    if (publicData.records)
      kbStore.setPublicKbInfos(publicData.records)
  } finally {
    kbStore.setLoadingKbList(false)
  }
}

async function initStarredList() {
  const starListResp = await api.knowledgeBaseStarListMine<KnowledgeBase.KbStarListResp>(1, 100)
  kbStore.appStarInfos(starListResp.data.records)
}

watch(
  () => authStoreRef.value.token,
  (newVal) => {
    if (newVal) {
      initList()
      initStarredList()
    }
  },
)

watch(
  () => reloadKbInfosSignal.value,
  (newVal) => {
    if (newVal) {
      try {
        initList()
        initStarredList()
      } finally {
        kbStore.setReloadKbInfosSignal(false)
      }
    }
  },
)

onMounted(() => {
  console.log('list onMounted')
  if (authStoreRef.value.token) {
    initList()
    initStarredList()
  }
})
</script>

<template>
  <NTabs v-model:value="selectedKbType" pane-class="h-full" type="line" justify-content="space-evenly" animated>
    <NTabPane name="mine" tab="我的" size="small">
      <SubList :list="myKbInfos" :active-kb-uuid="activeKbUuid" />
    </NTabPane>
    <NTabPane name="public" tab="公开">
      <SubList :list="publicKbInfos" :active-kb-uuid="activeKbUuid" />
    </NTabPane>
  </NTabs>
</template>
