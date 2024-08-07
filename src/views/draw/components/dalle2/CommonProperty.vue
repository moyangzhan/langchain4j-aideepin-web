<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import { AnimalCat24Regular } from '@vicons/fluent'
import { NCol, NIcon, NIconWrapper, NRadio, NRadioGroup, NRow, NSlider, NSpace } from 'naive-ui'
const emit = defineEmits<Emit>()
const imageSizes = ['256x256', '512x512', '1024x1024']
const selectedImageSize = ref<string>('256x256')
const generateImageNumber = ref<number>(1)

interface Emit {
  (e: 'valChange', imageSize: string, imageNumber: number): void
}
function sizeChange(value: string) {
  selectedImageSize.value = value
  emit('valChange', selectedImageSize.value, generateImageNumber.value)
}
function imageNumberChange(value: number) {
  generateImageNumber.value = value
  emit('valChange', selectedImageSize.value, generateImageNumber.value)
}
onMounted(() => {
  emit('valChange', selectedImageSize.value, generateImageNumber.value)
})
</script>

<template>
  <NRow class="pt-4 pb-4">
    <NCol :span="2" class="min-w-fit">
      图片尺寸：
    </NCol>
    <NCol :span="12">
      <NRadioGroup :value="selectedImageSize" name="radiogroup" :on-update:value="sizeChange">
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
      图片数量：
    </NCol>
    <NCol :span="12">
      <NSlider :value="generateImageNumber" :step="1" :min="1" :max="10" :on-update:value="imageNumberChange">
        <template #thumb>
          <NIconWrapper :size="24" :border-radius="12">
            <NIcon :size="18" :component="AnimalCat24Regular" />
          </NIconWrapper>
        </template>
      </NSlider>
      <span>{{ generateImageNumber }}张</span>
    </NCol>
  </NRow>
</template>
