<script setup lang='ts'>
import { ref } from 'vue'
import format from 'date-fns/format'
import { useMessage } from 'naive-ui'
import CommonProperty from './CommonProperty.vue'
import SearchInput from '@/views/draw/components/SearchInput.vue'
import { checkProcess } from '@/views/draw/helper'
import { useDrawStore } from '@/store'
import api from '@/api'

interface Emit {
  (e: 'submitted'): void
}
const emit = defineEmits<Emit>()
const drawStore = useDrawStore()
const ms = useMessage()
const selectedImageSize = ref<string>('')
const generateImageNumber = ref<number>(0)

function commonSettingChange(imageSize: string, imageNumber: number) {
  selectedImageSize.value = imageSize
  generateImageNumber.value = imageNumber
}
async function handleSubmit(prompt: string) {
  console.log(`GenerateImage submit:${prompt}`)
  try {
    const resp = await api.imageGenerate<CreateImageResult>('dall-e-2', prompt, selectedImageSize.value, generateImageNumber.value)
    const uuid = resp.data.uuid
    drawStore.setLoadingUuid(uuid)
    const curDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    const aiImage = {
      id: 0,
      uuid,
      prompt,
      createTime: curDate,
      interactingMethod: 1,
      processStatus: 1,
      imageUuids: [],
    }
    drawStore.setLoadingUuid(uuid)
    drawStore.pushOne(aiImage)

    emit('submitted')

    console.log(`checkProcess111:${uuid}`)
    setTimeout(() => {
      console.log(`checkProcess:${uuid}`)
      checkProcess(uuid)
    }, 5000)
  } catch (error: any) {
    const e = error as { message: string }
    ms.error(e.message)
  }
}
</script>

<template>
  <div>
    <CommonProperty @valChange="commonSettingChange" />
    <SearchInput @submit="handleSubmit" />
  </div>
</template>
