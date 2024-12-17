<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NFlex, NRadio, NRadioGroup, useLoadingBar, useMessage } from 'naive-ui'
import DisplayStyleInChat from './components/DisplayStyleInChat.vue'
import DisplayStyleInGallery from './components/DisplayStyleInGallery.vue'
import Dalle2Editor from './components/dalle2/Dalle2Editor.vue'
import Dalle3Editor from './components/dalle3/Dalle3Editor.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useDrawStore } from '@/store'
import api from '@/api'
import { debounce } from '@/utils/functions/debounce'

const appStore = useAppStore()
const ms = useMessage()
const loaddingBar = useLoadingBar()
const { isMobile } = useBasicLayout()
const authStore = useAuthStore()
const drawStore = useDrawStore()
const chatStyleViewRef = ref()
const galleryStyleViewRef = ref()
const loading = ref<boolean>(false)
const loadedAll = ref<boolean>(false)
const nextPageMaxImageId = ref<number>(Number.MAX_SAFE_INTEGER)
const selectedDisplayStyle = ref<string>('chatStyle')

async function loadNextPage(callback: Function) {
  if (loading.value)
    return

  if (loadedAll.value)
    return

  loaddingBar.start()
  loading.value = true
  try {
    const { data } = await api.fetchDraws<Chat.DrawListResp>(nextPageMaxImageId.value, 20)
    if (data.draws.length > 0) {
      nextPageMaxImageId.value = data.minId
      drawStore.unshiftImages(data.draws)
    } else {
      loadedAll.value = true
      ms.warning('没有更多了', {
        duration: 3000,
      })
    }

    callback()
    console.log('draw loadNextPage')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    loaddingBar.finish()
  }
}

const handleLoadMoreDraws = debounce(loadNextPage, 300)

/**
 * 删除作图任务中的一张图片
 */
async function handleDelOneImage(uuid: string, fileUrl: string) {
  if (loading.value)
    return
  const fileUuid = fileUrl.replace('/image/', '')
  const ret = await api.drawFileDel<boolean>(uuid, fileUuid)
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
  chatStyleViewRef.value.gotoBottom()
  galleryStyleViewRef.value.gotoTop()
}

function handleChangeModel(value: string) {
  appStore.setSelectedImageModel(value)
}

function handleDisplayChange(value: string) {
  selectedDisplayStyle.value = value
}

watch(
  () => authStore.token,
  () => {
    if (authStore.token) {
      console.log('draw first load', authStore.token)
      handleLoadMoreDraws(() => {
        console.log('draw loaded first page')
        chatStyleViewRef.value.gotoBottom()
        galleryStyleViewRef.value.gotoTop()
      })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <header>
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
    </header>
    <main class="flex-1 overflow-hidden">
      <DisplayStyleInChat
        v-show="selectedDisplayStyle === 'chatStyle'" ref="chatStyleViewRef"
        @del-one-image="handleDelOneImage" @load-more="handleLoadMoreDraws"
      />
      <DisplayStyleInGallery
        v-show="selectedDisplayStyle === 'galleryStyle'" ref="galleryStyleViewRef"
        :draws="drawStore.imagesOrderByIdDesc" @load-more="handleLoadMoreDraws"
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
