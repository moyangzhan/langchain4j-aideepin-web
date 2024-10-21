<script setup lang='ts'>
import type { UploadFileInfo, UploadInst } from 'naive-ui'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { NBreadcrumb, NBreadcrumbItem, NButton, NCard, NDataTable, NFlex, NIcon, NInput, NModal, NP, NSpace, NSwitch, NText, NUpload, NUploadDragger, useDialog, useMessage } from 'naive-ui'
import { ArchiveOutline } from '@vicons/ionicons5'
import { Cloud32Regular, LockClosed32Regular } from '@vicons/fluent'
import { useRoute } from 'vue-router'
import ItemEmbeddingList from './ItemEmbeddingList.vue'
import ItemGraph from './ItemGraph.vue'
import { createColumns } from './itemColumns'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAuthStore } from '@/store'
import { knowledgeBaseEmptyInfo, knowledgeBaseEmptyItem } from '@/utils/functions'
import { t } from '@/locales'
import api from '@/api'

const ms = useMessage()
const dialog = useDialog()
const route = useRoute()
const { kbUuid: curKbUuid } = route.params as { kbUuid: string; kbId: string }
console.log('knowledge-base uuid', curKbUuid)

const showEmbeddingListModal = ref(false)
const showGraphModal = ref(false)
const kbItemUuidForEmbeddingList = ref<string>('')
const kbItemUuidForGraph = ref<string>('')

const loading = ref(false)
const submitting = ref(false)
const showItemEditModal = ref(false)
const itemList = ref<KnowledgeBase.Item[]>([])
const indexAfterUpload = ref(true)
const uploadRef = ref<UploadInst | null>(null)
const headers = { Authorization: '' }
const fileListLength = ref(0)
const fileList = ref<UploadFileInfo[]>([])
const paginationReactive = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
})
const searchValue = ref<string>('')
const tmpItem = reactive<KnowledgeBase.Item>(knowledgeBaseEmptyItem())
// 控制 input 按钮
const inputStatus = computed(() => tmpItem.title.trim().length < 1 && !submitting.value)
const { isMobile } = useBasicLayout()
const authStore = useAuthStore()
const token = ref<string>(authStore.token)
const checkedItemRowKeys = ref<string[]>([])
const curKnowledgeBase: KnowledgeBase.Info = reactive<KnowledgeBase.Info>(knowledgeBaseEmptyInfo())

const showFileContent = (selected: KnowledgeBase.Item = knowledgeBaseEmptyItem()) => {
  window.open(`/api/file/${selected.sourceFileUuid}?token=${token.value}`, '_blank')
}

const showEmbeddingList = (selected: KnowledgeBase.Item = knowledgeBaseEmptyItem()) => {
  showEmbeddingListModal.value = true
  kbItemUuidForEmbeddingList.value = selected.uuid
}

const showGraph = (selected: KnowledgeBase.Item = knowledgeBaseEmptyItem()) => {
  showGraphModal.value = true
  kbItemUuidForGraph.value = selected.uuid
}

const changeItemShowModal = (selected: KnowledgeBase.Item = knowledgeBaseEmptyItem()) => {
  if (selected.kbId !== '0') {
    Object.assign(tmpItem, selected)
  } else {
    Object.assign(tmpItem, knowledgeBaseEmptyItem())
    tmpItem.kbId = curKnowledgeBase.id
    tmpItem.kbUuid = curKnowledgeBase.uuid
  }
  showItemEditModal.value = !showItemEditModal.value
}

function rowKey(row: KnowledgeBase.Item) {
  return row.uuid
}

const columns = createColumns(showEmbeddingList, showGraph, showFileContent, changeItemShowModal, deleteKbItem)

/**
 * 索引文档
 */
async function textIndexing() {
  if (checkedItemRowKeys.value.length === 0) {
    ms.warning('至少选中一行')
    return
  }
  if (loading.value) {
    ms.warning('indexing')
    return
  }
  loading.value = true
  try {
    await api.knowledgeBaseItemsIndexing(checkedItemRowKeys.value)
    indexingCheck()
    ms.success('索引任务后台执行中')
  } catch (error: any) {
    ms.error(error.message ?? 'error')
  } finally {
    loading.value = false
  }
}

/**
 * 检查索引是否已经完成，如果已完成，则刷新列表
 */
async function indexingCheck() {
  const response = await api.knowledgeBaseIndexingCheck()
  if (response.data) {
    search(1)
  } else {
    setTimeout(() => {
      indexingCheck()
    }, 3000)
  }
}

function onHandleCheckedRowKeys(rows: string[]) {
  checkedItemRowKeys.value = rows
}

async function onHandlePageChange(currentPage: number) {
  search(currentPage)
}

async function onKeyUpSearch(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    search(1)
  }
}

async function onUploadBefore(data: {
  file: UploadFileInfo
  fileList: UploadFileInfo[]
}) {
  return true
}

function onUploadChange(options: { fileList: UploadFileInfo[] }) {
  console.log('onUploadChange')
  fileListLength.value = options.fileList.length
}

function onUploadSubmit() {
  uploadRef.value?.submit()
}

function onUploadFinish({
  file,
  event,
}: {
  file: UploadFileInfo
  event?: ProgressEvent
}) {
  console.log(event)
  ms.success((event?.target as XMLHttpRequest).response)
  return file
}

async function search(currentPage: number) {
  loading.value = true
  try {
    const resp = await api.knowledgeBaseItemSearch<PageResponse>(currentPage, paginationReactive.pageSize, curKbUuid, searchValue.value)
    setResp(currentPage, resp.data)
  } finally {
    loading.value = false
  }
}

function setResp(currentPage: number, data: PageResponse) {
  itemList.value = data.records
  paginationReactive.page = currentPage
  paginationReactive.itemCount = data.total
}

async function saveOrUpdate() {
  try {
    submitting.value = true
    const resp = await api.knowledgeBaseItemSaveOrUpdate<KnowledgeBase.Item>(tmpItem)
    Object.assign(tmpItem, resp.data)
  } finally {
    submitting.value = false
    showItemEditModal.value = false
    Object.assign(tmpItem, knowledgeBaseEmptyItem())
    search(1)
  }
}

function deleteKbItem(row: KnowledgeBase.Item) {
  dialog.warning({
    title: '删除提示',
    content: '删除后无法恢复',
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      api.knowledgeBaseItemDelete(row.uuid)
      nextTick(() => {
        itemList.value = itemList.value.filter(item => item.uuid !== row.uuid)
      })
    },
  })
}

async function initData() {
  search(1)
  const resp = await api.knowledgeBaseInfo<KnowledgeBase.Info>(curKbUuid)
  Object.assign(curKnowledgeBase, resp.data)
}

onMounted(async () => {
  if (curKnowledgeBase.title === '')
    await initData()
})
watch(
  () => token,
  () => {
    if (token.value) {
      initData()
      headers.Authorization = token.value
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="p-4">
    <NBreadcrumb separator=">">
      <NBreadcrumbItem href="/">
        首页
      </NBreadcrumbItem>
      <NBreadcrumbItem href="/#/kb-manage">
        我的知识库
      </NBreadcrumbItem>
      <NBreadcrumbItem :clickable="false">
        {{ curKnowledgeBase.title }}
      </NBreadcrumbItem>
    </NBreadcrumb>
    <NCard
      style="margin-top: 12px"
      :title="`知识库: ${curKnowledgeBase.title}(${curKnowledgeBase.isPublic ? '公开' : '私有'})`" hoverable
    >
      <template #header-extra>
        <NIcon v-if="curKnowledgeBase.isPublic" :component="Cloud32Regular" />
        <NIcon v-if="!curKnowledgeBase.isPublic" :component="LockClosed32Regular" />
      </template>
      {{ curKnowledgeBase.remark }}
    </NCard>
    <NCard style="margin-top: 12px" title="上传文档以生成知识点" hoverable>
      <NSpace vertical>
        <NUpload
          ref="uploadRef" multiple :default-file-list="fileList" directory-dnd
          :action="`/api/knowledge-base/upload/${curKbUuid}?indexAfterUpload=${indexAfterUpload}`"
          :default-upload="false" :max="20" :headers="headers" @before-upload="onUploadBefore" @finish="onUploadFinish"
          @change="onUploadChange"
        >
          <NUploadDragger>
            <div style="margin-bottom: 12px">
              <NIcon size="48" :depth="3">
                <ArchiveOutline />
              </NIcon>
            </div>
            <NText style="font-size: 16px">
              点击或者拖动文件到该区域来上传
            </NText>
            <NP depth="3" style="margin: 8px 0 0 0">
              支持的文件格式: TXT、PDF、DOC、DOCX、XLS、XLXS、PPT、PPTX<br>
              文件大小：不超过10M
            </NP>
          </NUploadDragger>
        </NUpload>
        <NFlex>
          <NButton type="primary" :disabled="!fileListLength" @click="onUploadSubmit">
            上传并生成知识点
          </NButton>
          <NFlex class="items-center">
            <NSwitch v-model:value="indexAfterUpload">
              <template #checked>
                自动索引（向量化、图谱化）
              </template>
              <template #unchecked>
                不自动索引
              </template>
            </NSwitch>
          </NFlex>
        </NFlex>
      </NSpace>
    </NCard>
    <NCard style="margin-top: 12px" title="已生成的知识点" hoverable>
      <div class="flex gap-3 mb-4" :class="[isMobile ? 'flex-col' : 'flex-row justify-between']">
        <div class="flex items-left gap-2">
          <NButton type="primary" size="small" @click="changeItemShowModal()">
            {{ $t('common.add') }}
          </NButton>
          <NButton type="primary" size="small" @click="textIndexing()">
            索引选中内容
          </NButton>
        </div>
        <div class="flex items-center">
          <NInput v-model:value="searchValue" style="width: 100%" @keyup="onKeyUpSearch" />
          <NButton type="primary" ghost @click="search(1)">
            搜索
          </NButton>
        </div>
      </div>
      <NDataTable
        remote :loading="loading" :max-height="400" :columns="columns" :data="itemList"
        :pagination="paginationReactive" :single-line="false" :bordered="true" :row-key="rowKey"
        @update:checked-row-keys="onHandleCheckedRowKeys" @update:page="onHandlePageChange"
      />
    </NCard>
  </div>

  <NModal
    v-model:show="showItemEditModal" style="width: 90%; max-height: 700px;" preset="card"
    title="知识点-新增|编辑"
  >
    <NSpace vertical>
      {{ t('store.title') }}
      <NInput v-model:value="tmpItem.title" maxlength="100" show-count />
      摘要
      <NInput
        v-model:value="tmpItem.brief" type="textarea" maxlength="200" show-count
        :autosize="{ minRows: 2, maxRows: 5 }"
      />
      内容
      <NInput v-model:value="tmpItem.remark" type="textarea" show-count :autosize="{ minRows: 5, maxRows: 10 }" />
      <NButton block type="primary" :disabled="inputStatus" @click="() => { saveOrUpdate() }">
        {{ t('common.confirm') }}
      </NButton>
    </NSpace>
  </NModal>

  <NModal v-model:show="showEmbeddingListModal" style="width: 90%; " preset="card" title="嵌入列表">
    <ItemEmbeddingList :kb-item-uuid="kbItemUuidForEmbeddingList" />
  </NModal>
  <NModal v-model:show="showGraphModal" style="width: 90%;" display-directive="show" preset="card" title="图谱">
    <ItemGraph :kb-item-uuid="kbItemUuidForGraph" />
  </NModal>
</template>
