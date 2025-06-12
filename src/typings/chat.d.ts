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
		attachmentUrls: string[]
	}

	interface ConversationPreset {
		id: string
		uuid: string
		title: string
		remark: string
		aiSystemMessage: string

		used: boolean
	}

	interface ConvToPresetRel {
		id: string
		uuid: string
		userConvId: string
		presetConvId: string
	}

	interface Conversation {
		title: string
		uuid: string
		remark: string
		aiSystemMessage: string
		understandContextEnable: boolean
		loadedAll: boolean
		loadedFirstPageMsg: boolean
		minMsgUuid?: string | ''
		mcpIds: string[]
	}

	interface ConvWithMessages {
		uuid: string
		data: ChatMessage[]
	}

	interface ChatState {
		active: string
		usingContext: boolean
		conversations: Conversation[]
		chats: ConvWithMessages[]
		loadingMsgs: Set<string>
		presetConvs: ConversationPreset[]
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
		myDraws: Draw[] //倒序，队尾的为最新数据
	}


	interface Draw {
		id?: number
		uuid: string
		prompt: string
		aiModelName: string
		originalImageUuid?: string
		originalImageUrl: string
		maskImageUuid?: string
		maskImageUrl: string
		interactingMethod: number
		processStatus: number   //1:processing,2:fail,3:success
		processStatusRemark: string

		aiModelPlatform: string
		//绘图成功后生成的图片
		imageUuids: string[]
		imageUrls: string[]
		createTime: string
		isPublic: boolean
		isStar: boolean
		starCount: number
		userUuid: string
		userName: string
		dynamicParams: any
	}

	interface DrawListResp {
		minId: number
		draws: Draw[]
	}

	interface DrawComment {
		uuid: string
		userUuid: string
		userName: string
		drawUuid: string
		remark: string
		createTime: string
	}

	interface DrawCommentsResp {
		records: Chat.DrawComment[]
		total: number
		current: number
	}

	interface GalleryState {
		loadingUuid: string
		loading: boolean
		publicDraws: Draw[]
		myStarDraws: Draw[]
	}
}
