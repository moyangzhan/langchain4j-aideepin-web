import { defineStore } from 'pinia'
import { getToken, removeToken, setToken } from './helper'
import { store } from '@/store'

export const useAuthStore = defineStore('auth-store', {
  state: (): AuthState => ({
    token: getToken(),
  }),

  getters: {
    isChatGPTAPI(): boolean {
      return true
    },
  },

  actions: {

    setToken(token: string) {
      document.cookie = `Authorization=${token}`
      this.token = token
      setToken(token)
    },

    removeToken() {
      this.token = ''
      removeToken()
    },
  },
})

export function useAuthStoreWithout() {
  return useAuthStore(store)
}
