<script setup lang='ts'>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import CommonProperty from './CommonProperty.vue'
import SearchInput from '@/views/draw/components/SearchInput.vue'
import { checkProcess } from '@/views/draw/helper'
import { useDrawStore } from '@/store'
import api from '@/api'
import { emptyDraw } from '@/utils/functions'

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
    const resp = await api.imageGenerate<CreateImageResult>({ interactingMethod: 1, modelName: 'dall-e-2', prompt, size: selectedImageSize.value, number: generateImageNumber.value })
    const uuid = resp.data.uuid
    drawStore.setLoadingUuid(uuid)

    const draw = emptyDraw()
    draw.uuid = uuid
    draw.prompt = prompt
    draw.aiModelName = 'dall-e-2'
    drawStore.pushOne(draw)

    emit('submitted')

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
    <CommonProperty @val-change="commonSettingChange" />
    <SearchInput @submit="handleSubmit" />
  </div>
</template>
