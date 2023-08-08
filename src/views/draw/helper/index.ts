import api from '@/api'
import { useDrawStore } from '@/store'

const drawStore = useDrawStore()
const initLoadingDate = new Date(1970, 1, 1)
let beginLoading: Date = new Date(1970, 1, 1)

export async function checkProcess(uuid: string) {
  console.log(`checkProcess222:${uuid}`)
  if (beginLoading.getTime() !== initLoadingDate.getTime() && new Date().getTime() - beginLoading.getTime() * 1000 > 25 * 1000) {
    drawStore.setLoading(false)
    drawStore.setLoadingUuid('')
    beginLoading = initLoadingDate
    return
  }
  beginLoading = new Date()
  const imageResp = await api.fetchAiImage<Chat.AiImageItem>(uuid)
  if (imageResp.success) {
    drawStore.updateAiImage(uuid, imageResp.data)
    if (imageResp.data.processStatus === 1) {
      setTimeout(() => {
        checkProcess(uuid)
      }, 5000)
    } else {
      drawStore.setLoading(false)
      drawStore.setLoadingUuid('')
    }
  }
}
