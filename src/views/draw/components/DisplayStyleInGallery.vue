<script setup lang='ts'>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { NEmpty, NFlex, NIcon, NImage, NImageGroup, NModal } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { useAuthStore, useDrawStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'

import NoPic from '@/assets/no_pic.png'
const emit = defineEmits<Emit>()
const authStore = useAuthStore()
const token = ref<string>(authStore.token)
const { isMobile } = useBasicLayout()
const drawStore = useDrawStore()
const { aiImages } = storeToRefs<any>(drawStore)
const showDetailModal = ref<boolean>(false)
const modalData = ref<ModalData>({ uuid: '', url: '', prompt: '' })

interface ModalData {
  uuid: string
  url: string
  prompt: string
}

interface Emit {
  (e: 'del', uuid: string): void
}

function handleDelete(uuid: string) {
  emit('del', uuid)
}

function openImage(imageUrl: string, item: Chat.AiImageItem) {
  showDetailModal.value = true
  modalData.value.url = imageUrl
  modalData.value.uuid = item.uuid
  modalData.value.prompt = item.prompt || ''
  console.log(item)
}
</script>

<template>
  <div>
    <div id="image-wrapper" class="w-full max-w-screen-xl m-auto dark:bg-[#101014]" :class="[isMobile ? 'p-2' : 'p-4']">
      <template v-if="!aiImages.length">
        <div class="flex items-center justify-center mt-4 text-center text-neutral-400">
          <NIcon :component="Cat" size="32" />
          <span class="pl-1">Roar~</span>
        </div>
      </template>
      <template v-else>
        <NImageGroup>
          <NFlex>
            <template v-for="(item) of aiImages" :key="item.uuid">
              <template v-if="!item.imageUrlList || item.imageUrlList.length === 0">
                <NEmpty description="找不到图片" />
              </template>
              <template v-if="item.imageUrlList && item.imageUrlList.length > 0">
                <template v-for="imageUrl in item.imageUrlList" :key="imageUrl">
                  <NImage
                    v-if="imageUrl" width="200" :src="`/api${imageUrl}?token=${token}`" :fallback-src="NoPic"
                    object-fit="scale-down" preview-disabled @click="openImage(imageUrl, item)"
                    @delete="handleDelete(item.uuid)"
                  />
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
          v-if="modalData.url" :src="`/api${modalData.url}?token=${token}`" :fallback-src="NoPic"
          object-fit="scale-down" preview-disabled
        />
      </NFlex>
      <template #footer>
        提示词：{{ modalData.prompt }}
      </template>
    </NModal>
  </div>
</template>
