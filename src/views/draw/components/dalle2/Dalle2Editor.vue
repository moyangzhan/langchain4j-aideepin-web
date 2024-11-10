<script setup lang='ts'>
import { ref } from 'vue'
import { NTab, NTabPane, NTabs } from 'naive-ui'
import GenerateImage from './GenerateImage.vue'
import EditImage from './EditImage.vue'
import VariationImage from './VariationImage.vue'

interface Emit {
  (e: 'submitted'): void
}
interface TabObj {
  name: string
  tab: string
  defaultTab: string
}
const emit = defineEmits<Emit>()
const tabObjs = ref<TabObj[]>([
  { name: 'tab_generate_image', defaultTab: '文生图', tab: '文生图 ↓' },
  { name: 'tab_edit_image', defaultTab: '修图', tab: '修图' },
  { name: 'tab_variation_image', defaultTab: '图生图', tab: '图生图' },
])
const interactingMethod = ref<string>(tabObjs.value[0].name)
const tabPanelShow = ref<boolean>(true)
let lastClickTab = tabObjs.value[0].name

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

function handleScrollToBottom() {
  emit('submitted')
}
</script>

<template>
  <div>
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
          <GenerateImage v-show="tabPanelShow" @submitted="handleScrollToBottom" />
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
</template>
