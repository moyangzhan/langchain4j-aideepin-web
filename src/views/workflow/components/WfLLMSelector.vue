<script setup lang="ts">
import { h, ref } from 'vue'
import { NSelect } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import { useAppStore } from '@/store'
import AvatarComponent from '@/views/chat/components/Message/Avatar.vue'
import { emptyAiModel } from '@/utils/functions'

interface Props {
  modelName: string
}
interface Emit {
  (e: 'llmSelected', modelName: string): void
}
const props = withDefaults(defineProps<Props>(), {
  modelName: () => emptyAiModel().modelName,
})
const emit = defineEmits<Emit>()
const appStore = useAppStore()

function renderLabel(option: SelectOption): VNodeChild {
  if (option.type === 'group')
    return option.label as string
  const val = option.value as string
  const modelPlatform = appStore.getLLMByName(val)?.modelPlatform
  return [
    h('div', { class: 'flex items-center' }, {
      default: () => [
        h(
          AvatarComponent,
          {
            name: modelPlatform,
            imageSize: 20,
          },
        ),
        h(
          'div',
          {
            class: 'ml-1.5',
          },
          { default: () => option.label as string },
        ),
      ],
    }),
  ]
}

const selectedModelName = ref<string>(props.modelName)
console.log('selectedModelName', selectedModelName.value)
function handleSelect(modelName: string) {
  emit('llmSelected', modelName)
}
</script>

<template>
  <NSelect
    v-model:value="selectedModelName" placement="top-start" trigger="click" :show-arrow="true"
    :options="appStore.llms" :render-label="renderLabel" @update:value="handleSelect"
  />
</template>
