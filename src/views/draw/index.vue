<script setup lang='ts'>
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { NIcon, NTab, NTabPane, NTabs, useDialog, useMessage } from 'naive-ui'
import type { MessageReactive } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { Message } from '../chat/components'
import { useScroll } from '../chat/hooks/useScroll'
import GenerateImage from './GenerateImage.vue'
import EditImage from './EditImage.vue'
import VariationImage from './VariationImage.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useDrawStore } from '@/store'
import api from '@/api'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'

interface TabObj {
  name: string
  tab: string
  defaultTab: string
}
const dialog = useDialog()
const ms = useMessage()
const { isMobile } = useBasicLayout()
const { scrollRef, scrollTo, scrollToBottom } = useScroll()
const drawStore = useDrawStore()
const { aiImages } = storeToRefs<any>(drawStore)
const tabObjs = ref<TabObj[]>([
  { name: 'tab_generate_image', defaultTab: '文生图', tab: '文生图 ↓' },
  { name: 'tab_edit_image', defaultTab: '修图', tab: '修图' },
  { name: 'tab_variation_image', defaultTab: '图生图', tab: '图生图' },
])
const tabPanelShow = ref<boolean>(true)
const loading = ref<boolean>(false)
const loadedAll = ref<boolean>(false)
const nextPageMaxImageId = ref<number>(Number.MAX_SAFE_INTEGER)
const interactingMethod = ref<string>(tabObjs.value[0].name)
let prevScrollTop: number
let loadingms: MessageReactive
let lastClickTab = tabObjs.value[0].name

async function loadNextPage(event?: any) {
  if (loading.value)
    return

  if (loadedAll.value)
    return

  loading.value = true
  loadingms && loadingms.destroy()
  loadingms = ms.loading(
    '加载中...', {
      duration: 0,
    },
  )
  let scrollPosition = 0
  if (event)
    scrollPosition = event.target.scrollHeight - event.target.scrollTop

  try {
    const { data } = await api.fetchAiImages<Chat.AiImageListResp>(nextPageMaxImageId.value, 12)
    if (data.imageItems.length > 0) {
      nextPageMaxImageId.value = data.minId
      drawStore.unshiftImages(data.imageItems)
      nextTick(() => {
        if (!event)
          scrollToBottom()
        else
          scrollTo(event.target.scrollHeight - scrollPosition)
      })
    } else {
      loadedAll.value = true
      loadingms.destroy()
      loadingms = ms.warning('没有更多了', {
        duration: 1000,
      })
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    loadingms.destroy()
  }
}

const handleLoadMoreImages = debounce(loadNextPage, 300)
async function handleScroll(event: any) {
  const scrollTop = event.target.scrollTop
  if (
    scrollTop < 50
    && (scrollTop < prevScrollTop || prevScrollTop === undefined)
  )
    handleLoadMoreImages(event)

  prevScrollTop = scrollTop
}

function handleDelete(uuid: string) {
  console.log(`delete image,uuid:${uuid}`)
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deletePromptAndImage'),
    content: t('chat.deletePromptAndImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      // delete image
      const ret = await api.imageDel<boolean>(uuid)
      if (ret)
        drawStore.deleteAiImage(uuid)
    },
  })
}
const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})

function handleScrollToBottom() {
  scrollToBottom()
}

function handleClick(tabOjb: TabObj) {
  console.log(`${interactingMethod.value},${tabOjb.name}`)
  if (lastClickTab === tabOjb.name)
    tabPanelShow.value = !tabPanelShow.value

  tabObjs.value.forEach((element) => {
    if (element.name === tabOjb.name)
      tabOjb.tab = tabPanelShow.value ? `${tabOjb.defaultTab} ↓` : `${tabOjb.defaultTab} ↑`
    else
      element.tab = element.defaultTab
  })
  lastClickTab = tabOjb.name
}

onMounted(() => {
  console.log('draw onActivated')
  handleLoadMoreImages()
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <main class="flex-1 overflow-hidden">
      <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto" @scroll="handleScroll">
        <div
          id="image-wrapper" class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
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
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <NTabs v-model:value="interactingMethod" type="line" animated default-value="tab_generate_image">
          <NTab v-for="tab in tabObjs" :key="tab.name" :name="tab.name" @click="handleClick(tab)">
            {{ tab.tab }}
          </NTab>
        </NTabs>
        <NTabs v-model:value="interactingMethod" type="line" animated default-value="tab_generate_image">
          <NTabPane
            :key="tabObjs[0].name" :name="tabObjs[0].name" display-directive="show"
            :tab-props="{ style: 'display:none' }"
          >
            <transition name="collapse">
              <GenerateImage v-show="tabPanelShow" @scroll-to-bottom="handleScrollToBottom" />
            </transition>
          </NTabPane>
          <NTabPane
            :key="tabObjs[1].name" :name="tabObjs[1].name" display-directive="show"
            :tab-props="{ style: 'display:none' }"
          >
            <transition name="collapse">
              <EditImage v-show="tabPanelShow" />
            </transition>
          </NTabPane>
          <NTabPane
            :key="tabObjs[2].name" :name="tabObjs[2].name" display-directive="show"
            :tab-props="{ style: 'display:none' }"
          >
            <transition name="collapse">
              <VariationImage v-show="tabPanelShow" />
            </transition>
          </NTabPane>
        </NTabs>
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
