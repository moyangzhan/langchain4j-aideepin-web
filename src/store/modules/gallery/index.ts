import { defineStore } from 'pinia'

export const useGalleryStore = defineStore('gallery-store', {
  state: (): Chat.GalleryState => {
    return {
      loadingUuid: '',
      loading: false,
      publicDraws: [],
      myStarDraws: [],
    }
  },

  getters: {

  },

  actions: {

    appendPublicDraws(draws: Chat.Draw[]) {
      if (draws.length === 0)
        return

      draws.forEach(item => item.imageUrls = item.imageUuids.map(uuid => `/draw/public/thumbnail/${item.uuid}/${uuid}`))
      this.publicDraws.push(...draws)
    },

    appendStarDraws(draws: Chat.Draw[]) {
      if (draws.length === 0)
        return

      draws.forEach((item) => {
        item.imageUrls = item.imageUuids.map(uuid => `/draw/public/thumbnail/${item.uuid}/${uuid}`)
        item.isStar = true

        const hit = this.publicDraws.find(pd => pd.uuid === item.uuid)
        if (hit)
          hit.isStar = true
      })
      this.myStarDraws.push(...draws)
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setLoadingUuid(uuid: string) {
      this.loadingUuid = uuid
    },

    unStarDraw(uuid: string) {
      const index = this.myStarDraws.findIndex(item => item.uuid === uuid)
      if (index > -1)
        this.myStarDraws.splice(index, 1)
    },

    starDraw(draw: Chat.Draw) {
      draw.imageUrls = draw.imageUuids.map(uuid => `/draw/public/thumbnail/${draw.uuid}/${uuid}`)
      draw.isStar = !draw.isStar
      this.myStarDraws.unshift(draw)

      const hit = this.publicDraws.find(pd => pd.uuid === draw.uuid)
      if (hit)
        hit.isStar = !draw.isStar
    },

  },
})
