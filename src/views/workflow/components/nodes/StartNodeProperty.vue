<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NFlex,
  NInput,
  NModal,
  NSelect,
  NSwitch,
} from 'naive-ui'
import { v4 as uuidv4 } from 'uuid'
import { SvgIcon } from '@/components/common'
import { getNameByInputType } from '@/utils/workflow-util'
import { useWfStore } from '@/store'

interface Props {
  workflow: Workflow.WorkflowInfo
  wfNode: Workflow.WorkflowNode
}
const props = defineProps<Props>()
const wfStore = useWfStore()
const showModal = ref<boolean>(false)
const tmpItem = reactive<Workflow.NodeIODefinition>({
  uuid: '',
  type: 1,
  name: '',
  title: '',
  required: false,
})
const options = [
  {
    label: '文本',
    value: 1,
  },
  {
    label: '数字',
    value: 2,
  },
  {
    label: '布尔值',
    value: 5,
  },
]
const columns = [
  {
    title: '变量名',
    key: 'name',
  },
  {
    title: '标题',
    key: 'title',
  },
  {
    title: '类型',
    key: 'type',
    render(row: { type: number }) {
      return getNameByInputType(row.type)
    },
  },
  {
    title: '必填',
    key: 'required',
    render(row: { required: boolean }) {
      return row.required ? '是' : '否'
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: Workflow.NodeIODefinition) {
      return h(
        'div',
        { class: 'flex gap-2' },
        {
          default: () => [
            h(
              SvgIcon,
              {
                icon: 'carbon:edit',
                class: 'text-base cursor-pointer',
                onClick: () => onEdit(row),
              },
            ),
            h(
              SvgIcon,
              {
                icon: 'carbon:delete',
                class: 'text-base cursor-pointer',
                onClick: () => onDelete(row),
              },
            ),
          ],
        },
      )
    },
  },
]

const submitStatus = computed(() => {
  if (tmpItem.name && tmpItem.title)
    return true

  return false
})

function onEdit(row: Workflow.NodeIODefinition) {
  showModal.value = true
  const idx = props.wfNode.inputConfig.user_inputs.findIndex(item => item.uuid === row.uuid)
  Object.assign(tmpItem, props.wfNode.inputConfig.user_inputs[idx])
}

function onDelete(row: Workflow.NodeIODefinition) {
  const idx = props.wfNode.inputConfig.user_inputs.findIndex(item => item.uuid === row.uuid)
  wfStore.deleteUserInput(props.workflow.uuid, props.wfNode.uuid, idx)
}

function onShowModal() {
  showModal.value = true
  Object.assign(tmpItem, { uuid: uuidv4().replace(/-/g, ''), type: 1, name: '', title: '', required: false })
}

function submitForm() {
  showModal.value = false
  const idx = props.wfNode.inputConfig.user_inputs.findIndex(item => item.uuid === tmpItem.uuid)
  if (idx > -1) {
    Object.assign(props.wfNode.inputConfig.user_inputs[idx], tmpItem)
  } else {
    wfStore.addUserInputToNode(props.workflow.uuid, props.wfNode.uuid, tmpItem)
    Object.assign(tmpItem, { uuid: '', type: 1, name: '', label: '', required: false })
  }
}
</script>

<template>
  <div class="flex flex-col w-full">
    <!-- <div>welcome word</div> -->
    <NCollapse :default-expanded-names="['1']">
      <NCollapseItem name="1" class="border border-gray-200 rounded-md m-2 px-3 pb-3">
        <template #header>
          <div class="text-xl">
            输入
          </div>
        </template>
        <NDataTable :columns="columns" :data="wfNode.inputConfig.user_inputs" />
      </NCollapseItem>
    </NCollapse>
    <br>
    <NButton @click="onShowModal">
      +新增
    </NButton>
  </div>
  <NModal v-model:show="showModal" style="width: 90%; max-height: 700px; max-width: 600px" preset="card" title="变量设置">
    <div class="flex flex-col w-full">
      类型
      <NSelect v-model:value="tmpItem.type" :options="options" />
      <br>
      名称
      <NInput v-model:value="tmpItem.name" maxlength="50" show-count />
      <br>
      标题（显示名称）
      <NInput v-model:value="tmpItem.title" maxlength="50" show-count />
      <br>
      <div>
        是否必须
        <NSwitch v-model:value="tmpItem.required" />
      </div>
      <br>
      <NFlex justify="end" style="margin-top: 20px">
        <NButton
          block type="primary" :disabled="!submitStatus" @click="
            () => {
              submitForm();
            }
          "
        >
          确认
        </NButton>
      </NFlex>
    </div>
  </NModal>
</template>
