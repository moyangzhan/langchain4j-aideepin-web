<script lang="ts" setup>
import { nextTick, onUnmounted, reactive, ref } from 'vue'
import { NButton, NInput, NInputNumber, NSwitch, NTab, NTabPane, NTabs, useMessage } from 'naive-ui'
import { useAuthStore, useWfStore } from '@/store'
import { SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import api from '@/api'
import { t } from '@/locales'

interface Props {
  workflow: Workflow.WorkflowInfo
}
interface TabObj {
  name: string
  tab: string
  defaultTab: string
}
interface Emit {
  (e: 'runDone'): void
  (e: 'runError', errorMsg: string): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const { isMobile } = useBasicLayout()
const wfStore = useWfStore()
const authStore = useAuthStore()
const ms = useMessage()
const submitting = ref<boolean>(wfStore.submitting)
const startNode = wfStore.getStartNode(props.workflow.uuid)
const wfRuntimeUuid = ref<string>('')
const runtimeNodes = reactive<Workflow.WfRuntimeNode[]>([])
const userInputs = ref<Workflow.UserInput[]>(startNode?.inputConfig.user_inputs.map((input) => {
  return {
    name: input.name,
    content: {
      title: input.title,
      value: null,
      type: input.type,
    },
    required: input.required,
  }
}) || [])
const errorMsg = ref<string>('')
const currWfUuid = props.workflow.uuid
console.log('instance list currWfUuid', currWfUuid)
const showCurrentExecution = ref<boolean>(false)
const tabObj = ref<TabObj>({ name: 'runtimes', defaultTab: '流程执行详情', tab: '流程执行详情 ↓' })
let controller = new AbortController()

async function run() {
  if (!authStore.checkLoginOrShow())
    return

  if (submitting.value)
    return

  if (userInputs.value.some(input => input.required && input.content.value === null)) {
    console.log('请输入所有必填参数')
    return
  }

  submitting.value = true
  showCurrentExecution.value = true
  tabObj.value.tab = showCurrentExecution.value ? `${tabObj.value.defaultTab} ↓` : `${tabObj.value.defaultTab} ↑`

  controller = new AbortController()
  try {
    wfRuntimeUuid.value = ''
    const nodeUuidToRuntimeNodeUuid = new Map<string, string>()
    runtimeNodes.splice(0, runtimeNodes.length)
    await api.workflowRun({
      options: {
        uuid: currWfUuid,
        inputs: userInputs.value,
      },
      signal: controller.signal,
      startCallback: (wfRuntimeJson) => {
        if (!wfRuntimeJson) {
          ms.error('启动失败')
          return
        }
        const wfRuntime = JSON.parse(wfRuntimeJson) as Workflow.WorkflowRuntime
        wfRuntime.input = {}
        userInputs.value.forEach((item) => {
          wfRuntime.input[item.name] = item.content
        })
        wfRuntimeUuid.value = wfRuntime.uuid
        wfStore.appendWfRuntimes(
          currWfUuid,
          [wfRuntime],
        )
      },
      messageRecived: (chunk, event) => {
        const eventName = event || ''
        try {
          if (eventName.includes('[NODE_RUN_')) {
            const nodeUuid = eventName.replace('[NODE_RUN_', '').replace(']', '')
            console.log(`${nodeUuid}开始运行`)
            const runtimeNode = JSON.parse(chunk) as Workflow.WfRuntimeNode
            nodeUuidToRuntimeNodeUuid.set(nodeUuid, runtimeNode.uuid)
            wfStore.appendRuntimeNode(
              wfRuntimeUuid.value,
              runtimeNode,
            )
            runtimeNodes.push(runtimeNode)
          } else if (eventName.includes('[NODE_CHUNK_')) {
            const nodeUuid = eventName.replace('[NODE_CHUNK_', '').replace(']', '')
            const runtimeNodeUuid = nodeUuidToRuntimeNodeUuid.get(nodeUuid) || ''
            wfStore.appendChunkToRuntimeNode(
              wfRuntimeUuid.value,
              runtimeNodeUuid,
              chunk,
            )
          } else if (eventName.includes('[NODE_INPUT_')) {
            const nodeUuid = eventName.replace('[NODE_INPUT_', '').replace(']', '')
            const runtimeNodeUuid = nodeUuidToRuntimeNodeUuid.get(nodeUuid) || ''
            wfStore.appendInputToRuntimeNode(
              wfRuntimeUuid.value,
              runtimeNodeUuid,
              chunk,
            )
          } else if (eventName.includes('[NODE_OUTPUT_')) {
            const nodeUuid = eventName.replace('[NODE_OUTPUT_', '').replace(']', '')
            const runtimeNodeUuid = nodeUuidToRuntimeNodeUuid.get(nodeUuid) || ''
            wfStore.appendOutputToRuntimeNode(
              wfRuntimeUuid.value,
              runtimeNodeUuid,
              chunk,
            )
          }
        } catch (error) {
          console.error(error)
        }
      },
      doneCallback: (chunk) => {
        nextTick(() => {
          submitting.value = false
          wfStore.updateSuccess(currWfUuid, wfRuntimeUuid.value, chunk)
          ms.success('执行成功')
          emit('runDone')
        })
      },
      errorCallback: (error) => {
        submitting.value = false
        ms.error(error)
        ms.error(`系统提示：${error}`)
        emit('runError', error)
      },
    })
  } catch (error: any) {
    const errorMessage = error?.message ?? t('common.wrong')
    ms.error(errorMessage)
    submitting.value = false
  }
}

function handleStop() {
  if (wfStore.wfUuidToWfRuntimeLoading.get(currWfUuid))
    controller.abort()

  submitting.value = false
}

function handleClick() {
  showCurrentExecution.value = !showCurrentExecution.value
  tabObj.value.tab = showCurrentExecution.value ? `${tabObj.value.defaultTab} ↓` : `${tabObj.value.defaultTab} ↑`
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      run()
    }
  } else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      run()
    }
  }
}

onUnmounted(() => {
  if (wfStore.wfUuidToWfRuntimeLoading.get(currWfUuid))
    controller.abort()
})
</script>

<template>
  <div class="w-full max-w-screen-xl m-auto z-10">
    <NTabs type="line" justify-content="space-evenly" animated default-value="runtimes">
      <NTab name="runtimes" @click="handleClick">
        {{ tabObj.tab }}
      </NTab>
    </NTabs>
    <NTabs type="line" justify-content="space-evenly" animated>
      <NTabPane name="runtimes" display-directive="show" :tab-props="{ style: 'display:none' }">
        <transition name="collapse">
          <div v-show="showCurrentExecution" class="max-h-[500px] overflow-y-auto mb-2">
            <div v-show="runtimeNodes.length === 0" class="text-center py-2 text-neutral-400">
              无内容
            </div>
            <div
              v-for="node in runtimeNodes" :key="node.uuid"
              class="flex flex-col space-y-2 border border-gray-200 p-2 m-2 rounded-md" :title="node.nodeTitle" :name="node.uuid"
            >
              <div class="text-lg mb-2">
                节点：{{ node.nodeTitle }}
              </div>
              <div class="flex flex-col space-y-2">
                <div class="text-base border-b border-gray-200 py-1">
                  输入
                </div>
                <div v-for="(content, name) in node.input" :key="`input_${name}`" class="flex">
                  <div class="min-w-24">
                    {{ name }}
                  </div>
                  <div>
                    {{ content.value }}
                  </div>
                </div>
                <div class="text-base border-b border-gray-200 py-1">
                  输出
                </div>
                <div v-for="(content, name) in node.output" :key="`onput_${name}`" class="flex">
                  <div class="min-w-24">
                    {{ name }}
                  </div>
                  <div>
                    {{ content.value }}
                  </div>
                </div>
              </div>
            </div>
            <div class="sticky bottom-0 left-0 flex justify-center">
              <NButton v-show="submitting" size="tiny" @click="handleStop">
                <template #icon>
                  <SvgIcon icon="ri:stop-circle-line" />
                </template>
                停止请求
              </NButton>
            </div>
          </div>
        </transition>
      </NTabPane>
    </NTabs>
    <div v-if="errorMsg">
      {{ errorMsg }}
    </div>
    <div class="flex items-center justify-between space-x-2">
      <div
        v-for="(userInput, idx) in userInputs" :key="`${idx}_${userInput.name}`"
        class="w-full flex flex-row items-center"
      >
        <div class="min-w-24">
          {{ userInput.content.title }}
        </div>
        <NInput v-if="userInput.content.type === 1" v-model:value="userInput.content.value" @keypress="handleEnter" />
        <NInputNumber v-if="userInput.content.type === 2" v-model:value="userInput.content.value" />
        <NSwitch v-if="userInput.content.type === 5" v-model:value="userInput.content.value" />
      </div>
      <NButton type="primary" :disabled="submitting" :loading="submitting" @click="run">
        提交
      </NButton>
    </div>
  </div>
</template>
