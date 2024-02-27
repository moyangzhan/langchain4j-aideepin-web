import type { GenericAbortSignal } from 'axios'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { get, post } from '@/utils/request'
import { useAuthStore, useUserStore } from '@/store'

class FatalError extends Error { }

function fetchUserConfig<T = any>() {
  return get<T>({
    url: '/user/config',
  })
}

function fetchConvs<T = any>() {
  return get<T>({
    url: '/conversation/list',
  })
}

function convEdit<T = any>(params: { uuid: string; title: string; aiSystemMessage: string }) {
  return post<T>({
    url: `/conversation/edit/${params.uuid}`,
    data: {
      ...params,
    },
  })
}

function convToggleUsingContext<T = any>(uuid: string, usingContext: boolean) {
  return post<T>({
    url: `/conversation/edit/${uuid}`,
    data: {
      understandContextEnable: usingContext,
    },
  })
}

function convDel<T = any>(uuid: string) {
  return post<T>({
    url: `/conversation/del/${uuid}`,
  })
}

function fetchMessages<T = any>(conversationUuid: string, maxMsgUuid: string, pageSize: number) {
  return get<T>({
    url: `/conversation/${conversationUuid}?maxMsgUuid=${maxMsgUuid}&pageSize=${pageSize}`,
  })
}

function sseProcess(params: {
  options: { prompt?: string; conversationUuid?: string; parentMessageId?: string; regenerateQuestionUuid?: string; modelName?: string }
  signal?: GenericAbortSignal
  messageRecived: (chunk: string) => void
  errorCallback: (error: string) => void
}) {
  fetchEventSource('/api/conversation/message/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...params.options,
    }),
    async onopen(response) {
      if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
        // everything's good
      } else if (response.status === 401) {
        console.log('无登录权限')
        const authStore = useAuthStore()
        authStore.removeToken()
        const userStore = useUserStore()
        userStore.resetUserInfo()
        throw new FatalError('无登录权限')
      } else {
        throw new FatalError()
      }
    },
    onmessage(eventMessage) {
      if (eventMessage.event === 'error') {
        console.log(`error:${eventMessage.data}`)
        params.errorCallback(eventMessage.data)
        return
      }
      // 会自动处理后端返回内容的首个空格，需在后端的返回内容前多加个空格，相关源码：https://github.com/Azure/fetch-event-source/blob/45ac3cfffd30b05b79fbf95c21e67d4ef59aa56a/src/parse.ts#L129-L133
      params.messageRecived(eventMessage.data)
    },
    onerror(error) {
      console.log(`sseProcess error:${error}`)
      throw new FatalError(error)
    },
  })
}

function login<T>(email: string, password: string, captchaId: string, captchaCode: string) {
  return post<T>({
    url: '/auth/login',
    data: { email, password, captchaId, captchaCode },
  })
}

function register<T>(email: string, password: string, captchaId: string, captchaCode: string) {
  return post<T>({
    url: '/auth/register',
    data: { email, password, captchaId, captchaCode },
  })
}

function logout<T>() {
  return post<T>({
    url: '/user/logout',
  })
}

function userEdit<T>(config: User.Config) {
  return post<T>({
    url: '/user/edit',
    data: config,
  })
}

function passwordReset<T>() {
  return post<T>({
    url: '/auth/password/reset',
  })
}

function passwordFind<T>(email: string) {
  return post<T>({
    url: `/auth/password/forgot?email=${email}`,
  })
}

function modifyPassword<T>(oldPassword: string, newPassword: string) {
  return post<T>({
    url: '/user/password/modify',
    data: { oldPassword, newPassword },
  })
}

function searchPrompts<T>(currentPage: number, pageSize: number, keyword?: string) {
  const search = keyword === undefined ? '' : `keyword=${keyword}&`
  return get<T>({
    url: `/prompt/my/search?${search}currentPage=${currentPage}&pageSize=${pageSize}`,
  })
}

function promptAutocomplete<T>(keyword: string) {
  const search = keyword === undefined ? '' : `keyword=${keyword}`
  return get<T>({
    url: `/prompt/my/autocomplete?${search}`,
  })
}

function promptsSave<T>(prompts: { act: string; prompt: string }[]) {
  return post<T>({
    url: '/prompt/save',
    data: { prompts },
  })
}

function promptDel<T>(id: number) {
  return post<T>({
    url: `/prompt/del/${id}`,
  })
}

function promptEdit<T>(id: number, title: string, remark: string) {
  return post<T>({
    url: `/prompt/edit/${id}`,
    data: { title, remark },
  })
}

function fetchAiImage<T = any>(uuid: string) {
  return get<T>({
    url: `/ai-image/detail/${uuid}`,
  })
}

function fetchAiImages<T = any>(maxId: number, pageSize: number) {
  return get<T>({
    url: `/ai-image/list?maxId=${maxId}&pageSize=${pageSize}`,
  })
}

function fileDel<T = any>(uuid: string) {
  return post<T>({
    url: `/file/del/${uuid}`,
  })
}

function imageGenerate<T = any>(prompt: string, size: string, number: number) {
  return post<T>({
    url: '/ai-image/generation',
    data: { prompt, size, number },
  })
}

function imageEdit<T = any>(originalImage: string, maskImage: string, prompt: string, size: string, number: number) {
  return post<T>({
    url: '/ai-image/edit',
    data: { originalImage, maskImage, prompt, size, number },
  })
}

function imageDel<T = any>(uuid: string) {
  return post<T>({
    url: `/ai-image/del/${uuid}`,
  })
}

function imageVariation<T = any>(originalImage: string, size: string, number: number) {
  return post<T>({
    url: '/ai-image/variation',
    data: { originalImage, size, number },
  })
}

function messageDel<T = any>(uuid: string) {
  return post<T>({
    url: `/conversation/message/del/${uuid}`,
  })
}

function knowledgeBaseSearch<T>(keyword: string, includeOthersPublic: boolean, currentPage: number, pageSize: number) {
  const search = keyword === undefined ? '' : `keyword=${keyword}&`
  return get<T>({
    url: `/knowledge-base/search?${search}currentPage=${currentPage}&pageSize=${pageSize}&includeOthersPublic=${includeOthersPublic}`,
  })
}

function knowledgeBaseSaveOrUpdate<T = any>(obj: KnowledgeBase.Info) {
  return post<T>({
    url: '/knowledge-base/saveOrUpdate',
    data: obj,
  })
}

function knowledgeBaseInfo<T = any>(uuid: string) {
  return get<T>({
    url: `/knowledge-base/info/${uuid}`,
  })
}

function knowledgeBaseDelete<T = any>(uuid: string) {
  return post<T>({
    url: `/knowledge-base/del/${uuid}`,
  })
}

function knowledgeBaseItemSearch<T>(currentPage: number, pageSize: number, kbUuid: string, keyword?: string) {
  const search = keyword === undefined ? '' : `keyword=${keyword}&`
  return get<T>({
    url: `/knowledge-base-item/search?${search}kbUuid=${kbUuid}&currentPage=${currentPage}&pageSize=${pageSize}`,
  })
}

function knowledgeBaseItemSaveOrUpdate<T = any>(obj: KnowledgeBase.Item) {
  return post<T>({
    url: '/knowledge-base-item/saveOrUpdate',
    data: obj,
  })
}

function knowledgeBaseItemDelete<T = any>(uuid: string) {
  return post<T>({
    url: `/knowledge-base-item/del/${uuid}`,
  })
}

function knowledgeBaseItemEmbedding<T = any>(uuids: string[]) {
  return post<T>({
    url: '/knowledge-base-item/embedding-list',
    data: {
      uuids,
    },
  })
}

function knowledgeBaseEmbedding<T = any>(kbItemUuid: string, currentPage: number, pageSize: number) {
  return get<T>({
    url: `/knowledge-base-embedding/list/${kbItemUuid}?currentPage=${currentPage}&pageSize=${pageSize}`,
  })
}

function knowledgeBaseQaAsk<T = any>(kbUuid: string, question: string, modelName?: string) {
  return post<T>({
    url: `/knowledge-base/qa/ask/${kbUuid}`,
    data: {
      question,
      modelName,
    },
  })
}

function knowledgeBaseQaRecordSearch<T = any>(kbUuid: string, keyword: string, currentPage: number, pageSize: number) {
  return get<T>({
    url: `/knowledge-base/qa/record/search?kbUuid=${kbUuid}&keyword=${keyword}&currentPage=${currentPage}&pageSize=${pageSize}`,
  })
}

function knowledgeBaseQaRecordDel<T = any>(uuid: string) {
  return post<T>({
    url: `/knowledge-base/qa/record/del/${uuid}`,
  })
}

function loadLLMs<T = any>() {
  return get<T>({
    url: '/model/llms',
  })
}

function loadImageModels<T = any>() {
  return get<T>({
    url: '/model/imageModels',
  })
}

export default {
  login,
  register,
  logout,
  passwordReset,
  passwordFind,
  modifyPassword,
  fetchUserConfig,
  userEdit,
  fetchConvs,
  convEdit,
  convToggleUsingContext,
  convDel,
  fetchMessages,
  sseProcess,
  searchPrompts,
  promptsSave,
  promptDel,
  promptEdit,
  promptAutocomplete,
  fileDel,
  fetchAiImage,
  fetchAiImages,
  imageGenerate,
  imageEdit,
  imageVariation,
  imageDel,
  messageDel,
  knowledgeBaseInfo,
  knowledgeBaseSearch,
  knowledgeBaseSaveOrUpdate,
  knowledgeBaseDelete,
  knowledgeBaseItemSaveOrUpdate,
  knowledgeBaseItemSearch,
  knowledgeBaseItemDelete,
  knowledgeBaseItemEmbedding,
  knowledgeBaseEmbedding,
  knowledgeBaseQaAsk,
  knowledgeBaseQaRecordSearch,
  knowledgeBaseQaRecordDel,
  loadLLMs,
  loadImageModels,
}
