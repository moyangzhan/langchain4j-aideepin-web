<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import CommonNodeHeader from '../CommonNodeHeader.vue'

defineProps<NodeProps>()
</script>

<template>
  <div class="flex flex-col w-full">
    <Handle type="source" :position="Position.Right" />
    <Handle type="target" :position="Position.Left" />
    <CommonNodeHeader :wf-node="data" />
    <div clas="flex-1 flex-col">
      <div v-if="data.nodeConfig.subject" class="content_line flex items-center overflow-hidden">
        主题： {{ data.nodeConfig.subject }}
      </div>
      <div v-if="data.nodeConfig.sender_type === 1" class="content_line flex items-center">
        发送人：系统
      </div>
      <div v-if="data.nodeConfig.sender_type === 2" class="content_line flex items-center overflow-hidden">
        发送人： {{ data.nodeConfig.sender.mail }}
      </div>
      <div class="content_line flex items-center overflow-hidden">
        接收人： {{ data.nodeConfig.to_mails }}
      </div>
    </div>
  </div>
</template>
