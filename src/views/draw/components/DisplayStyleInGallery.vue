<script setup lang='ts'>
import { ref } from 'vue'
import { NAvatar, NButton, NEmpty, NFlex, NIcon, NImage, NImageGroup, NModal, NSpin, NTag, useMessage } from 'naive-ui'
import { Star24Filled, Star24Regular } from '@vicons/fluent'
import { Cat } from '@vicons/fa'
import { Reload } from '@vicons/ionicons5'
import { ModelAlt } from '@vicons/carbon'
import { useScroll } from '../../chat/hooks/useScroll'
import { useAuthStore, useDrawStore, useGalleryStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import defaultAvatar from '@/assets/avatar.jpg'
import LoginTip from '@/views/user/LoginTip.vue'
import NoPic from '@/assets/no_pic.png'
import api from '@/api'

const props = withDefaults(defineProps<Props>(), {
  draws: () => [],
  delBtnEnable: true,
  starBtnEnable: true,
})
const emit = defineEmits<Emit>()
const { scrollRef, scrollToTop, scrollToBottom } = useScroll()
const authStore = useAuthStore()
const galleryStore = useGalleryStore()
const ms = useMessage()
const { isMobile } = useBasicLayout()
const drawStore = useDrawStore()
const showDetailModal = ref<boolean>(false)
const modalData = ref<ModalData>({ uuid: '', url: '', prompt: '', aiModelName: '', userUuid: '', userName: '', starCount: 0, isStar: false })
let prevScrollTop = 0

interface ModalData {
  uuid: string
  url: string
  prompt: string
  aiModelName: string
  userUuid: string
  userName: string
  isStar: boolean
  starCount: number
}

interface Emit {
  // (e: 'del', uuid: string): void
  (e: 'delDraw', uuid: string, prompt: string): void
  (e: 'toggleStar', uuid: string): void
  (e: 'loadMore', callback: Function): void
}

interface Props {
  draws: Chat.Draw[]
  delBtnEnable?: boolean
  starBtnEnable?: boolean
  loginBtnEnable?: boolean
}
function handleDelDraw(uuid: string, prompt: string) {
  showDetailModal.value = false
  emit('delDraw', uuid, prompt)
}

async function handleStar(uuid: string) {
  if (!authStore.token) {
    authStore.setLoginView(true)
    return
  }
  if (modalData.value.isStar) {
    const { data } = await api.drawStarOrUnStar<Chat.Draw>(uuid)
    Object.assign(modalData.value, data)
    galleryStore.unStarDraw(data)
  } else {
    const { data } = await api.drawStarOrUnStar<Chat.Draw>(uuid)
    galleryStore.starDraw(data)
    ms.success('success')
    Object.assign(modalData.value, data)
  }
}
function openDraw(imageUrl: string, item: Chat.Draw) {
  showDetailModal.value = true
  Object.assign(modalData.value, item)
  // 将小图路径换成大图
  modalData.value.url = imageUrl.replace('thumbnail', 'image')
  console.log(item)
}

function gotoTop() {
  scrollToTop()
}

function gotoBottom() {
  scrollToBottom()
}

async function handleScroll(event: any) {
  // 聊天模式时拉到最上面时加载新数据，画廊模式拉到最下面加载新数据
  const scrollTop = event.target.scrollTop
  if (prevScrollTop < scrollTop && event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight < 50) {
    emit('loadMore', () => {
      console.log('gallery loaded')
    })
  }
  prevScrollTop = scrollTop
}

defineExpose({ gotoTop, gotoBottom })
</script>

<template>
  <div ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
    <div>
      <div class="w-full max-w-screen-xl m-auto dark:bg-[#101014]" :class="[isMobile ? 'p-2' : 'p-4']">
        <template v-if="props.draws.length === 0">
          <div v-if="!loginBtnEnable" class="flex items-center justify-center mt-4 text-center text-neutral-400">
            <NIcon :component="Cat" size="32" />
            <span class="pl-1">Roar~</span>
          </div>
          <LoginTip v-if="loginBtnEnable && !authStore.token" />
        </template>
        <template v-else>
          <NImageGroup>
            <NFlex>
              <template v-for="draw of props.draws" :key="draw.uuid">
                <template v-if="draw.uuid === drawStore.loadingUuid">
                  <NSpin size="medium">
                    <template #icon>
                      <NIcon>
                        <Reload />
                      </NIcon>
                    </template>
                  </NSpin>
                </template>
                <template v-else>
                  <template v-if="draw.uuid !== drawStore.loadingUuid && draw.processStatus === 2">
                    <NEmpty :description="`异常：${draw.processStatusRemark}`" />
                  </template>
                  <template
                    v-else-if="draw.uuid !== drawStore.loadingUuid && (!draw.imageUrls || draw.imageUrls.length === 0)"
                  >
                    <NEmpty description="找不到图片" />
                  </template>
                  <template v-else-if="draw.imageUrls && draw.imageUrls.length > 0">
                    <template v-for="imageUrl in draw.imageUrls" :key="imageUrl">
                      <NImage
                        v-if="imageUrl && draw.uuid !== drawStore.loadingUuid" width="200"
                        :src="`/api${imageUrl}?token=${authStore.token}`" :fallback-src="NoPic" object-fit="scale-down"
                        preview-disabled @click="openDraw(imageUrl, draw)"
                      />
                    </template>
                  </template>
                </template>
              </template>
            </NFlex>
          </NImageGroup>
        </template>
      </div>
      <NModal v-model:show="showDetailModal" preset="card" style="max-width: 600px" :bordered="true">
        <NFlex justify="center">
          <NImage
            v-if="modalData.url" :src="`/api${modalData.url}?token=${authStore.token}`" :fallback-src="NoPic"
            object-fit="scale-down"
          />
        </NFlex>
        <template #footer>
          <NFlex vertical>
            <NFlex justify="space-between" aling="center">
              <!-- 不可点击按钮组 -->
              <NFlex align="center">
                <NTag size="large" :bordered="false" :color="{ color: '#ff000000' }">
                  {{ modalData.userName }}
                  <template #avatar>
                    <NAvatar
                      :src="`/api/user/avatar/${modalData.userUuid}`" size="large" :fallback-src="defaultAvatar"
                      color="#ff0000000"
                    />
                  </template>
                </NTag>
                <NTag size="medium" :bordered="false" round :color="{ color: '#ff000000' }">
                  {{ modalData.aiModelName }}
                  <template #icon>
                    <NIcon :component="ModelAlt" />
                  </template>
                </NTag>
              </NFlex>
              <!-- 可点击按钮组 -->
              <NFlex align="center">
                <NTag
                  size="medium" :bordered="false" round :color="{ color: '#ff000000' }" checkable
                  @click="handleStar(modalData.uuid)"
                >
                  {{ modalData.starCount }}
                  <template #icon>
                    <NIcon v-show="!modalData.isStar" :component="Star24Regular" />
                    <NIcon v-show="modalData.isStar" :component="Star24Filled" color="#eac54f" />
                  </template>
                </NTag>
              </NFlex>
            </NFlex>
            <NFlex>提示词：{{ modalData.prompt }}</NFlex>
            <NFlex justify="end">
              <NButton
                v-show="props.delBtnEnable" quaternary type="error"
                @click="handleDelDraw(modalData.uuid, modalData.prompt)"
              >
                删除
              </NButton>
            </NFlex>
          </NFlex>
        </template>
      </NModal>
    </div>
  </div>
</template>
