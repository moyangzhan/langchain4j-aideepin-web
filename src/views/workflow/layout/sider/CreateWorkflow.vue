<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import { NButton, NFlex, NFormItem, NInput, NModal, useMessage } from 'naive-ui'
import { useUserStore, useWfStore } from '@/store'
import api from '@/api'

const saving = ref<boolean>(false)
const tmpTitle = ref<string>('')
const tmpRemark = ref<string>('')
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
  const params = { title: tmpTitle.value, remark: tmpRemark.value }
  try {
    const { data: newWf } = await api.workflowAdd<Workflow.WorkflowInfo>(params)
    wfStore.addWorkflowAndActive(newWf)
    tmpTitle.value = ''
    tmpRemark.value = ''
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
  }
}

onMounted(() => {
  console.log('CreateWorkflow mounted')
})

watch(() => wfStore.createOrEditWfUuid, (val) => {
  if (val) {
    const wf = wfStore.getWorkflowInfo(val)
    if (wf) {
      tmpTitle.value = wf.title
      tmpRemark.value = wf.remark
    }
  } else {
    tmpTitle.value = ''
    tmpRemark.value = ''
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
      <NButton block type="primary" :disabled="wfStore.activeWorkflowInfo.userUuid !== userStore.userInfo.uuid" @click="handleSave()">
        {{ $t('common.save') }}
      </NButton>
    </NFlex>
  </NModal>
</template>
