import { defineStore } from 'pinia'
import { changeFileUrlToUuid } from '@/utils/functions'

export const useDrawStore = defineStore('draw-store', {
  state: (): Chat.DrawState => {
    return {
      loadingUuid: '',
      loading: false,
      myDraws: [],
    }
  },

  getters: {
    images(state: Chat.DrawState) {
      return state.myDraws
    },
    imagesOrderByIdDesc(state: Chat.DrawState) {
      return state.myDraws.slice().reverse()
    },
  },

  actions: {

    pushOne(draw: Chat.Draw) {
      this.myDraws.push(draw)
    },

    unshiftImages(draws: Chat.Draw[]) {
      draws.forEach((item) => {
        // item.imageUuids.map(uuid => `/my-thumbnail/${uuid}`)
        for (let i = 0; i < item.imageUrls.length; i++) {
          const url = item.imageUrls[i]
          if (!url.includes('http'))
            item.imageUrls[i] = `/api/my-thumbnail/${changeFileUrlToUuid(url)}`
        }
      })
      this.myDraws.unshift(...draws)
    },

    unshift(item: Chat.Draw) {
      for (let i = 0; i < item.imageUrls.length; i++) {
        const url = item.imageUrls[i]
        if (!url.includes('http'))
          item.imageUrls[i] = `/api/my-thumbnail/${changeFileUrlToUuid(url)}`
      }
      this.myDraws.unshift(item)
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setLoadingUuid(uuid: string) {
      this.loadingUuid = uuid
    },

    updateDraw(edit: Chat.Draw) {
      const index = this.myDraws.findIndex(item => item.uuid === edit.uuid)
      if (index !== -1) {
        for (let i = 0; i < edit.imageUrls.length; i++) {
          const url = edit.imageUrls[i]
          if (!url.includes('http'))
            edit.imageUrls[i] = `/api/my-thumbnail/${changeFileUrlToUuid(url)}`
        }
        this.myDraws[index] = { ...this.myDraws[index], ...edit }
      }
    },

    setPublic(uuid: string, isPublic: boolean) {
      const index = this.myDraws.findIndex(item => item.uuid === uuid)
      if (index !== -1)
        this.myDraws[index].isPublic = isPublic
    },

    async deleteDraw(uuid: string) {
      const index = this.myDraws.findIndex(item => item.uuid === uuid)
      if (index > -1)
        this.myDraws.splice(index, 1)
    },

    async deleteOneFile(uuid: string, fileUuid: string) {
      const aiImage = this.myDraws.find(item => item.uuid === uuid)
      if (aiImage) {
        const idx = aiImage.imageUuids?.findIndex(url => url.indexOf(fileUuid) > 0)
        aiImage.imageUuids?.splice(idx, 1)
      }
    },

  },
})
