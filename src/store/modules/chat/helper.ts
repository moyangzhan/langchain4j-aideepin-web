import { v4 as uuidv4 } from 'uuid'
import { ss } from '@/utils/storage'
const LOCAL_NAME = 'chatStorage'

const uuid = uuidv4().replace(/-/g, '')
console.log(`init defaultConversation uuid:${uuid}`)
const defaultConversation = {
  uuid,
  title: 'New Chat',
  aiSystemMessage: '',
  understandContextEnable: false,
  loadedAll: false,
  loadedFirstPageMsg: false,
}

export function defaultState(): Chat.ChatState {
  return {
    active: defaultConversation.uuid,
    usingContext: true,
    conversations: [defaultConversation],
    chats: [{ uuid: defaultConversation.uuid, data: [] }],
  }
}

export function defaultConv(): Chat.Conversation {
  return defaultConversation
}

export function getLocalState(): Chat.ChatState {
  const localState = ss.get(LOCAL_NAME)
  return { ...defaultState(), ...localState }
}

export function setLocalState(state: Chat.ChatState) {
  ss.set(LOCAL_NAME, state)
}

export function findMessageFromConv(conv: Chat.ConvWithMessages, messageUuid: string): Chat.ChatMessage | null {
  const questions = conv.data
  for (const question of questions) {
    if (question.uuid === messageUuid) {
      return question
    } else {
      const result = question.children.find(child => child.uuid === messageUuid)
      if (result)
        return result
    }
  }
  return null
}
