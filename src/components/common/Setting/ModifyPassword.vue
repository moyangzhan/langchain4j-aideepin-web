<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NButton, NInput, NTag, useMessage } from 'naive-ui'
import api from '@/api'

const ms = useMessage()
const resetPasswordReturnType = ref<string>('')
const modifyPasswordMsg = ref<string>('')
const loading = ref(false)
const oldPassword = ref<string>('')
const newPassword = ref<string>('')
const confirmNewPassword = ref<string>('')
const confirmPasswordStatus = computed(() => {
  if (!oldPassword.value || !newPassword.value || !confirmNewPassword.value)
    return undefined
  return newPassword.value !== confirmNewPassword.value ? 'error' : 'success'
})

async function handleModifyPassword() {
  const newPwd = newPassword.value.trim()
  const confirmNewPwd = confirmNewPassword.value.trim()

  if (!newPassword.value || !confirmNewPwd || newPwd !== confirmNewPwd) {
    ms.error('两次输入的密码不一致 | Passwords don\'t match')
    return
  }

  try {
    loading.value = true
    const result = await api.modifyPassword(oldPassword.value, newPassword.value)
    modifyPasswordMsg.value = result.data as string
    resetPasswordReturnType.value = 'success'
    ms.success(modifyPasswordMsg.value)
  } catch (error: any) {
    ms.error(error.message ?? 'error')
    modifyPasswordMsg.value = error.message as string
    resetPasswordReturnType.value = 'fail'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">密码</span>
        <NInput v-model:value="oldPassword" type="password" placeholder="密码" show-password-on="click" />
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">新的密码</span>
        <NInput
          v-model:value="newPassword" type="password" placeholder="新的密码" show-password-on="click"
          :status="confirmPasswordStatus"
        />
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">新的密码<br>（重复）</span>
        <NInput
          v-model:value="confirmNewPassword" type="password" placeholder="确认密码" show-password-on="click"
          :status="confirmPasswordStatus"
        />
      </div>
      <div v-if="modifyPasswordMsg" class="flex items-center space-x-4">
        <NTag :type="resetPasswordReturnType ? 'success' : 'error'">
          {{ modifyPasswordMsg }}
        </NTag>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]" />
        <NButton
          type="primary" :disabled="loading || newPassword !== confirmNewPassword" :loading="loading"
          @click="handleModifyPassword"
        >
          修改密码
        </NButton>
      </div>
    </div>
  </div>
</template>
