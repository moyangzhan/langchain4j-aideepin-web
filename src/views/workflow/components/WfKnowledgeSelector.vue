<script setup lang="ts">
import { h, nextTick, ref, watch } from 'vue'
import { NIcon, NSelect } from 'naive-ui'
import { Cloud32Regular, LockClosed32Regular } from '@vicons/fluent'
import type { SelectGroupOption, SelectInst, SelectOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import { debounce } from '@/utils/functions/debounce'
import { useAuthStore } from '@/store'
import api from '@/api'

interface Props {
  knowledgeBaseUuid: string
}
interface Emit {
  (e: 'selected', knowledge_base_uuid: string, knowledge_base_name: string): void
}
const props = withDefaults(defineProps<Props>(), {
  knowledgeBaseUuid: '',
})
const emit = defineEmits<Emit>()
const selectInstRef = ref<SelectInst | null>(null)
const authStore = useAuthStore()
const selectedKnowledgeUuid = ref<string>('')
const currentPage = ref<number>(1)
const pageSize = 10
const mineGroup = {
  type: 'group',
  label: '我的',
  key: 'g_mine',
  children: [] as Array<{ label: string; value: string; is_public: boolean }>,
}
const publicGroup = {
  type: 'group',
  label: '公开的',
  key: 'g_public',
  children: [] as Array<{ label: string; value: string; is_public: boolean }>,
}
const options: Array<SelectOption | SelectGroupOption> = [mineGroup, publicGroup]

function renderLabel(option: SelectOption): VNodeChild {
  if (option.type === 'group')
    return option.label as string
  return [
    h('div', { class: 'flex items-center' }, {
      default: () => [
        h(
          NIcon,
          {
            style: {
              verticalAlign: '-0.15em',
              marginRight: '4px',
            },
          },
          {
            default: () => h(option.isPublic ? Cloud32Regular : LockClosed32Regular),
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

function handleSelect(knowledgeBaseUuid: string) {
  let kbName = ''
  let hit = mineGroup.children.find(child => child.value === knowledgeBaseUuid)
  if (!hit)
    hit = publicGroup.children.find(child => child.value === knowledgeBaseUuid)

  if (hit)
    kbName = hit.label

  emit('selected', knowledgeBaseUuid, kbName)
}

console.log('selected knowledgeBaseUuid', props.knowledgeBaseUuid)
const handleSearch = debounce(search, 300)
async function search(query: string) {
  try {
    // search mine
    const { data } = await api.knowledgeBaseSearchMine<KnowledgeBase.InfoListResp>(query, currentPage.value, pageSize)
    mineGroup.children = []
    publicGroup.children = []
    data.records.forEach((item) => {
      mineGroup.children.push({
        value: item.uuid,
        label: item.title,
        is_public: item.isPublic,
      })
    })
    // search public
    const { data: data2 } = await api.knowledgeBaseSearchPublic<KnowledgeBase.InfoListResp>(query, currentPage.value, pageSize)
    if (data2) {
      data2.records.forEach((item) => {
        publicGroup.children.push({
          value: item.uuid,
          label: item.title,
          is_public: item.isPublic,
        })
      })
    }

    if (!selectedKnowledgeUuid.value) {
      nextTick(() => {
        selectedKnowledgeUuid.value = props.knowledgeBaseUuid
        selectInstRef.value?.focusInput()
        selectInstRef.value?.blur()
      })
    }
  } catch (e) {
    console.log(e)
  }
}

watch(
  () => authStore.token,
  () => {
    if (authStore.token)
      search('')
  },
  { immediate: true },
)
</script>

<template>
  <NSelect
    ref="selectInstRef" v-model:value="selectedKnowledgeUuid" filterable placeholder="搜索知识库" :options="options"
    clearable remote :render-label="renderLabel" @update:value="handleSelect" @search="handleSearch"
  />
</template>
