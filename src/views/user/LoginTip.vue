<script setup lang='ts'>
import { NButton, NIcon } from 'naive-ui'
import { Cat } from '@vicons/fa'
import { useAuthStore } from '@/store'
const authStore = useAuthStore()
</script>

<template>
  <div class="flex items-center justify-center mt-4 text-center text-neutral-400">
    <NIcon :component="Cat" size="32" />
    <span class="pl-1">~</span>
    <NButton text tag="a" type="primary" @click="authStore.setLoginView(true)">
      &nbsp;&nbsp;点击登录
    </NButton>
  </div>
</template>
