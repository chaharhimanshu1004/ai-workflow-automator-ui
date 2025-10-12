import { useAuthStore } from '../store/auth'

export const useAuth = () => {
    const {
        token,
        user,
        isLoading,
        isAuthenticated,
        setToken,
        clearAuth,
        fetchUserInfo,
        login,
        logout
    } = useAuthStore()

    return {
        token,
        user,
        isLoading,
        isAuthenticated,
        setToken,
        clearAuth,
        fetchUserInfo,
        login,
        logout
    }
}

export const useAuthHeaders = () => {
    const token = useAuthStore((state) => state.token)
    return token ? { Authorization: `Bearer ${token}` } : {}
}