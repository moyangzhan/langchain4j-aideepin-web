<script setup lang='ts'>
import { storeToRefs } from 'pinia'
import { NIcon } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { nextTick, watch } from 'vue'
import { useScroll } from '../../chat/hooks/useScroll'
import Message from './Message/index.vue'
import { useAuthStore, useDrawStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import LoginTip from '@/views/user/LoginTip.vue'

const emit = defineEmits<Emit>()
const { scrollRef, scrollToBottom, scrollTo } = useScroll()
const { isMobile } = useBasicLayout()
const drawStore = useDrawStore()
const authStore = useAuthStore()
const { myDraws } = storeToRefs<any>(drawStore)
let prevScrollTop: number

interface Emit {
  (e: 'setPublic', uuid: string, isPublicOrPrivate: boolean): void
  (e: 'delDraw', uuid: string, prompt: string): void
  (e: 'delOneImage', uuid: string, fileUrl: string): void
  (e: 'loadMore', callback: Function): void
}
async function handleScroll(event: any) {
  // 聊天模式时拉到最上面时加载新数据，画廊模式拉到最下面加载新数据
  const scrollTop = event.target.scrollTop
  if (
    scrollTop < 50
    && (scrollTop < prevScrollTop || prevScrollTop === undefined)
  ) {
    const lastScrollClient = event.target.scrollHeight
    emit('loadMore', () => {
      nextTick(() => {
        scrollTo(event.target.scrollHeight - lastScrollClient)
        prevScrollTop = event.target.scrollTop
      })
    })
  }
  prevScrollTop = scrollTop
}

watch(
  () => drawStore.myDraws,
  (newVal, oldVal) => {
    if ((!oldVal || oldVal.length === 0) && newVal.length > 0) {
      console.log('scrollToBottom')
      scrollToBottom()
    }
  },
)

function handleSetPublic(uuid: string, isPublic: boolean) {
  emit('setPublic', uuid, isPublic)
}
function handleDelDraw(uuid: string, prompt: string) {
  emit('delDraw', uuid, prompt)
}
function handleDelOneImage(uuid: string, fileUrl: string) {
  emit('delOneImage', uuid, fileUrl)
}

function gotoBottom() {
  scrollToBottom()
}

defineExpose({ gotoBottom })
</script>

<template>
  <div ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
    <div class="w-full max-w-screen-xl m-auto dark:bg-[#101014]" :class="[isMobile ? 'p-2' : 'p-4']">
      <LoginTip v-if="!authStore.token" />
      <template v-else-if="myDraws.length === 0">
        <div class="flex items-center justify-center mt-4 text-center text-neutral-400">
          <NIcon :component="Cat" size="32" />
          <span class="pl-1">Roar~</span>
        </div>
      </template>
      <template v-else>
        <div>
          <template v-for="(item) of myDraws" :key="item.uuid">
            <!-- 增加显示绘图统计数据，如starCount,isPublic -->
            <Message
              v-if="item.interactingMethod === 1" :date-time="item.createTime" :text="item.prompt"
              :is-public="item.isPublic" :inversion="true" type="text" @delete="handleDelDraw(item.uuid, item.prompt)"
              @set-public="handleSetPublic(item.uuid, !item.isPublic)"
            />
            <Message
              v-if="item.interactingMethod === 2" :date-time="item.createTime" :text="item.prompt"
              :is-public="item.isPublic"
              :image-urls="[`/my-image/${item.originalImageUuid}`, `/my-image/${item.maskImageUuid}`]" :inversion="true"
              type="text-image" @delete="handleDelDraw(item.uuid, item.prompt)"
              @set-public="handleSetPublic(item.uuid, !item.isPublic)"
            />
            <Message
              v-if="item.interactingMethod === 3" :date-time="item.createTime" :is-public="item.isPublic"
              :image-urls="[`/my-image/${item.originalImageUuid}`]" :inversion="true" type="image"
              @delete="handleDelDraw(item.uuid, item.prompt)"
              @set-public="handleSetPublic(item.uuid, !item.isPublic)"
            />
            <Message
              :date-time="item.createTime" :loading="item.uuid === drawStore.loadingUuid"
              :is-public="item.isPublic" :image-urls="item.imageUrls" :inversion="false" type="image"
              @del-one-image="(fileUrl: string) => handleDelOneImage(item.uuid, fileUrl)"
            />
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
