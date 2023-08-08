<script lang="ts" setup>
import { ref } from 'vue'
import { NButton, NInput, useMessage } from 'naive-ui'
import { useSettingStore } from '@/store'
import { t } from '@/locales'
import api from '@/api'

interface Props {
  userConfig: User.Config
}
interface Emit {
  (e: 'reloadConfig'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const settingStore = useSettingStore()
const ms = useMessage()
const secretKey = ref(props.userConfig.secretKey ?? '')

function reloadConfig() {
  emit('reloadConfig')
}

async function handleSave() {
  await api.userEdit({ secretKey: secretKey.value })
  reloadConfig()
}

function handleReset() {
  settingStore.resetSetting()
  ms.success(t('common.success'))
  window.location.reload()
}
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">我的secret key</span>
        <div class="flex-1">
          <NInput v-model:value="secretKey" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">&nbsp;</span>
        <NButton size="small" @click="handleReset">
          {{ $t('common.reset') }}
        </NButton>
        <NButton size="tiny" text type="primary" @click="handleSave()">
          {{ $t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
