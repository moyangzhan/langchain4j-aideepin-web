<script setup lang="ts">
import { NTooltip } from 'naive-ui'
import { SvgIcon } from '@/components/common'
interface Props {
  brief?: boolean
}
withDefaults(defineProps<Props>(), {
  brief: false,
})
</script>

<template>
  <NTooltip trigger="hover">
    <template #trigger>
      <SvgIcon icon="tabler:variable" class="text-base text-gray-500" />
    </template>
    <div v-if="!brief" class="flex flex-col pl-2 my-1">
      <div>可引入变量</div>
      <div>用法：</div>
      <div>1. 使用大括号引用【输入】中已定义变量，如：{var_name1}</div>
      <div>2. 使用 {input} 引用上个节点的默认执行结果</div>
    </div>
    <div v-if="brief">
      可引入变量，如：{x} 和 {y} 是好朋友
    </div>
  </NTooltip>
</template>
