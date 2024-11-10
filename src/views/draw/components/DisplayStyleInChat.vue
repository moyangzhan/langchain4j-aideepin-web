<script setup lang='ts'>
import { storeToRefs } from 'pinia'
import { NIcon } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { nextTick } from 'vue'
import { useScroll } from '../../chat/hooks/useScroll'
import { Message } from '../../chat/components'
import { useDrawStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
const emit = defineEmits<Emit>()
const { scrollRef, scrollToBottom } = useScroll()
const { isMobile } = useBasicLayout()
const drawStore = useDrawStore()
const { aiImages } = storeToRefs<any>(drawStore)
let prevScrollTop: number

interface Emit {
  (e: 'del', uuid: string): void
  (e: 'delOneImage', uuid: string, fileUrl: string): void
  (e: 'loadMore'): void
}
async function handleScroll(event: any) {
  // 聊天模式时拉到最上面时加载新数据，画廊模式拉到最下面加载新数据
  const scrollTop = event.target.scrollTop
  if (
    scrollTop < 50
    && (scrollTop < prevScrollTop || prevScrollTop === undefined)
  ) {
    emit('loadMore')
    nextTick(() => {
      console.log('loadMoreloadMoreloadMore', event)
      if (!event)
        scrollToBottom()

      // else {
      //   scrollTo(event.target.scrollHeight - scrollTop)
      // }
      // else {
      //   scrollTo(scrollTop)
      // }
    })
  }
  prevScrollTop = scrollTop
}
function dataLoaded() {
  scrollToBottom()
}
function handleDelete(uuid: string) {
  emit('del', uuid)
}
function handleDelOneImage(uuid: string, fileUrl: string) {
  emit('delOneImage', uuid, fileUrl)
}
defineExpose({ dataLoaded })
</script>

<template>
  <div ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
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
              :image-urls="item.imageUrlList" :inversion="false" type="image"
              @del-one-image="(fileUrl: string) => handleDelOneImage(item.uuid, fileUrl)"
            />
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
