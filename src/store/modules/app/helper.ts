import { ss } from '@/utils/storage'

const LOCAL_NAME = 'appSetting'

export type Theme = 'light' | 'dark' | 'auto'

export type Language = 'zh-CN' | 'zh-TW' | 'en-US'

export interface AppState {
  siderCollapsed: boolean
  theme: Theme
  language: Language

  selectedSearchEngine: string
  selectedLLM: string
  selectedModelPlatform: string
  searchEngines: SearchEngineInfo[]
  llms: AiModelInfo[]
  imageModels: AiModelInfo[]
}

export function defaultSetting(): AppState {
  return {
    siderCollapsed: false,
    theme: 'light',
    language: 'zh-CN',
    selectedSearchEngine: '',
    selectedLLM: '',
    selectedModelPlatform: '',
    searchEngines: [],
    llms: [],
    imageModels: [],
  }
}

export function getLocalSetting(): AppState {
  const localSetting: AppState | undefined = ss.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalSetting(setting: AppState): void {
  ss.set(LOCAL_NAME, setting)
}
