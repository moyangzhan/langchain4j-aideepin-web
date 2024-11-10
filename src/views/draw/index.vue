<script setup lang='ts'>
import { computed, nextTick, onMounted, ref } from 'vue'
import { NFlex, NRadio, NRadioGroup, useLoadingBar, useMessage } from 'naive-ui'
import type { MessageReactive } from 'naive-ui'
import DisplayStyleInChat from './components/DisplayStyleInChat.vue'
import DisplayStyleInGallery from './components/DisplayStyleInGallery.vue'
import Dalle2Editor from './components/dalle2/Dalle2Editor.vue'
import Dalle3Editor from './components/dalle3/Dalle3Editor.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useDrawStore } from '@/store'
import api from '@/api'
import { debounce } from '@/utils/functions/debounce'

const appStore = useAppStore()
const ms = useMessage()
const loaddingBar = useLoadingBar()
const { isMobile } = useBasicLayout()
const chatStyleViewRef = ref()
const galleryStyleViewRef = ref()
const drawStore = useDrawStore()
const loading = ref<boolean>(false)
const loadedAll = ref<boolean>(false)
const nextPageMaxImageId = ref<number>(Number.MAX_SAFE_INTEGER)
const selectedDisplayStyle = ref<string>('chatStyle')
let loadingms: MessageReactive

async function loadNextPage(event?: any) {
  if (loading.value)
    return

  if (loadedAll.value)
    return

  loaddingBar.start()
  loading.value = true
  try {
    const { data } = await api.fetchAiImages<Chat.AiImageListResp>(nextPageMaxImageId.value, 20)
    if (data.imageItems.length > 0) {
      nextPageMaxImageId.value = data.minId
      drawStore.unshiftImages(data.imageItems)
      nextTick(() => {
        chatStyleViewRef.value.dataLoaded()
      })
    } else {
      loadedAll.value = true
      loadingms = ms.warning('没有更多了', {
        duration: 3000,
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    loaddingBar.finish()
  }
}

const handleLoadMoreImages = debounce(loadNextPage, 300)

/**
 * 删除一个作图任务（包括提示词及生成的图片）
 */
async function handleDelete(uuid: string) {
  console.log(`delete image,uuid:${uuid}`)
  if (loading.value)
    return

  const ret = await api.imageDel<boolean>(uuid)
  if (ret)
    drawStore.deleteAiImage(uuid)
}

/**
 * 删除作图任务中的一张图片
 */
async function handleDelOneImage(uuid: string, fileUrl: string) {
  if (loading.value)
    return
  const fileUuid = fileUrl.replace('/image/', '')
  const ret = await api.aiImageFileDel<boolean>(uuid, fileUuid)
  if (ret)
    drawStore.deleteOneFile(uuid, fileUuid)
}

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

function submitted() {
  chatStyleViewRef.value.dataLoaded()
  galleryStyleViewRef.value.dataLoaded()
}

function handleChangeModel(value: string) {
  appStore.setSelectedImageModel(value)
}

function handleDisplayChange(value: string) {
  selectedDisplayStyle.value = value
}

onMounted(() => {
  handleLoadMoreImages()
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <main class="flex-1 overflow-hidden">
      <NFlex justify="space-between" class="w-full max-w-screen-xl m-auto" :class="[isMobile ? 'p-2' : 'px-4 pb-4']">
        <NRadioGroup
          :value="appStore.selectedImageModel.modelId" name="imageModelRadioGroup" size="small"
          @update:value="handleChangeModel"
        >
          <NRadio v-for="imageModel in appStore.imageModels" :key="imageModel.modelId" :value="imageModel.modelId">
            {{ imageModel.modelName }}
          </NRadio>
        </NRadioGroup>
        <NRadioGroup
          :value="selectedDisplayStyle" name="displayStyleRadioGroup" size="small"
          @update:value="handleDisplayChange"
        >
          <NRadio value="chatStyle">
            聊天风格
          </NRadio>
          <NRadio value="galleryStyle">
            画廊风格
          </NRadio>
        </NRadioGroup>
      </NFlex>
      <DisplayStyleInChat
        v-show="selectedDisplayStyle === 'chatStyle'" ref="chatStyleViewRef" @del="handleDelete"
        @del-one-image="handleDelOneImage" @load-more="handleLoadMoreImages"
      />
      <DisplayStyleInGallery
        v-show="selectedDisplayStyle === 'galleryStyle'" ref="galleryStyleViewRef"
        @del="handleDelete" @del-one-image="handleDelOneImage" @load-more="handleLoadMoreImages"
      />
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <Dalle2Editor v-show="appStore.selectedImageModel.modelName === 'dall-e-2'" @submitted="submitted" />
        <Dalle3Editor v-show="appStore.selectedImageModel.modelName === 'dall-e-3'" @submitted="submitted" />
      </div>
    </footer>
  </div>
</template>

<style>
.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.5s ease;
}

.collapse-enter,
.collapse-leave-to {
  height: 0;
  overflow: hidden;
}
</style>
