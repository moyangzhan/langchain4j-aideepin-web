import { format } from 'date-fns'

export function getCurrentDate() {
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

export function knowledgeBaseEmptyInfo() {
  return {
    id: '0',
    uuid: '',
    title: '',
    remark: '',
    isPublic: false,
    isStrict: true,
    starCount: 0,
    ownerUuid: '',
    ownerName: '',
    itemCount: 0,
    embeddingCount: 0,
    ragMaxOverlap: 0,
    ragMaxResults: 0,
    ragMinScore: 0,
    llmTemperature: 0,
  }
}

export function knowledgeBaseEmptyItem() {
  return {
    id: '0',
    uuid: '',
    kbId: '0',
    kbUuid: '',
    title: '',
    brief: '',
    remark: '',
    isEmbedded: false,
    sourceFileName: '',
    sourceFileUuid: '',
  }
}

export function knowledgeBaseEmptyRecord() {
  return {
    id: '0',
    uuid: '',
    kbId: '0',
    kbUuid: '',
    question: '',
    answer: '',
    createTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    aiModelPlatform: '',
    loading: false,
    error: false,
  }
}

export function aiSearchEmptyRecord() {
  return {
    uuid: '',
    question: '',
    searchEngineResp: {
      items: [],
    },
    answer: '',
    loading: false,
    error: false,
    createTime: new Date().toLocaleString(),
    aiModelPlatform: '',
  }
}

export function emptyAiModel() {
  return {
    // from api
    modelId: 'default',
    modelName: '',
    modelPlatform: '',
    enable: false,

    // for NSelector
    value: '',
    label: '',
    disabled: false,
  }
}
