<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NButton, NCheckbox, NCheckboxGroup, NFlex, NList, NListItem, NModal, NUpload, useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { HoverButton, LLMSelector, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore, useMcpStore } from '@/store'
import { defaultConv } from '@/store/modules/chat/helper'
import { router } from '@/router'
import { t } from '@/locales'
import api from '@/api'

const emit = defineEmits<Emit>()
const allowedImageTypes = ['image/png', 'image/jpeg']
interface Emit {
  (e: 'imagesChange', imageUuids: string[]): void
}
const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const mcpStore = useMcpStore()
const { isMobile } = useBasicLayout()
const token = ref<string>(authStore.token)
const ms = useMessage()
const uploadedFileInfoList = ref<UploadFileInfo[]>([])
const uploadedUuidList = ref<string[]>([])
const uploadedUrls = ref<string[]>([])
const currConv = computed(() => chatStore.getCurConv || defaultConv())
const canUploadImage = ref<boolean>(false)
const mcpModalShow = ref<boolean>(false)
const tmpMcpIds = ref<string[]>([])

async function beforeUpload(data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  const file = data.file.file
  if (!file) {
    ms.error('文件不存在')
    return false
  }
  if (allowedImageTypes.findIndex(item => item === file.type) === -1) {
    ms.error('只能上传PNG/JPG格式的图片文件，请重新上传')
    return false
  }
  if (file.size > 4 * 1024 * 1024) {
    ms.error('不能超过4MB')
    return false
  }
  return true
}

function handleFinish({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) {
  const res = JSON.parse((event?.target as XMLHttpRequest).response)
  if (res.success) {
    uploadedUuidList.value.push(res.data.uuid)
    uploadedUrls.value.push(res.data.url)
    uploadedFileInfoList.value.push(file)
    console.log(`image uuid:${res.data.uuid}`)
  } else {
    console.log(`handleOriginalFinish err:${res.data}`)
  }
  emit('imagesChange', uploadedUrls.value)
}

function handlerRemove({ file }: { file: UploadFileInfo }) {
  const itemIndex = uploadedFileInfoList.value.findIndex(item => item.id === file.id)
  const removeUuid = uploadedUuidList.value.at(itemIndex)
  if (removeUuid) {
    api.fileDel(removeUuid)
    uploadedUrls.value.splice(itemIndex, 1)
    uploadedUuidList.value.splice(itemIndex, 1)
    uploadedFileInfoList.value.splice(itemIndex, 1)
  }
  emit('imagesChange', uploadedUrls.value)
}

function handleMcpModalShow() {
  mcpModalShow.value = true
  tmpMcpIds.value = [...currConv.value.mcpIds]
}

async function handleSaveMcps() {
  try {
    currConv.value.mcpIds = tmpMcpIds.value
    await api.convEdit(currConv.value)
    chatStore.updateConv(currConv.value.uuid, currConv.value)
  } catch (error) {
    console.error('handleSaveMcps error', error)
  } finally {
    mcpModalShow.value = false
  }
}

function gotoMcp() {
  router.push({ name: 'Mcp' })
  mcpModalShow.value = false
}

function toggleUsingContext() {
  api.convToggleUsingContext(currConv.value.uuid, !currConv.value.understandContextEnable)
  currConv.value.understandContextEnable = !currConv.value.understandContextEnable
  if (currConv.value.understandContextEnable)
    ms.success(t('chat.turnOnContext'))
  else
    ms.warning(t('chat.turnOffContext'))
}

watch(
  () => appStore.selectedLLM,
  (newVal) => {
    if (newVal.inputTypes?.includes('image'))
      canUploadImage.value = true
    else
      canUploadImage.value = false
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="flex flex-col space-x-2 input-tool-bar">
    <div class="flex flex-row space-x-2 items-center">
      <div>
        <LLMSelector />
      </div>
      <HoverButton
        v-if="!isMobile"
        :tooltip="currConv.understandContextEnable ? $t('chat.understandContextEnable') : $t('chat.understandContextDisable')"
        @click="toggleUsingContext"
      >
        <span
          class="text-xl"
          :class="{ 'text-[#4b9e5f]': currConv.understandContextEnable, 'text-[#a8071a]': !currConv.understandContextEnable }"
        >
          <SvgIcon icon="ri:chat-history-line" />
        </span>
      </HoverButton>
      <div>
        <NUpload
          :action="`/api/image/upload?token=${token}`" response-type="text" :disabled="!canUploadImage"
          @before-upload="beforeUpload" @finish="handleFinish"
        >
          <HoverButton :tooltip="canUploadImage ? '上传图片以识别其内容' : '模型不支持图片识别'">
            <span class="text-xl">
              <SvgIcon icon="ri:image-line" />
            </span>
          </HoverButton>
        </NUpload>
      </div>
      <div class="flex-1 overflow-hidden">
        <span class="text-xs cursor-pointer text-green-600" @click="handleMcpModalShow">工具：</span>
        <template v-for="userMcp in mcpStore.myUserMcpList" :key="userMcp.uuid">
          <span v-if="currConv.mcpIds.includes(userMcp.mcpInfo.id)" class="text-xs mr-1">{{ userMcp.mcpInfo.title
          }}</span>
        </template>
        <span v-if="currConv.mcpIds.length === 0" class="text-xs mr-1">无</span>
      </div>
    </div>
    <NList hoverable show-divider>
      <NListItem v-for="fileInfo in uploadedFileInfoList" :key="fileInfo.id">
        <div class="flex">
          <span class="flex-1 text-xs">{{ fileInfo.name }}</span>
          <SvgIcon
            class="flex-none cursor-pointer text-sm" icon="clarity:remove-line"
            @click="handlerRemove({ file: fileInfo })"
          />
        </div>
      </NListItem>
    </NList>
    <NModal v-model:show="mcpModalShow" style="width: 90%; max-width: 640px" preset="card" title="配置会话使用的服务与工具">
      <NCheckboxGroup v-model:value="tmpMcpIds" class="my-2 flex flex-wrap space-x-2">
        <NCheckbox
          v-for="userMcp in mcpStore.myUserMcpList" :key="userMcp.uuid" :value="userMcp.mcpInfo.id"
          :label="userMcp.mcpInfo.title"
        />
      </NCheckboxGroup>
      <span v-if="mcpStore.myUserMcpList.length === 0" class="mr-1">无数据</span>
      <NFlex justify="space-between" class="mt-4">
        <NButton type="primary" text tag="a" class="mt-4" @click="gotoMcp">
          去启用更多AI工具
        </NButton>
        <NButton type="primary" @click="handleSaveMcps()">
          保存
        </NButton>
      </NFlex>
    </NModal>
  </div>
</template>

<style lang="less">
.input-tool-bar .n-upload-file-list {
  display: none
}
</style>
