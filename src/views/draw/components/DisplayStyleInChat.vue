<script setup lang='ts'>
import { storeToRefs } from 'pinia'
import { NIcon } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { Message } from '../../chat/components'
import { useDrawStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
const emit = defineEmits<Emit>()
const { isMobile } = useBasicLayout()
const drawStore = useDrawStore()
const { aiImages } = storeToRefs<any>(drawStore)

interface Emit {
  (e: 'del', uuid: string): void
}
function handleDelete(uuid: string) {
  emit('del', uuid)
}
</script>

<template>
  <div id="image-wrapper" class="w-full max-w-screen-xl m-auto dark:bg-[#101014]" :class="[isMobile ? 'p-2' : 'p-4']">
    <template v-if="!aiImages.length">
      <div class="flex items-center justify-center mt-4 text-center text-neutral-400">
        <NIcon :component="Cat" size="32" />
        <span class="pl-1">Roar~</span>
      </div>
    </template>
    <template v-else>
      <div>
        <template v-for="(item) of aiImages" :key="item.uuid">
          <Message
            v-if="item.interactingMethod === 1" :date-time="item.createTime" :text="item.prompt"
            :inversion="true" type="text" @delete="handleDelete(item.uuid)"
          />
          <Message
            v-if="item.interactingMethod === 2" :date-time="item.createTime" :text="item.prompt"
            :image-urls="[item.originalImageUrl, item.maskImageUrl]" :inversion="true" type="text-image"
            @delete="handleDelete(item.uuid)"
          />
          <Message
            v-if="item.interactingMethod === 3" :date-time="item.createTime"
            :image-urls="[item.originalImageUrl]" :inversion="true" type="image" @delete="handleDelete(item.uuid)"
          />
          <Message
            :date-time="item.createTime" :loading="item.uuid === drawStore.loadingUuid"
            :image-urls="item.imageUrlList" :inversion="false" type="image" @delete="handleDelete(item.uuid)"
          />
        </template>
      </div>
    </template>
  </div>
</template>
