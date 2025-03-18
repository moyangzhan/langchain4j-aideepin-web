import { defineStore } from 'pinia'
import { defaultConv, defaultState, findMessageFromConv } from './helper'
import { router } from '@/router'

export const useChatStore = defineStore('chat-store', {
  state: (): Chat.ChatState => defaultState(),

  getters: {
    allConvsCount(state: Chat.ChatState) {
      return state.conversations.length
    },

    getCurConv(state: Chat.ChatState) {
      const index = state.conversations.findIndex(item => item.uuid === state.active)
      if (index !== -1)
        return state.conversations[index]
      return null
    },

    getConvByUuid(state: Chat.ChatState) {
      return (uuid: string) => {
        return state.conversations.find(item => item.uuid === uuid)
      }
    },

    getMsgsByConv(state: Chat.ChatState) {
      return (uuid?: string) => {
        if (uuid)
          return state.chats.find(item => item.uuid === uuid)?.data ?? []
        return state.chats.find(item => item.uuid === state.active)?.data ?? []
      }
    },

    getMsgByCurConv(state: Chat.ChatState) {
      return (messageUuid: string) => {
        const messages = state.chats.find(item => item.uuid === state.active)?.data ?? []
        const hitMessage = messages.find(item => item.uuid === messageUuid)
        if (hitMessage)
          return hitMessage
        return null
      }
    },

    hasLoadedData(state: Chat.ChatState) {
      const currConversation = state.chats.find(item => item.uuid === state.active)
      if (currConversation)
        return currConversation.data.length > 0
      return false
    },
  },

  actions: {
    setUsingContext(context: boolean) {
      this.usingContext = context
    },

    clearDefault() {
      const index = this.conversations.findIndex(item => item.uuid === 'default')
      if (index !== -1) {
        this.conversations.splice(index, 1)
        this.chats.splice(index, 1)
      }
    },

    addConvs(convs: Chat.Conversation[]) {
      convs.forEach((item) => {
        if (this.conversations.findIndex(innerItem => innerItem.uuid === item.uuid) !== -1)
          return

        this.conversations.push(item)
        this.chats.push({ uuid: item.uuid, data: [] })
      })
    },

    addConvAndActive(newConv: Chat.Conversation, chatData: Chat.ChatMessage[] = []) {
      if (this.conversations.findIndex(item => item.uuid === newConv.uuid) !== -1)
        return

      this.conversations.unshift(newConv)
      this.chats.unshift({ uuid: newConv.uuid, data: chatData })
      this.active = newConv.uuid
      this.reloadRoute(newConv.uuid)
    },

    updateConv(convUuid: string, edit: Partial<Chat.Conversation>) {
      const index = this.conversations.findIndex(item => item.uuid === convUuid)
      if (index !== -1)
        this.conversations[index] = { ...this.conversations[index], ...edit }
    },

    async deleteConv(uuid: string) {
      const index = this.conversations.findIndex(item => item.uuid === uuid)
      this.conversations.splice(index, 1)
      this.chats.splice(index, 1)

      if (this.conversations.length === 0) {
        this.active = ''
        this.reloadRoute()
        return
      }

      if (index > 0 && index <= this.conversations.length) {
        const uuid = this.conversations[index - 1].uuid
        this.active = uuid
        this.reloadRoute(uuid)
        return
      }

      if (index === 0 && this.conversations.length > 0) {
        const uuid = this.conversations[0].uuid
        this.active = uuid
        this.reloadRoute(uuid)
      }

      if (index > this.conversations.length) {
        const uuid = this.conversations[this.conversations.length - 1].uuid
        this.active = uuid
        this.reloadRoute(uuid)
      }
    },

    async setActive(uuid: string) {
      this.active = uuid
      return await this.reloadRoute(uuid)
    },

    getMsgsByConvAndIndex(uuid: string, index: number) {
      if (!uuid) {
        if (this.chats.length)
          return this.chats[0].data[index]
        return null
      }
      const chatIndex = this.chats.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1)
        return this.chats[chatIndex].data[index]
      return null
    },

    addMessage(uuid: string, message: Chat.ChatMessage, tail?: boolean) {
      if (undefined === message.inversion)
        message.inversion = message.messageRole !== 3

      if (this.conversations.length === 0) {
        this.conversations.push(defaultConv())
        this.chats.push({ uuid, data: [message] })
        this.active = uuid
        return
      }

      const chatIndex = this.chats.findIndex(item => item.uuid === uuid)
      if (chatIndex === -1)
        return

      const cachedMsgs = this.chats[chatIndex].data
      let hit = false
      cachedMsgs.forEach((item) => {
        // 将之前的聊天信息中的loading状态全部置为false，保留当前消息的loading状态
        if (message.loading)
          item.loading = false

        if (item.uuid === message.uuid)
          hit = true
      })
      if (!hit)
        tail ? this.chats[chatIndex].data.push(message) : this.chats[chatIndex].data.unshift(message)

      if (this.conversations.find(item => item.uuid === uuid)?.title === 'New Chat')
        this.conversations[chatIndex].title = message.remark
    },

    unshiftMessages(uuid: string, messages: Chat.ChatMessage[]) {
      const chatIndex = this.chats.findIndex(item => item.uuid === uuid)
      if (chatIndex === -1)
        return
      const cachedMsgs = this.chats[chatIndex].data
      messages.forEach((item) => {
        cachedMsgs.unshift(item)
      })
    },

    updateMessage(uuid: string, index: number, chat: Chat.ChatMessage) {
      if (!uuid && this.chats.length) {
        this.chats[0].data[index] = chat
        return
      }

      const chatIndex = this.chats.findIndex(item => item.uuid === uuid)
      if (chatIndex !== -1)
        this.chats[chatIndex].data[index] = chat
    },

    unshiftChild(convUuid: string, userMessageUuid: string, childMessage: Chat.ChatMessage) {
      const chatIndex = this.chats.findIndex(item => item.uuid === convUuid)
      if (chatIndex !== -1)
        this.chats[chatIndex].data.find(item => item.uuid === userMessageUuid)?.children.unshift(childMessage)
    },

    appendChild(convUuid: string, userMessageUuid: string, childMessage: Chat.ChatMessage) {
      const chatIndex = this.chats.findIndex(item => item.uuid === convUuid)
      if (chatIndex !== -1)
        this.chats[chatIndex].data.find(item => item.uuid === userMessageUuid)?.children.push(childMessage)
    },

    appendChunk(convUuid: string, answerUuid: string, chunk: string) {
      const chatIndex = this.chats.findIndex(item => item.uuid === convUuid)
      if (chatIndex !== -1 && this.chats.length) {
        const oldChat = findMessageFromConv(this.chats[chatIndex], answerUuid)
        if (oldChat)
          oldChat.remark = oldChat.remark + chunk
      }
    },

    updateMessageSomeFields(convUuid: string, messageUuid: string, chat: Partial<Chat.ChatMessage>) {
      const convIndex = this.chats.findIndex(item => item.uuid === convUuid)
      if (convIndex !== -1) {
        const hitConv = this.chats[convIndex]
        const hitMessage = findMessageFromConv(hitConv, messageUuid)
        console.log('hitMessage', hitMessage)
        if (hitMessage)
          Object.assign(hitMessage, chat)
      }
    },

    deleteQuestion(convUuid: string, questionUuid: string) {
      const chatIndex = this.chats.findIndex(item => item.uuid === convUuid)
      if (chatIndex !== -1) {
        const index = this.chats[chatIndex].data.findIndex(message => message.uuid === questionUuid)
        if (index !== -1)
          this.chats[chatIndex].data.splice(index, 1)
      }
    },

    // Delete one answer of the question
    deleteAnswer(convUuid: string, questionUuid: string, answerUuid: string) {
      const chatIndex = this.chats.findIndex(item => item.uuid === convUuid)
      if (chatIndex !== -1) {
        const index = this.chats[chatIndex].data.findIndex(message => message.uuid === questionUuid)
        if (index !== -1) {
          const questionMsg = this.chats[chatIndex].data[index]
          const answerIndex = questionMsg.children.findIndex(child => child.uuid === answerUuid)
          if (answerIndex !== -1)
            questionMsg.children.splice(answerIndex, 1)
        }
      }
    },

    async reloadRoute(uuid?: string) {
      await router.push({ name: 'ChatDetail', params: { uuid } })
    },

    addLoadingMsg(convUuid: string) {
      this.loadingMsgs.add(convUuid)
    },

    deleteLoadingMsg(convUuid: string) {
      this.loadingMsgs.delete(convUuid)
    },

    setPresetConvs(convs: Chat.ConversationPreset[]) {
      this.presetConvs.splice(0, this.presetConvs.length)
      convs.forEach((item) => {
        if (this.presetConvs.findIndex(innerItem => innerItem.uuid === item.uuid) !== -1)
          return
        if (!item.used)
          item.used = false

        this.presetConvs.push(item)
      })
    },

    setUsedPresetConv(rels: Chat.ConvToPresetRel[]) {
      this.presetConvs.forEach((item) => {
        const hit = rels.some(rel => rel.presetConvId === item.id)
        item.used = hit
      })
    },
  },
})
