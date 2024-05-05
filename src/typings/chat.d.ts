declare namespace Chat {

	interface ChatMessage {
		uuid: string | '',
		createTime: string
		remark: string
		messageRole?: number
		children: ChatMessage[]
		inversion?: boolean
		error?: boolean
		loading?: boolean
		aiModelPlatform?: string
	}

	interface Conversation {
		title: string
		uuid: string
		aiSystemMessage: string
		understandContextEnable: boolean
		loadedAll: boolean
		loadedFirstPageMsg: boolean
		minMsgUuid?: string | ''
	}

	interface ConvWithMessages{
		uuid: string
		data: ChatMessage[]
	}

	interface ChatState {
		active: string
		usingContext: boolean
		conversations: Conversation[]
		chats: ConvWithMessages[]
	}

	interface ConversationRequest {
		prompt: string,
		conversationUuid?: string
		parentMessageId?: string
	}

	interface ConversationResponse {
		text: string
	}

	interface MetaData {
		question: {
			tokens: number,
			uuid: string
		},
		answer: {
			tokens: number,
			uuid: string
		}
	}

	interface ConvMsgListResp {
		minMsgUuid: string
		msgList: Chat.ChatMessage[]
	}

	interface ConversationsResp {
		total: number
		records: Chat.Conversation[]
	}

	interface Prompt {
		renderKey: string
		renderValue: string
		id: number
		act: string
		prompt: string
	}

	interface DrawState {
		loadingUuid: string
		loading: boolean
		aiImages: AiImageItem[]
	}

	interface AiImageItem {
		id?: number
		uuid: string
		prompt?: string
		originalImageUrl?: string
		maskImageUrl?: string
		interactingMethod: number
		processStatus: number   //1:processing,2:fail,3:success
		imageUrlList: string[]
		createTime: string
	}

	interface AiImageListResp {
		minId: number
		imageItems: AiImageItem[]
	}
}
