declare namespace KnowledgeBase {
  interface Info {
    id: string
    uuid: string
    title: string
    remark: string
    isPublic: boolean
    isStrict: boolean
    starCount: number
    ownerUuid: string
    ownerName: string
    loadingRecords?: boolean
    itemCount: number
    embeddingCount: number
    ragMaxOverlap: number
    ragMaxResults: number
    ragMinScore: number
    llmTemperature: number
  }
  interface InfoListResp {
    total: number,
    records: Info[]
  }
  interface Item {
    id: string
    uuid: string
    kbId: string
    kbUuid: string
    title: string
    brief: string
    remark: string
    isEmbedded: boolean
    sourceFileName: string
    sourceFileUuid: string
  }
  interface KbItemEditReq {
    id?: string
    kbId: string
    title: string
    remark?: string
  }
  interface KbEmbedding {
    embeddingId: string
    embedding: number[]
    text: string
  }
  interface QaRecordListResp {
    total: number,
    records: KnowledgeBase.QaRecordInfo[]
  }
  interface QaRecordInfo {
    id: string
    uuid: string
    kbId: string
    kbUuid: string
    question: string
    answer: string
    createTime: string
    loading?: boolean
    error?: boolean
    aiModelPlatform?: string
  }

  interface QaRecordReference {
    id: string
    text: string
  }

  interface KbState {
    selectedKbType: string
    activeKbUuid: string
    myKbInfos: Info[]
    publicKbInfos: Info[]
    kbUuidToQaRecords: Map<string, QaRecordInfo[]>
    kbUuidToStarInfo: Map<string, KbStarInfo>
    qaRecordToReferences: Map<string, KnowledgeBase.QaRecordReference[]>
    loadingRecords: Map<string, boolean>
    loaddingKbList: boolean
    reloadKbInfosSignal: boolean
  }

  interface KbStarInfo {
    kbUuid: string
    kbTitle: string
    star: boolean
  }

  interface KbStarListResp {
		total: number
		records: KnowledgeBase.KbStarInfo[]
	}
}