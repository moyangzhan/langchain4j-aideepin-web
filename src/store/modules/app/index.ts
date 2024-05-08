import { defineStore } from 'pinia'
import type { AppState, Language, Theme } from './helper'
import { getLocalSetting, setLocalSetting } from './helper'
import { store } from '@/store'

export const useAppStore = defineStore('app-store', {
  state: (): AppState => getLocalSetting(),
  actions: {
    setSiderCollapsed(collapsed: boolean) {
      this.siderCollapsed = collapsed
      this.recordState()
    },

    setTheme(theme: Theme) {
      this.theme = theme
      this.recordState()
    },

    setLanguage(language: Language) {
      if (this.language !== language) {
        this.language = language
        this.recordState()
      }
    },
    recordState() {
      setLocalSetting(this.$state)
    },
    setSelectedSearchEngine(selected: string) {
      this.selectedSearchEngine = selected
    },
    setSelectedLLM(selected: string) {
      this.selectedLLM = selected
      const selectedModel = this.llms.find(item => item.modelId === selected)
      if (selectedModel)
        this.selectedModelPlatform = selectedModel.modelPlatform

      this.recordState()
    },
    setSearchEngines(engines: SearchEngineInfo[]) {
      engines.forEach((item) => {
        item.disabled = !item.enable
        item.label = item.name
        item.value = item.name
      })
      this.searchEngines = engines
      if (!this.selectedSearchEngine) {
        const name = this.searchEngines.find(item => item.enable)?.name
        if (name)
          this.selectedSearchEngine = name
      }
    },
    setLLMs(llms: AiModelInfo[]) {
      llms.forEach((item) => {
        item.disabled = !item.enable
        item.label = item.modelName
        item.value = item.modelId
      })
      this.llms = llms
      if (!this.selectedLLM) {
        const selectedModel = this.llms.find(item => item.enable)
        if (selectedModel) {
          this.selectedLLM = selectedModel.modelId
          this.selectedModelPlatform = selectedModel.modelPlatform
        }
      }
    },
    setImageModels(imageModels: AiModelInfo[]) {
      imageModels.forEach((item) => {
        item.disabled = !item.enable
        item.label = item.modelName
        item.value = item.modelName
      })
      this.imageModels = imageModels
    },
  },
})

export function useAppStoreWithOut() {
  return useAppStore(store)
}
