<script setup lang='ts'>
import { useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import { Cloud32Regular, LockClosed32Regular } from '@vicons/fluent'
import { useKbStore } from '@/store'
import { SvgIcon } from '@/components/common'
const props = defineProps<Props>()
const router = useRouter()
const kbStore = useKbStore()

interface Props {
  list: KnowledgeBase.Info[]
  activeKbUuid: string
}
async function handleSelect({ uuid }: KnowledgeBase.Info) {
  if (props.activeKbUuid === uuid)
    return
  kbStore.setActive(uuid)
  router.replace({ name: 'QADetail', params: { kbUuid: props.activeKbUuid } })
}
</script>

<template>
  <template v-if="!list.length">
    <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
      <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
      <span>{{ $t('common.noData') }}</span>
    </div>
  </template>
  <template v-else>
    <div class="flex flex-col gap-2 text-sm">
      <div v-for="(item, index) of list" :key="index">
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
    </div>
  </template>
</template>
