<script setup lang="ts">
import { NButton, NDropdown, NFlex } from 'naive-ui'
import { useAppStore } from '@/store'
const appStore = useAppStore()

function handleSelect(key: string | number) {
  console.log('image model selected', key)
  appStore.setSelectedImageModel(`${key}`)
}
</script>

<template>
  <NDropdown
    size="small" placement="top-end" trigger="click" :show-arrow="true" :options="appStore.imageModels"
    @select="handleSelect"
  >
    <NFlex>
      当前模型：
      <NButton icon-placement="right" text tag="a" type="primary">
        {{ appStore.selectedImageModel.modelTitle || appStore.selectedImageModel.modelName }}
      </NButton>
    </NFlex>
  </NDropdown>
</template>
