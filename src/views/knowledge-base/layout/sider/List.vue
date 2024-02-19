<script setup lang='ts'>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NIcon, NScrollbar } from 'naive-ui'
import { Cloud32Regular, LockClosed32Regular } from '@vicons/fluent'
import { SvgIcon } from '@/components/common'
import { useAuthStore, useKbStore } from '@/store'
import api from '@/api'

const router = useRouter()
const currentPage = ref<number>(1)
const pageSize = 20
const kbStore = useKbStore()
const { activeKbUuid, kbInfos } = storeToRefs<any>(kbStore)
const authStore = useAuthStore()
const authStoreRef = ref<AuthState>(authStore)

async function handleSelect({ uuid }: KnowledgeBase.Info) {
  if (activeKbUuid.value === uuid)
    return
  kbStore.setActive(uuid)
  router.replace({ name: 'QADetail', params: { kbUuid: activeKbUuid.value } })
}

async function initList() {
  if (kbStore.loaddingKbList || kbStore.kbInfos.length > 0)
    return

  kbStore.setLoadingKbList(true)
  try {
    const { data } = await api.knowledgeBaseSearch<KnowledgeBase.InfoListResp>('', true, currentPage.value, pageSize)
    if (data.records) {
      kbStore.setKbInfos(data.records)
      nextTick(() => {
        if (!activeKbUuid.value) {
          kbStore.setActive(kbInfos.value[0].uuid)
          router.replace({ name: 'QADetail', params: { kbUuid: activeKbUuid.value } })
        }
      })
    }
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
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!kbInfos.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="(item, index) of kbInfos" :key="index">
          <a
            class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
            :class="item.uuid === activeKbUuid && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]', 'pr-14']"
            @click="handleSelect(item)"
          >
            <span>
              <NIcon v-if="item.isPublic" :component="Cloud32Regular" />
              <NIcon v-if="!item.isPublic" :component="LockClosed32Regular" />
            </span>
            <div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
              <span>{{ item.title }}</span>
            </div>
          </a>
        </div>
      </template>
    </div>
  </NScrollbar>
</template>
