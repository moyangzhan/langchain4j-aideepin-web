<script setup lang="ts">
import { h } from 'vue'
import { NButton, NDropdown, NTooltip } from 'naive-ui'
import type { VNode } from 'vue'
import type { DropdownGroupOption, DropdownOption } from 'naive-ui'
import { useAppStore } from '@/store'
const appStore = useAppStore()
function renderOption({ node, option }: { node: VNode; option: DropdownOption | DropdownGroupOption }) {
  if (option.enable && option.isFree) {
    return h(NTooltip, { placement: 'left' }, {
      trigger: () => node,
      default: () => 'Token额度无限',
    })
  } else {
    return node
  }
}

function renderDropdownLabel(option: DropdownOption) {
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

function handleSelect(key: string | number) {
  appStore.setSelectedLLM(`${key}`)
}
</script>

<template>
  <NDropdown
    size="small" placement="top-start" trigger="click" :show-arrow="true" :render-label="renderDropdownLabel"
    :render-option="renderOption" :options="appStore.llms" @select="handleSelect"
  >
    <NButton icon-placement="right">
      {{ appStore.selectedLLM.modelTitle || appStore.selectedLLM.modelName }}
    </NButton>
  </NDropdown>
</template>
