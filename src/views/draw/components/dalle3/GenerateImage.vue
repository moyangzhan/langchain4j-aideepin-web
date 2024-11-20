<script setup lang='ts'>
import { ref } from 'vue'
import format from 'date-fns/format'
import { NCol, NRadio, NRadioGroup, NRow, NSpace, useMessage } from 'naive-ui'
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
const selectedImageSize = ref<string>('1024x1024')
const selectedImageQuality = ref<string>('standard')
const imageSizes = ['1024x1024', '1024x1792', '1792x1024']
const imageQulities = ['standard', 'hq']

async function handleSubmit(prompt: string) {
  console.log(`GenerateImage submit:${prompt}`)
  try {
    const resp = await api.imageGenerate<CreateImageResult>('dall-e-3', prompt, selectedImageSize.value, 1, selectedImageQuality.value)
    const uuid = resp.data.uuid
    drawStore.setLoadingUuid(uuid)
    const curDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    const draw = {
      id: 0,
      uuid,
      prompt,
      createTime: curDate,
      interactingMethod: 1,
      processStatus: 1,
      imageUuids: [],
      imageUrls: [],
      isPublic: false,
      aiModelName: 'dall-e-3',
    }
    drawStore.setLoadingUuid(uuid)
    drawStore.pushOne(draw)

    emit('submitted')

    setTimeout(() => {
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
    <NRow class="pt-4 pb-4">
      <NCol :span="2" class="min-w-fit">
        图片尺寸：
      </NCol>
      <NCol :span="12">
        <NRadioGroup v-model:value="selectedImageSize" name="radiogroup">
          <NSpace>
            <NRadio v-for="imageSize in imageSizes" :key="imageSize" :value="imageSize">
              {{ imageSize }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
      </NCol>
    </NRow>
    <NRow class="pb-4">
      <NCol :span="2" class="min-w-fit">
        图片质量：
      </NCol>
      <NCol :span="12">
        <NRadioGroup v-model:value="selectedImageQuality" name="radiogroup">
          <NSpace>
            <NRadio v-for="quality in imageQulities" :key="quality" :value="quality">
              {{ quality }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
      </NCol>
    </NRow>
    <SearchInput @submit="handleSubmit" />
  </div>
</template>
