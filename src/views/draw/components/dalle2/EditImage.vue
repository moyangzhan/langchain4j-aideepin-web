<script setup lang='ts'>
import { ref } from 'vue'
import { NCard, NCol, NCollapseTransition, NIcon, NImage, NRow, NSpace, NSwitch, NTooltip, NUpload, useMessage } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { QuestionCircle16Regular } from '@vicons/fluent'
import CommonProperty from './CommonProperty.vue'
import SearchInput from '@/views/draw/components/SearchInput.vue'
import { checkProcess } from '@/views/draw/helper'
import { useAuthStore, useDrawStore } from '@/store'
import OriginalImage from '@/assets/image_edit_original.webp'
import MaskImage from '@/assets/image_edit_mask.webp'
import OutPutImage from '@/assets/image_edit_output.webp'
import api from '@/api'
import { emptyDraw } from '@/utils/functions'

interface Emit {
  (e: 'submitted'): void
}
const emit = defineEmits<Emit>()
const ms = useMessage()
const drawStore = useDrawStore()
const authStore = useAuthStore()
const showTip = ref<boolean>(false)
const selectedImageSize = ref<string>('')
const generateImageNumber = ref<number>(0)
const originalImageList = ref<UploadFileInfo[]>()
const originalImage = ref<string>('')
const maskImageList = ref<UploadFileInfo[]>()
const maskImage = ref<string>('')

function commonSettingChange(imageSize: string, imageNumber: number) {
  selectedImageSize.value = imageSize
  generateImageNumber.value = imageNumber
}

async function beforeUpload(data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  if (data.file.file?.type !== 'image/png') {
    ms.error('只能上传png格式的图片文件，请重新上传')
    return false
  }
  if (data.file.file?.size > 4 * 1024 * 1024) {
    ms.error('不能超过4MB')
    return false
  }
  return true
}

// Upload original image finish
function handleOriginalFinish({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) {
  const res = JSON.parse((event?.target as XMLHttpRequest).response)
  if (res.success) {
    originalImage.value = res.data.uuid
    originalImageList.value?.push(file)
    console.log(`image uuid:${originalImage.value}`)
  } else {
    console.log(`handleOriginalFinish err:${res.data}`)
  }
}

function handleMaskFinish({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) {
  const res = JSON.parse((event?.target as XMLHttpRequest).response)
  if (res.success) {
    maskImage.value = res.data.uuid
    maskImageList.value?.push(file)
    console.log(`mask image uuid:${maskImage.value}`)
  } else {
    console.log(`handleMaskFinish err:${res.data}`)
  }
}

// Delete original image
function removeOriginalImage({ file }: { file: UploadFileInfo }) {
  if (originalImage.value)
    api.fileDel(originalImage.value)
  originalImage.value = ''
}

function removeMaskImage({ file }: { file: UploadFileInfo }) {
  if (maskImage.value)
    api.fileDel(maskImage.value)
  maskImage.value = ''
}

async function handleSubmit(prompt: string) {
  try {
    const resp = await api.imageEdit<CreateImageResult>(originalImage.value, maskImage.value, prompt, selectedImageSize.value, generateImageNumber.value)
    const uuid = resp.data.uuid

    const draw = emptyDraw()
    draw.uuid = uuid
    draw.originalImageUuid = originalImage.value
    draw.maskImageUuid = maskImage.value ? maskImage.value : ''
    draw.interactingMethod = 2
    draw.aiModelName = 'dall-e-2'

    drawStore.setLoadingUuid(uuid)
    drawStore.pushOne(draw)

    emit('submitted')
    setTimeout(() => {
      checkProcess(uuid)
    }, 5000)
  } catch (error) {
    const e = error as { message: string }
    ms.error(e.message)
  }
}
</script>

<template>
  <div>
    <NSpace vertical>
      <NSwitch v-model:value="showTip">
        <template #checked>
          使用说明
        </template>
        <template #unchecked>
          使用说明
        </template>
      </NSwitch>
      <NCollapseTransition :show="showTip">
        <NCard :bordered="true" embedded>
          <NRow>
            <NCol :span="4" style="display: flex;align-items: center;">
              <NImage width="200" :src="OriginalImage" />
            </NCol>
            <NCol :span="1">
              <div class="flex items-center justify-center h-full">
                <p class="text-center text-2xl font-medium">
                  +
                </p>
              </div>
            </NCol>
            <NCol :span="4" style="display: flex;align-items: center;">
              <NImage width="200" :src="MaskImage" />
            </NCol>
            <NCol :span="1">
              <div class="flex items-center justify-center h-full">
                <p class="text-center text-2xl font-medium">
                  +
                </p>
              </div>
            </NCol>
            <NCol :span="4">
              <div class="flex items-center justify-center h-full">
                <p class="text-center">
                  a sunlit indoor lounge area with a pool containing a flamingo(阳光充足的室内休息区，有一个包含火烈鸟的游泳池)
                </p>
              </div>
            </NCol>
            <NCol :span="1">
              <div class="flex items-center justify-center h-full">
                <p class="text-center text-2xl font-medium">
                  =
                </p>
              </div>
            </NCol>
            <NCol :span="4" style="display: flex;align-items: center;">
              <NImage width="200" :src="OutPutImage" />
            </NCol>
          </NRow>
          <NRow>
            <NCol :span="4" class="min-w-fit">
              <p class="text-center">
                原图
              </p>
            </NCol>
            <NCol :span="1" />
            <NCol :span="4">
              <div class="text-center">
                遮罩层
                <NTooltip trigger="hover">
                  <template #trigger>
                    <NIcon style="margin-top: 0.1rem">
                      <QuestionCircle16Regular />
                    </NIcon>
                  </template>
                  <span> 图片要求：小于4MB的PNG图片，跟原图尺寸相同。<br>全透明区域(例如alpha为零的地方)表示应该在那里编辑图像。 </span>
                </NTooltip>
              </div>
            </NCol>
            <NCol :span="1" />
            <NCol :span="4">
              <p class="text-center">
                提示词
              </p>
            </NCol>
            <NCol :span="1" />
            <NCol :span="4">
              <p class="text-center">
                结果
              </p>
            </NCol>
          </NRow>
        </NCard>
      </NCollapseTransition>
    </NSpace>
    <CommonProperty @val-change="commonSettingChange" />
    <NRow>
      <NCol :span="2" class="min-w-fit">
        原&nbsp;&nbsp;&nbsp;&nbsp;图
        <NTooltip trigger="hover">
          <template #trigger>
            <NIcon style="padding-top: 0.1rem">
              <QuestionCircle16Regular />
            </NIcon>
          </template>
          <span> 小于4MB的正方形图片。</span>
        </NTooltip>
      </NCol>
      <NCol :span="12">
        <NUpload
          :action="`/api/image/upload?token=${authStore.token}`" :max="1" response-type="text" list-type="image-card"
          :default-file-list="originalImageList" @before-upload="beforeUpload" @finish="handleOriginalFinish"
          @remove="removeOriginalImage"
        >
          上传小于4MB的PNG图片
        </NUpload>
      </NCol>
    </NRow>
    <NRow>
      <NCol :span="2" class="min-w-fit">
        遮罩层
        <NTooltip trigger="hover">
          <template #trigger>
            <NIcon style="padding-top: 0.1rem">
              <QuestionCircle16Regular />
            </NIcon>
          </template>
          <span> 小于4MB的PNG图片，跟原图尺寸相同。<br>全透明区域(例如alpha为零的地方)表示应该在那里编辑图像。 </span>
        </NTooltip>
      </NCol>
      <NCol :span="12">
        <NUpload
          :action="`/api/image/upload?token=${authStore.token}`" :max="1" response-type="text" list-type="image-card"
          :default-file-list="maskImageList" @before-upload="beforeUpload" @finish="handleMaskFinish"
          @remove="removeMaskImage"
        >
          上传小于4MB的PNG图片
        </NUpload>
      </NCol>
    </NRow>
    <SearchInput @submit="handleSubmit" />
  </div>
</template>
