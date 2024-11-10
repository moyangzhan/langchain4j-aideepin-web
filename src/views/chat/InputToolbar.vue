<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NList, NListItem, NSelect, NUpload, useMessage } from 'naive-ui'
import type { SelectOption, UploadFileInfo } from 'naive-ui'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'
import { defaultConv } from '@/store/modules/chat/helper'
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
const { isMobile } = useBasicLayout()
const token = ref<string>(authStore.token)
const ms = useMessage()
const uploadedFileInfoList = ref<UploadFileInfo[]>([])
const uploadedUuidList = ref<string[]>([])
const currConv = computed(() => chatStore.getCurConv || defaultConv())
const canUploadImage = ref<boolean>(false)

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
    uploadedFileInfoList.value.push(file)
    console.log(`image uuid:${res.data.uuid}`)
  } else {
    console.log(`handleOriginalFinish err:${res.data}`)
  }
  emit('imagesChange', uploadedUuidList.value)
}

function handlerRemove({ file }: { file: UploadFileInfo }) {
  const itemIndex = uploadedFileInfoList.value.findIndex(item => item.id === file.id)
  const removeUuid = uploadedUuidList.value.at(itemIndex)
  if (removeUuid) {
    api.fileDel(removeUuid)
    uploadedUuidList.value.splice(itemIndex, 1)
    uploadedFileInfoList.value.splice(itemIndex, 1)
  }
  emit('imagesChange', uploadedUuidList.value)
}

function handleChangeModel(value: string, option: SelectOption) {
  appStore.setSelectedLLM(value)
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
    <div class="flex space-x-2 items-center">
      <div class="w-48">
        <NSelect
          size="small" :value="appStore.selectedLLM.modelId" :options="appStore.llms"
          @update:value="handleChangeModel"
        />
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
      <NUpload
        :action="`/api/image/upload?token=${token}`" response-type="text" :disabled="!canUploadImage"
        @before-upload="beforeUpload" @finish="handleFinish"
      >
        <HoverButton :tooltip="canUploadImage ? '上传图片' : '模型不支持上传图片'">
          <span class="text-xl">
            <SvgIcon icon="ri:image-line" />
          </span>
        </HoverButton>
      </NUpload>
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
  </div>
</template>

<style lang="less">
.input-tool-bar .n-upload-file-list {
  display: none
}
</style>
