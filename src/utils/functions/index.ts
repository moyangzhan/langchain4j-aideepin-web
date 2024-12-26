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
    ingestMaxOverlap: 0,
    ingestModelId: '0',
    retrieveMaxResults: 0,
    retrieveMinScore: 0,
    queryLlmTemperature: 0,
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
    embeddingStatus: 'NONE',
    graphicalStatus: 'NONE',
    embeddingStatusChangeTime: '',
    graphicalStatusChangeTime: '',
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
    isFree: false,
    inputTypes: 'text',

    // for NSelector
    key: '',
    label: '',
    disabled: false,
  }
}

export function emptyDraw() {
  return {
    id: 0,
    uuid: '',
    prompt: '',
    createTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    interactingMethod: 1,
    processStatus: 1,
    processStatusRemark: '',
    originalImageUuid: '',
    maskImageUuid: '',
    imageUuids: [],
    imageUrls: [],
    isPublic: false,
    isStar: false,
    aiModelName: '',
    starCount: 0,
    userUuid: '',
    userName: '',
  }
}

export function emptyConv(): Chat.Conversation {
  return {
    uuid: '',
    title: '',
    remark: '',
    aiSystemMessage: '',
    understandContextEnable: false,
    loadedAll: false,
    loadedFirstPageMsg: false,
    minMsgUuid: '',
  }
}

export function calcImageUrls(draw: Chat.Draw) {
  draw.imageUrls = draw.imageUuids.map((item) => {
    if (draw.isPublic)
      return `/draw/public/image/${draw.uuid}/${item}`
    else
      return `/image/${item}`
  })
}
