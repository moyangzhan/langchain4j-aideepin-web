<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import CommonNodeHeader from '../CommonNodeHeader.vue'
import { googleCountryOptions, googleLanguageOptions } from '@/utils/constant'

const props = defineProps<NodeProps>()
const country = computed(() => {
  return googleCountryOptions.find(item => item.value === props.data.nodeConfig.country)?.label || ''
})
const language = computed(() => {
  return googleLanguageOptions.find(item => item.value === props.data.nodeConfig.language)?.label || ''
})
</script>

<template>
  <div class="flex flex-col w-full">
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />
    <CommonNodeHeader :wf-node="data" />
    <div clas="flex-1 flex-col">
      <div class="content_line flex items-center pl-2">
        国家和地区：{{ country }}
      </div>
      <div class="content_line flex items-center pl-2">
        语言：{{ language }}
      </div>
      <div class="content_line flex items-center pl-2">
        提取数量：{{ data.nodeConfig.top_n }}
      </div>
    </div>
  </div>
</template>
