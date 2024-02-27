import { defineStore } from 'pinia'

export const useKbStore = defineStore('kb-store', {
  state: (): KnowledgeBase.KbState => {
    return {
      activeKbUuid: 'default',
      kbInfos: [],
      kbUuidToQaRecords: new Map<string, KnowledgeBase.QaRecordInfo[]>(),
      loadingRecords: new Map<string, boolean>(),
      loaddingKbList: false,
    }
  },

  getters: {
    getRecords(state: KnowledgeBase.KbState) {
      return (kbUuid: string) => {
        const records = state.kbUuidToQaRecords.get(kbUuid)
        if (records)
          return records

        return []
      }
    },
  },

  actions: {
    setActive(kbUuid: string) {
      this.activeKbUuid = kbUuid
    },
    setLoadingKbList(status: boolean) {
      this.loaddingKbList = status
    },
    setLoadingRecords(currKbUuid: string, status: boolean) {
      this.loadingRecords.set(currKbUuid, status)
    },
    setKbInfos(infos: KnowledgeBase.Info[]) {
      this.kbInfos = infos
    },
    appendRecord(kbUuid: string, record: KnowledgeBase.QaRecordInfo) {
      let existRecords = this.kbUuidToQaRecords.get(kbUuid)
      if (!existRecords)
        existRecords = []
      existRecords.forEach(item => item.loading = false)
      existRecords.push(record)
    },
    appendRecords(kbUuid: string, records: KnowledgeBase.QaRecordInfo[]) {
      let existRecords = this.kbUuidToQaRecords.get(kbUuid)
      console.log('append records', records)
      if (!existRecords) {
        existRecords = []
        this.kbUuidToQaRecords.set(kbUuid, existRecords)
      }
      existRecords.push(...records.reverse())
    },
    updateRecord(kbUuid: string, tmpRecordUuid: string, source: KnowledgeBase.QaRecordInfo) {
      const existRecords = this.kbUuidToQaRecords.get(kbUuid)
      if (!existRecords)
        return
      const hitRecord = existRecords.find(item => item.uuid === tmpRecordUuid)
      if (hitRecord)
        Object.assign(hitRecord, source)
    },

    updateFirst(kbUuid: string, source: KnowledgeBase.QaRecordInfo) {
      const existRecords = this.kbUuidToQaRecords.get(kbUuid)
      if (!existRecords || existRecords.length < 1)
        return
      Object.assign(existRecords[0], source)
    },

    unshiftRecord(kbUuid: string, record: KnowledgeBase.QaRecordInfo) {
      let existRecords = this.kbUuidToQaRecords.get(kbUuid)
      if (!existRecords) {
        existRecords = []
        this.kbUuidToQaRecords.set(kbUuid, existRecords)
      }
      existRecords.unshift(record)
    },

    deleteRecord(kbUuid: string, recordUuid: string) {
      const existRecords = this.kbUuidToQaRecords.get(kbUuid)
      if (!existRecords)
        return

      const index = existRecords.findIndex(item => item.uuid === recordUuid)
      existRecords.splice(index, 1)
    },
  },
})
