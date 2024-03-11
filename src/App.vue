<script setup lang="ts">
import { NButton, NConfigProvider, NIcon, NLayout, NLayoutSider, NMenu, NSpace, NTooltip } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import type { Component } from 'vue'
import { defineAsyncComponent, h, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChatboxEllipsesOutline, ImagesOutline, LibraryOutline, SettingsOutline } from '@vicons/ionicons5'
import { Prompt as PromptIcon } from '@vicons/tabler'
import { NaiveProvider, PromptStore } from '@/components/common'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/locales'
import { useAppStore, useKbStore } from '@/store'
import api from '@/api'

const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))

const appStore = useAppStore()
const kbStore = useKbStore()
const { theme, themeOverrides } = useTheme()
const { language } = useLanguage()
const activeKey = ref<string>('menu-chat')
const showPrompt = ref<boolean>(false)
const showSetting = ref<boolean>(false)

const menuOptions: MenuOption[] = [
  {
    key: 'menu-chat',
    icon: renderIcon(ChatboxEllipsesOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Chat',
          },
        },
        { default: () => '聊天' },
      ),
  },
  {
    key: 'menu-draw',
    icon: renderIcon(ImagesOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Draw',
          },
        },
        { default: () => '画图' },
      ),
  },
  {
    key: 'knowledge-base',
    icon: renderIcon(LibraryOutline),
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'QADetail',
            params: {
              kbUuid: kbStore.activeKbUuid,
            },
          },
        },
        { default: () => '知识库' },
      ),
  },
]
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

onMounted(async () => {
  const llms = await api.loadLLMs<AiModelInfo[]>()
  appStore.setLLMs(llms.data)
  const imageModels = await api.loadImageModels<AiModelInfo[]>()
  appStore.setImageModels(imageModels.data)
})
</script>

<template>
  <NConfigProvider class="h-full" :theme="theme" :theme-overrides="themeOverrides" :locale="language">
    <NaiveProvider>
      <NLayout class="h-full" has-sider>
        <NLayoutSider bordered :collapsed-width="48" collapse-mode="width" :collapsed="true">
          <NMenu v-model:value="activeKey" :options="menuOptions" />
          <NSpace vertical class="absolute bottom-0 ml-2">
            <NTooltip trigger="hover" placement="right" style="margin-left: 1.5rem;">
              <template #trigger>
                <NButton text style="font-size: 26px;" class="cursor-pointer" @click="showPrompt = true">
                  <NIcon>
                    <PromptIcon />
                  </NIcon>
                </NButton>
              </template>
              {{ t('store.siderButton') }}
            </NTooltip>
            <NTooltip trigger="hover" placement="right" style="margin-left: 1.5rem;">
              <template #trigger>
                <NButton text style="font-size: 26px;" class="cursor-pointer" @click="showSetting = true">
                  <NIcon>
                    <SettingsOutline />
                  </NIcon>
                </NButton>
              </template>
              {{ t('setting.setting') }}
            </NTooltip>
          </NSpace>
        </NLayoutSider>
        <NLayout>
          <!-- <KeepAlive>
            <RouterView :key="routePath" />
          </KeepAlive> -->
          <RouterView v-slot="{ Component, route }">
            <KeepAlive><component :is="Component" :key="route.fullPath" /></KeepAlive>
          </RouterView>
        </NLayout>
      </NLayout>

      <PromptStore v-model:visible="showPrompt" />
      <Setting v-model:visible="showSetting" />
    </NaiveProvider>
  </NConfigProvider>
</template>
