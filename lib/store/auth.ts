import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
    id: string
    email: string
    name?: string
    avatar?: string
}

interface AuthState {
    token: string | null
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    setToken: (token: string) => void
    clearAuth: () => void
    fetchUserInfo: () => Promise<void>
    login: (token: string) => Promise<void>
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isLoading: false,
            isAuthenticated: false,

            setToken: (token: string) => {
                set({ token, isAuthenticated: !!token })
                localStorage.setItem('accessToken', token)
                document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Strict`
            },

            clearAuth: () => {
                set({ token: null, user: null, isAuthenticated: false })
                localStorage.removeItem('accessToken')
                document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
            },

            fetchUserInfo: async () => {
                const { token } = get()
                if (!token) return

                set({ isLoading: true })
                try {
                    const response = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/user/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    set({ user: response.data, isLoading: false })
                } catch (error) {
                    console.error('Failed to fetch user info:', error)
                    set({ isLoading: false })
                    get().clearAuth()
                }
            },

            login: async (token: string) => {
                set({ isLoading: true })
                get().setToken(token)
                await get().fetchUserInfo()
                set({ isLoading: false })
            },

            logout: () => {
                get().clearAuth()
                window.location.href = '/'
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
)