<script setup lang='ts'>
import type { DataTableColumns, UploadFileInfo, UploadInst } from 'naive-ui'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { NBreadcrumb, NBreadcrumbItem, NButton, NCard, NDataTable, NEllipsis, NFlex, NIcon, NInput, NModal, NP, NSpace, NSwitch, NText, NUpload, NUploadDragger, useDialog, useMessage } from 'naive-ui'
import { ArchiveOutline } from '@vicons/ionicons5'
import { Cloud32Regular, LockClosed32Regular } from '@vicons/fluent'
import { useRoute } from 'vue-router'
import ItemEmbeddingList from './ItemEmbeddingList.vue'
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
const kbItemUuidForEmbeddingList = ref<string>('')

const loading = ref(false)
const submitting = ref(false)
const showItemEditModal = ref(false)
const itemList = ref<KnowledgeBase.Item[]>([])
const embeddingAfterUpload = ref(true)
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
  window.open(`/api/file/${selected.sourceFileUuid}`, '_blank')
}

const showEmbeddingList = (selected: KnowledgeBase.Item = knowledgeBaseEmptyItem()) => {
  showEmbeddingListModal.value = true
  kbItemUuidForEmbeddingList.value = selected.uuid
}

const changeItemShowModal = (selected: KnowledgeBase.Item = knowledgeBaseEmptyItem()) => {
  if (selected.kbId !== '0') {
    Object.assign(tmpItem, selected)
  } else {
    tmpItem.kbId = curKnowledgeBase.id
    tmpItem.kbUuid = curKnowledgeBase.uuid
  }
  showItemEditModal.value = !showItemEditModal.value
}

// table相关
const createColumns = (): DataTableColumns<KnowledgeBase.Item> => {
  return [
    {
      type: 'selection',
    },
    {
      title: '标题',
      key: 'title',
    },
    {
      title: '摘要',
      key: 'brief',
    },
    {
      title: '已嵌入',
      key: 'isEmbedded',
      width: 100,
      render(row) {
        if (row.isEmbedded) {
          return h('div', { class: 'flex flex-col' }, {
            default: () => [h(
              NButton,
              {
                text: true,
                tertiary: true,
                size: 'small',
                type: 'info',
                onClick: () => showEmbeddingList(row),
              },
              { default: () => '查看' },
            ),
            ],
          })
        } else {
          return '×'
        }
      },
    },
    {
      title: '附件',
      key: 'sourceFileName',
      width: 100,
      render(row) {
        const soureFile = !!row.sourceFileUuid
        if (soureFile) {
          return h('div', {
            class: 'flex flex-col',
            onClick: () => showFileContent(row),
          },
          {
            default: () => [h(
              NEllipsis,
              {
                lineClamp: 3,
                style: 'color:#2080f0;cursor:pointer',
              },
              { default: () => row.sourceFileName || row.title },
            ),
            ],
          })
        } else {
          return '无'
        }
      },
    },
    {
      title: t('common.action'),
      key: 'actions',
      width: 100,
      align: 'center',
      render(row) {
        return h('div', { class: 'flex items-center flex-col gap-2' }, {
          default: () => [h(
            NButton,
            {
              tertiary: true,
              size: 'small',
              type: 'info',
              onClick: () => changeItemShowModal(row),
            },
            { default: () => t('common.edit') },
          ),
          h(
            NButton,
            {
              tertiary: true,
              size: 'small',
              type: 'error',
              onClick: () => deleteKbItem(row),
            },
            { default: () => t('common.delete') },
          ),
          ],
        })
      },
    },
  ]
}

function rowKey(row: KnowledgeBase.Item) {
  return row.uuid
}

const columns = createColumns()

async function textEmbedding() {
  if (checkedItemRowKeys.value.length === 0) {
    ms.warning('至少选中一行')
    return
  }
  if (loading.value) {
    ms.warning('embedding')
    return
  }
  loading.value = true
  try {
    await api.knowledgeBaseItemsEmbedding(checkedItemRowKeys.value)
  } finally {
    loading.value = false

    search(1)
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
      itemList.value = itemList.value.filter(item => item.uuid !== row.uuid)
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
          :action="`/api/knowledge-base/upload/${curKbUuid}?embedding=${embeddingAfterUpload}`" :default-upload="false"
          :max="20" :headers="headers" @before-upload="onUploadBefore" @finish="onUploadFinish"
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
            <NSwitch v-model:value="embeddingAfterUpload">
              <template #checked>
                生成知识点后自动向量化
              </template>
              <template #unchecked>
                生成知识点后不向量化
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
          <NButton type="primary" size="small" @click="textEmbedding()">
            将选中内容向量化
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
    v-model:show="showItemEditModal" style="width: 90%; max-width: 600px;max-height: 700px;" preset="card"
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
</template>
