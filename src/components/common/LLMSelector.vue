<script setup lang='ts'>
import { h } from 'vue'
import { NSelect, NTooltip } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { VNode } from 'vue'
import { useAppStore } from '@/store'
const appStore = useAppStore()
function renderOption({ node, option }: { node: VNode; option: SelectOption }) {
  if (option.enable && option.isFree) {
    return h(NTooltip, null, {
      trigger: () => node,
      default: () => 'Token额度无限',
    })
  } else {
    return node
  }
}

function renderLabel(option: SelectOption) {
  console.log('option', option)
  return [
    h(
      'span',
      {
        class: option.isFree ? 'text-green-500' : 'text-orange-500',
      },
      '⨀ ',
    ),
    option.label as string,
  ]
}

function handleChangeModel(value: string, option: SelectOption) {
  appStore.setSelectedLLM(value)
}
</script>

<template>
  <NSelect
    style="max-width: 500px" size="small" :value="appStore.selectedLLM.modelId" :options="appStore.llms"
    :render-label="renderLabel" :render-option="renderOption" @update:value="handleChangeModel"
  />
</template>
