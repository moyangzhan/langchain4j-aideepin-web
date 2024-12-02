<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import { NFlex, NRadio, NRadioGroup, useLoadingBar, useMessage } from 'naive-ui'
import DisplayStyleInGallery from '../draw/components/DisplayStyleInGallery.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useGalleryStore } from '@/store'
import api from '@/api'
import { debounce } from '@/utils/functions/debounce'

const ms = useMessage()
const loaddingBar = useLoadingBar()
const { isMobile } = useBasicLayout()
const publicViewRef = ref()
const favViewRef = ref()
const galleryStore = useGalleryStore()
const loadingPublic = ref<boolean>(false)
const loadedPublicAll = ref<boolean>(false)
const loadingFav = ref<boolean>(false)
const loadedFavAll = ref<boolean>(false)
const nextPageMaxIdByPublic = ref<number>(Number.MAX_SAFE_INTEGER)
const nextPageMaxIdByStar = ref<number>(Number.MAX_SAFE_INTEGER)
const publicOrFavor = ref<string>('publicView')

/**
 * 加载公开列表
 */
async function loadNextPublicPage() {
  if (loadingPublic.value)
    return

  if (loadedPublicAll.value)
    return

  loaddingBar.start()
  loadingPublic.value = true
  try {
    const { data } = await api.fetchPublicDraws<Chat.DrawListResp>(nextPageMaxIdByPublic.value, 20)
    if (data.draws.length > 0) {
      nextPageMaxIdByPublic.value = data.minId
      galleryStore.appendPublicDraws(data.draws)
    } else {
      loadedPublicAll.value = true
      ms.warning('没有更多了', {
        duration: 3000,
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    loadingPublic.value = false
    loaddingBar.finish()
  }
}

/**
 * 加载我的点赞
 */
async function loadNextStarPage() {
  if (loadingFav.value)
    return

  if (loadedFavAll.value)
    return

  loaddingBar.start()
  loadingFav.value = true
  try {
    const { data } = await api.fetchStarDraws<Chat.DrawListResp>(nextPageMaxIdByStar.value, 20)
    if (data.draws.length > 0) {
      nextPageMaxIdByStar.value = data.minId
      galleryStore.appendStarDraws(data.draws)
    } else {
      loadedFavAll.value = true
      ms.warning('没有更多了', {
        duration: 3000,
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    loadingFav.value = false
    loaddingBar.finish()
  }
}

const handleLoadMorePublicDraws = debounce(loadNextPublicPage, 300)
const handleLoadMoreStarDraw = debounce(loadNextStarPage, 300)

function handleDisplayChange(value: string) {
  publicOrFavor.value = value
  if (publicOrFavor.value === 'favView' && galleryStore.myStarDraws.length === 0)
    handleLoadMoreStarDraw()
}

onMounted(() => {
  if (galleryStore.publicDraws.length === 0)
    handleLoadMorePublicDraws()
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <main class="flex-1 overflow-hidden">
      <NFlex justify="space-between" class="w-full max-w-screen-xl m-auto" :class="[isMobile ? 'p-2' : 'px-4 pb-4']">
        <NRadioGroup
          :value="publicOrFavor" name="displayStyleRadioGroup" size="small"
          @update:value="handleDisplayChange"
        >
          <NRadio value="publicView">
            公开图片
          </NRadio>
          <NRadio value="favView">
            我的点赞
          </NRadio>
        </NRadioGroup>
      </NFlex>
      <DisplayStyleInGallery
        v-show="publicOrFavor === 'publicView'" ref="publicViewRef"
        :draws="galleryStore.publicDraws"
        :del-btn-enable="false"
        @load-more="handleLoadMorePublicDraws"
      />
      <DisplayStyleInGallery
        v-show="publicOrFavor === 'favView'" ref="favViewRef"
        :draws="galleryStore.myStarDraws"
        :del-btn-enable="false"
        :login-btn-enable="true"
        @load-more="handleLoadMoreStarDraw"
      />
    </main>
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
