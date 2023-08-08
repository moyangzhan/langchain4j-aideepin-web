import { defineStore } from 'pinia'

export const useDrawStore = defineStore('draw-store', {
  state: (): Chat.DrawState => {
    return {
      loadingUuid: '',
      loading: false,
      aiImages: [],
    }
  },

  getters: {
    allImages(state: Chat.DrawState) {
      return state.aiImages
    },
  },

  actions: {

    pushOne(aiImage: Chat.AiImageItem) {
      this.aiImages.push(aiImage)
    },

    unshiftImages(aiImages: Chat.AiImageItem[]) {
      this.aiImages = aiImages.concat(this.aiImages)
    },

    unshift(image: Chat.AiImageItem) {
      this.aiImages.unshift(image)
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setLoadingUuid(uuid: string) {
      this.loadingUuid = uuid
    },

    updateAiImage(uuid: string, edit: Chat.AiImageItem) {
      const index = this.aiImages.findIndex(item => item.uuid === uuid)
      if (index !== -1)
        this.aiImages[index] = { ...this.aiImages[index], ...edit }
    },

    async deleteAiImage(uuid: string) {
      const index = this.aiImages.findIndex(item => item.uuid === uuid)
      this.aiImages.splice(index, 1)
    },

  },
})
