<script setup lang='ts'>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NScrollbar, NTabPane, NTabs } from 'naive-ui'
import SubList from './SubList.vue'
import { useAuthStore, useKbStore } from '@/store'
import api from '@/api'

const router = useRouter()
const currentPage = ref<number>(1)
const pageSize = 20
const kbStore = useKbStore()
const { activeKbUuid, myKbInfos, publicKbInfos } = storeToRefs<any>(kbStore)
const authStore = useAuthStore()
const authStoreRef = ref<AuthState>(authStore)

async function initList() {
  if (kbStore.loaddingKbList || kbStore.myKbInfos.length > 0)
    return

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

watch(
  () => authStoreRef.value.token,
  (newVal) => {
    if (newVal) {
      console.log('token change, reaload')
      initList()
    }
  },
  { immediate: true },
)

onMounted(() => {
  console.log('list onMounted')
})
</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col text-sm">
      <NTabs type="line" justify-content="space-evenly" animated>
        <NTabPane name="mine" tab="我的" size="small">
          <SubList :list="myKbInfos" :active-kb-uuid="activeKbUuid" />
        </NTabPane>
        <NTabPane name="public" tab="公开">
          <SubList :list="publicKbInfos" :active-kb-uuid="activeKbUuid" />
        </NTabPane>
      </NTabs>
    </div>
  </NScrollbar>
</template>
