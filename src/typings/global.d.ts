interface Window {
  $loadingBar?: import('naive-ui').LoadingBarProviderInst;
  $dialog?: import('naive-ui').DialogProviderInst;
  $message?: import('naive-ui').MessageProviderInst;
  $notification?: import('naive-ui').NotificationProviderInst;
}
interface PageResponse {
  total: number
  size: number
  current: number
  pages: number
  records: []
}

interface ImageGenerationParams {
  interactingMethod: number
  modelName: string
  prompt: string
  size: string
  number: number
  seed?: number
  quality?: string
  dynamicParams?: any
}

interface CreateImageResult {
  uuid: string
}

interface AuthState {
  token: string
  showLoginModal: boolean
}

interface AiModelInfo {

  //from api
  modelId: string
  modelName: string
  modelTitle: string
  modelPlatform: string
  enable: boolean
  isFree: boolean
  inputTypes: string

  //for NSelector
  value: string
  key: string
  label: string
  disabled: boolean
}

interface SearchEngineInfo {

  //from api
  name: string,
  enable: boolean,

  //for NSelector
  key: string,
  label: string,
  disabled: boolean
}

interface FileUploaded {
  url: string
  uuid: string
}

interface AudioPlayState {
  audioUrl: string
  audioUuid: string // UUID of the audio file
  playDuration: number
  playing: boolean
  audio: any // Audio object
  text: string // Text to be read
  showText: boolean // Whether to show the text
}