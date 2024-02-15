declare namespace KnowledgeBase {
  interface Info {
    id: string
    uuid: string
    title: string
    remark: string
    isPublic: boolean,
    loadingRecords?: boolean
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
    answer: string,
    createTime: string,
    loading?: boolean,
    error?: boolean
  }

  interface KbState {
    activeKbUuid: string,
    kbInfos: Info[],
    kbUuidToQaRecords: Map<string, QaRecordInfo[]>,
    loadingRecords: Map<string, boolean>,
    loaddingKbList: boolean
  }
}