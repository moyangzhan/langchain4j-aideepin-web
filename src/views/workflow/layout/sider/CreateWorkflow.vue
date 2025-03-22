<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import { NButton, NFlex, NFormItem, NInput, NModal, NPopconfirm, NSwitch, useMessage } from 'naive-ui'
import { useUserStore, useWfStore } from '@/store'
import api from '@/api'

const saving = ref<boolean>(false)
const tmpUuid = ref<string>('')
const tmpTitle = ref<string>('')
const tmpRemark = ref<string>('')
const tmpIsPublic = ref<boolean>(false)
const wfStore = useWfStore()
const userStore = useUserStore()
const ms = useMessage()

async function handleSave(event?: KeyboardEvent) {
  event?.stopPropagation()
  if (!tmpTitle.value) {
    ms.error('标题不能为空', {
      duration: 2000,
    })
    return
  }
  if (saving.value)
    return

  saving.value = true
  const params = { uuid: tmpUuid.value, title: tmpTitle.value, remark: tmpRemark.value, isPublic: tmpIsPublic.value }
  try {
    if (!tmpUuid.value) {
      const { data: wf } = await api.workflowAdd<Workflow.WorkflowInfo>(params)
      wfStore.addWorkflowAndActive(wf)
    } else {
      const { data: wf } = await api.workflowBaseInfoUpdate<Workflow.WorkflowInfo>(params)
      wfStore.updateBaseInfo(tmpUuid.value, wf)
    }
    tmpUuid.value = ''
    tmpTitle.value = ''
    tmpRemark.value = ''
    tmpIsPublic.value = false
  } catch (error: any) {
    console.log('Create workflow error', error)
    if (error.message) {
      ms.error(error.message, {
        duration: 2000,
      })
    }
  } finally {
    saving.value = false
    wfStore.setShowCreateView(false, '')
    ms.success('保存成功')
  }
}

async function onDelete() {
  if (!tmpUuid.value) {
    ms.error('删除失败，uuid为空')
    return
  }
  await api.workflowDel(tmpUuid.value)
  wfStore.deleteWorkflow(tmpUuid.value)
  wfStore.setShowCreateView(false, '')
  ms.success('删除成功')
}

onMounted(() => {
  console.log('CreateWorkflow mounted')
})

watch(() => wfStore.createOrEditWfUuid, (val) => {
  if (val) {
    tmpUuid.value = val
    const wf = wfStore.getWorkflowInfo(val)
    if (wf) {
      tmpTitle.value = wf.title
      tmpRemark.value = wf.remark
      tmpIsPublic.value = wf.isPublic
    }
  } else {
    tmpUuid.value = ''
    tmpTitle.value = ''
    tmpRemark.value = ''
    tmpIsPublic.value = false
  }
})
</script>

<template>
  <NModal v-model:show="wfStore.showCreateOrEditView" style="min-width:200px; max-width: 600px;" preset="card">
    <NFlex class="grow" justify="space-between" vertical>
      <NFormItem label="标题" :show-feedback="false" :show-require-mark="true">
        <NInput v-model:value="tmpTitle" type="text" size="large" placeholder="如：翻译" />
      </NFormItem>
      <NFormItem label="备注" :show-feedback="false">
        <NInput v-model:value="tmpRemark" type="text" size="large" />
      </NFormItem>
      <NFormItem label="是否公开" :show-feedback="false">
        <NSwitch v-model:value="tmpIsPublic">
          <template #checked>
            是
          </template>
          <template #unchecked>
            否
          </template>
        </NSwitch>
      </NFormItem>
      <div class="flex justify-center space-x-4">
        <NButton
          type="primary"
          :disabled="tmpUuid !== '' && wfStore.activeWorkflowInfo.userUuid !== userStore.userInfo.uuid"
          @click="handleSave()"
        >
          {{ $t('common.save') }}
        </NButton>
        <NPopconfirm placement="top" @positive-click.stop="onDelete">
          <template #trigger>
            <NButton
              type="error" ghost
              :disabled="tmpUuid !== '' && wfStore.activeWorkflowInfo.userUuid !== userStore.userInfo.uuid"
            >
              删除
            </NButton>
          </template>
          删除确认
        </NPopconfirm>
      </div>
    </NFlex>
  </NModal>
</template>
