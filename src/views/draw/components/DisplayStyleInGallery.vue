<script setup lang='ts'>
import { ref } from 'vue'
import { NButton, NEmpty, NFlex, NIcon, NImage, NImageGroup, NModal, NSpin, useDialog, useMessage } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { Reload } from '@vicons/ionicons5'
import { useScroll } from '../../chat/hooks/useScroll'
import { useAuthStore, useDrawStore, useGalleryStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import LoginTip from '@/views/user/LoginTip.vue'
import NoPic from '@/assets/no_pic.png'
import api from '@/api'
import { t } from '@/locales'

const props = withDefaults(defineProps<Props>(), {
  draws: () => [],
  delBtnEnable: true,
  starBtnEnable: true,
})
const emit = defineEmits<Emit>()
const { scrollRef, scrollToTop, scrollToBottom } = useScroll()
const dialog = useDialog()
const authStore = useAuthStore()
const galleryStore = useGalleryStore()
const ms = useMessage()
const { isMobile } = useBasicLayout()
const drawStore = useDrawStore()
const showDetailModal = ref<boolean>(false)
const modalData = ref<ModalData>({ uuid: '', url: '', prompt: '', modelName: '', star: false })
let prevScrollTop = 0

interface ModalData {
  uuid: string
  url: string
  prompt: string
  modelName: string
  star: boolean
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
  if (modalData.value.star) {
    dialog.warning({
      title: '是否要删除该收藏',
      content: '从收藏列表中删除该绘图',
      positiveText: t('common.yes'),
      negativeText: t('common.no'),
      onPositiveClick: async () => {
        galleryStore.unStarDraw(uuid)
        await api.drawStarOrUnStar(uuid)
      },
    })
  } else {
    const { data } = await api.drawStarOrUnStar<Chat.Draw>(uuid)
    galleryStore.starDraw(data)
    ms.success('success')
  }
}
function openImage(imageUrl: string, item: Chat.Draw) {
  showDetailModal.value = true
  // 将小图路径换成大图
  modalData.value.url = imageUrl.replace('thumbnail', 'image')
  modalData.value.uuid = item.uuid
  modalData.value.prompt = item.prompt || ''
  modalData.value.modelName = item.aiModelName
  modalData.value.star = item.isStar
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
              <template v-for="(item) of props.draws" :key="item.uuid">
                <template v-if="item.uuid === drawStore.loadingUuid">
                  <NSpin size="medium">
                    <template #icon>
                      <NIcon>
                        <Reload />
                      </NIcon>
                    </template>
                  </NSpin>
                </template>
                <template v-else>
                  <template
                    v-if="item.uuid !== drawStore.loadingUuid && item.processStatus === 2"
                  >
                    <NEmpty :description="`异常：${item.processStatusRemark}`" />
                  </template>
                  <template
                    v-else-if="item.uuid !== drawStore.loadingUuid && (!item.imageUrls || item.imageUrls.length === 0)"
                  >
                    <NEmpty description="找不到图片" />
                  </template>
                  <template v-else-if="item.imageUrls && item.imageUrls.length > 0">
                    <template v-for="imageUrl in item.imageUrls" :key="imageUrl">
                      <NImage
                        v-if="imageUrl && item.uuid !== drawStore.loadingUuid" width="200"
                        :src="`/api${imageUrl}?token=${authStore.token}`" :fallback-src="NoPic" object-fit="scale-down"
                        preview-disabled @click="openImage(imageUrl, item)"
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
            <NFlex>提示词：{{ modalData.prompt }}</NFlex>
            <NFlex>模型：{{ modalData.modelName }}</NFlex>
            <NFlex justify="end">
              <NButton v-show="props.starBtnEnable" quaternary type="info" @click="handleStar(modalData.uuid)">
                {{ modalData.star ? '取消收藏' : '收藏' }}
              </NButton>
              <NButton v-show="props.delBtnEnable" quaternary type="error" @click="handleDelDraw(modalData.uuid, modalData.prompt)">
                删除
              </NButton>
            </NFlex>
          </NFlex>
        </template>
      </NModal>
    </div>
  </div>
</template>
