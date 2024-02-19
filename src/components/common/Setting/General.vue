<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NButton, NImage, NSpace } from 'naive-ui'
import type { Theme } from '@/store/modules/app/helper'
import { SvgIcon } from '@/components/common'
import { useAppStore, useAuthStore, useUserStore } from '@/store'
import api from '@/api'
import defaultAvatar from '@/assets/avatar.jpg'

const appStore = useAppStore()
const userStore = useUserStore()
const authStore = useAuthStore()

const theme = computed(() => appStore.theme)

const userInfo = computed(() => userStore.userInfo)

const avatar = ref(userInfo.value.avatar ?? '')

const name = ref(userInfo.value.name ?? '')

// const language = computed({
//   get() {
//     return appStore.language
//   },
//   set(value: Language) {
//     appStore.setLanguage(value)
//   },
// })

const themeOptions: { label: string; key: Theme; icon: string }[] = [
  {
    label: 'Auto',
    key: 'auto',
    icon: 'ri:contrast-line',
  },
  {
    label: 'Light',
    key: 'light',
    icon: 'ri:sun-foggy-line',
  },
  {
    label: 'Dark',
    key: 'dark',
    icon: 'ri:moon-foggy-line',
  },
]

// const languageOptions: { label: string; key: Language; value: Language }[] = [
//   { label: '简体中文', key: 'zh-CN', value: 'zh-CN' },
//   { label: '繁體中文', key: 'zh-TW', value: 'zh-TW' },
//   { label: 'English', key: 'en-US', value: 'en-US' },
// ]

async function logout() {
  await api.logout()
  authStore.removeToken()
  userStore.resetUserInfo()
  window.location.reload()
}
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <NSpace justify="center" class="w-[100%]">
          <NImage :src="avatar" :fallback-src="defaultAvatar" preview-disabled />
        </NSpace>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.name') }}</span>
        <div class="w-[200px]">
          {{ name }}
        </div>
      </div>
      <!-- <div class="flex items-center space-x-4" :class="isMobile && 'items-start'">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.chatHistory') }}</span>

        <div class="flex flex-wrap items-center gap-4">
          <NButton size="small" @click="exportData">
            <template #icon>
              <SvgIcon icon="ri:download-2-fill" />
            </template>
            {{ $t('common.export') }}
          </NButton>

          <input id="fileInput" type="file" style="display:none" @change="importData">
          <NButton size="small" @click="handleImportButtonClick">
            <template #icon>
              <SvgIcon icon="ri:upload-2-fill" />
            </template>
            {{ $t('common.import') }}
          </NButton>

          <NPopconfirm placement="bottom" @positive-click="clearData">
            <template #trigger>
              <NButton size="small">
                <template #icon>
                  <SvgIcon icon="ri:close-circle-line" />
                </template>
                {{ $t('common.clear') }}
              </NButton>
            </template>
            {{ $t('chat.clearHistoryConfirm') }}
          </NPopconfirm>
        </div>
      </div> -->
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.theme') }}</span>
        <div class="flex flex-wrap items-center gap-4">
          <template v-for="item of themeOptions" :key="item.key">
            <NButton size="small" :type="item.key === theme ? 'primary' : undefined" @click="appStore.setTheme(item.key)">
              <template #icon>
                <SvgIcon :icon="item.icon" />
              </template>
            </NButton>
          </template>
        </div>
      </div>
      <!-- <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.language') }}</span>
        <div class="flex flex-wrap items-center gap-4">
          <NSelect
            style="width: 140px" :value="language" :options="languageOptions"
            @update-value="(value: Language) => appStore.setLanguage(value)"
          />
        </div>
      </div> -->
      <div class="flex items-center space-x-4">
        <NButton size="small" type="primary" @click="logout">
          退出
        </NButton>
      </div>
    </div>
  </div>
</template>
