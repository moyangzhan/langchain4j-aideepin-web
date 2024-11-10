<script setup lang='ts'>
import { ref } from 'vue'
import { NTab, NTabPane, NTabs } from 'naive-ui'
import Dalle3GenerateImage from './GenerateImage.vue'

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
  { name: 'tab_generate_image', defaultTab: 'DALL·E 3', tab: 'DALL·E 3 ↓' },
])
const interactingMethod = ref<string>(tabObjs.value[0].name)
const tabPanelShow = ref<boolean>(true)

function handleClick(tabOjb: TabObj) {
  tabPanelShow.value = !tabPanelShow.value
  tabOjb.tab = tabPanelShow.value ? `${tabOjb.defaultTab} ↓` : `${tabOjb.defaultTab} ↑`
}

function handleDataSubmitted() {
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
          <Dalle3GenerateImage v-show="tabPanelShow" @submitted="handleDataSubmitted" />
        </transition>
      </NTabPane>
    </NTabs>
  </div>
</template>
