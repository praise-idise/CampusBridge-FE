import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { clearAuthSession, getAccessToken, getAuthUser, setAuthSession, type AuthUser } from '@/auth/session'
import { login as loginRequest, logout as logoutRequest, register as registerRequest, changePassword as changePasswordRequest } from '@/services/auth.service'
import type { RegisterDTO, ChangePasswordDTO } from '@/api/types'

interface AuthContextValue {
    user: AuthUser | null
    token: string | null
    isAuthenticated: boolean
    isAdmin: boolean
    login: (payload: { email: string; password: string }) => Promise<void>
    register: (payload: RegisterDTO) => Promise<void>
    logout: () => Promise<void>
    changePassword: (payload: ChangePasswordDTO) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => getAccessToken())
    const [user, setUser] = useState<AuthUser | null>(() => getAuthUser())

    async function login(payload: { email: string; password: string }) {
        const response = await loginRequest(payload)
        const data = response.data

        if (!data?.token || !data?.userId || !data?.email) {
            throw new Error('Login response is missing required auth fields.')
        }

        const nextUser: AuthUser = {
            userId: data.userId,
            email: data.email,
            roles: data.roles ?? [],
        }

        setAuthSession(data.token, nextUser)
        setToken(data.token)
        setUser(nextUser)
    }

    async function register(payload: RegisterDTO) {
        await registerRequest(payload)
        // On successful registration (201), backend returns no token — user must verify email first
        // No need to set auth session; just return successfully
        // User will be directed to verify-email flow
    }

    async function logout() {
        try {
            await logoutRequest()
        } finally {
            clearAuthSession()
            setToken(null)
            setUser(null)
        }
    }

    async function changePassword(payload: ChangePasswordDTO) {
        await changePasswordRequest(payload)
        // On password change success, optionally log out for security
        // But for now, keep the session and let them continue
    }

    const isAdmin = user?.roles?.includes('ADMIN') ?? false

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: Boolean(token),
            isAdmin,
            login,
            register,
            logout,
            changePassword,
        }),
        [user, token, isAdmin],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider.')
    }
    return context
}
