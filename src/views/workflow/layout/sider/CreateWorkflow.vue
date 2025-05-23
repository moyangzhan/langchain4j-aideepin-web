<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { NAvatar, NButton, NDivider, NFlex, NFormItem, NInput, NModal, NPopconfirm, NSwitch, NTag, NTooltip, useMessage } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import defaultAvatar from '@/assets/avatar.jpg'
import { useAuthStore, useUserStore, useWfStore } from '@/store'
import api from '@/api'
import { emptyWorkflowInfo } from '@/utils/functions'

const saving = ref<boolean>(false)
const tmpWorkflow = ref<Workflow.WorkflowInfo>(emptyWorkflowInfo())

const wfStore = useWfStore()
const userStore = useUserStore()
const authStore = useAuthStore()
const ms = useMessage()

async function handleSave(event?: KeyboardEvent) {
  event?.stopPropagation()
  if (!tmpWorkflow.value.title) {
    ms.error('标题不能为空', {
      duration: 2000,
    })
    return
  }
  if (saving.value)
    return

  saving.value = true
  const params = { uuid: tmpWorkflow.value.uuid, title: tmpWorkflow.value.title, remark: tmpWorkflow.value.remark, isPublic: tmpWorkflow.value.isPublic }
  try {
    if (!tmpWorkflow.value.uuid) {
      const { data: wf } = await api.workflowAdd<Workflow.WorkflowInfo>(params)
      wfStore.addWorkflowAndActive(wf)
    } else {
      const { data: wf } = await api.workflowBaseInfoUpdate<Workflow.WorkflowInfo>(params)
      wfStore.updateBaseInfo(tmpWorkflow.value.uuid, wf)
    }
    tmpWorkflow.value = emptyWorkflowInfo()
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
  if (!tmpWorkflow.value.uuid) {
    ms.error('删除失败，uuid为空')
    return
  }
  await api.workflowDel(tmpWorkflow.value.uuid)
  wfStore.deleteWorkflow(tmpWorkflow.value.uuid)
  wfStore.setShowCreateView(false, '')
  ms.success('删除成功')
}

const viewStyle = computed(() => {
  console.log(tmpWorkflow.value)
  if (wfStore.createOrEditWfUuid) {
    if (tmpWorkflow.value.userUuid === userStore.userInfo.uuid)
      return 'edit'

    return 'read'
  } else {
    return 'create'
  }
})

const title = computed(() => {
  if (viewStyle.value === 'create')
    return '新增'
  else if (viewStyle.value === 'edit')
    return '编辑'
  else
    return '查看'
})

onMounted(() => {
  console.log('CreateWorkflow mounted')
})

watch(() => wfStore.createOrEditWfUuid, (val) => {
  console.log('CreateWorkflow watch createOrEditWfUuid', val)
  if (val) {
    tmpWorkflow.value.uuid = val
    const wf = wfStore.getWorkflowInfo(val)
    if (wf) {
      tmpWorkflow.value.title = wf.title
      tmpWorkflow.value.remark = wf.remark
      tmpWorkflow.value.isPublic = wf.isPublic
      tmpWorkflow.value.userUuid = wf.userUuid
      tmpWorkflow.value.userName = wf.userName
      tmpWorkflow.value.nodes = wf.nodes
    }
  } else {
    tmpWorkflow.value = emptyWorkflowInfo()
  }
})
</script>

<template>
  <NModal
    v-model:show="wfStore.showCreateOrEditView" :title="title" style="min-width:200px; max-width: 600px;"
    preset="card"
  >
    <NFlex vertical>
      <NFlex v-show="viewStyle === 'read'" justify="space-between">
        <NTag size="large" :bordered="false" :color="{ color: '#ff000000' }">
          {{ tmpWorkflow.userName || userStore.userInfo.name }}
          <template #avatar>
            <NAvatar
              :src="`/api/user/avatar/${tmpWorkflow.userUuid || authStore.token}`" size="large"
              :fallback-src="defaultAvatar" color="#ff0000000"
            />
          </template>
        </NTag>
        <NFlex>
          <NTooltip trigger="hover">
            <template #trigger>
              <NTag size="medium" :bordered="false" round :color="{ color: '#ff000000' }">
                {{ tmpWorkflow.nodes.length }}
                <template #icon>
                  <SvgIcon icon="healthicons:lymph-nodes-outline" />
                </template>
              </NTag>
            </template>
            节点
          </NTooltip>
        </NFlex>
      </NFlex>
      <NDivider v-show="viewStyle === 'read'" />
      <div v-show="viewStyle !== 'read'">
        <NFlex class="grow" justify="space-between" vertical>
          <NFormItem label="标题" :show-feedback="false" :show-require-mark="true">
            <NInput v-model:value="tmpWorkflow.title" type="text" size="large" placeholder="如：翻译" />
          </NFormItem>
          <NFormItem label="备注" :show-feedback="false">
            <NInput v-model:value="tmpWorkflow.remark" type="text" size="large" />
          </NFormItem>
          <NFormItem label="是否公开" :show-feedback="false">
            <NSwitch v-model:value="tmpWorkflow.isPublic">
              <template #checked>
                是
              </template>
              <template #unchecked>
                否
              </template>
            </NSwitch>
          </NFormItem>
          <div class="flex justify-end space-x-4">
            <NButton
              v-show="tmpWorkflow.uuid" type="primary" :loading="saving" :disabled="saving"
              @click="handleSave()"
            >
              更新
            </NButton>
            <NButton
              v-show="!tmpWorkflow.uuid" type="primary" :loading="saving" :disabled="saving"
              @click="handleSave()"
            >
              新增
            </NButton>
            <NPopconfirm placement="top" @positive-click.stop="onDelete">
              <template #trigger>
                <NButton v-show="tmpWorkflow.uuid" :disabled="saving" type="error" ghost>
                  删除
                </NButton>
              </template>
              删除确认
            </NPopconfirm>
          </div>
        </NFlex>
      </div>
      <div v-show="viewStyle === 'read'" class="flex flex-col space-y-2">
        <div class="text-base">
          {{ tmpWorkflow.title }}
        </div>
        <div>{{ tmpWorkflow.remark }}</div>
      </div>
    </NFlex>
  </NModal>
</template>
