import { ref, computed } from 'vue'

interface User {
 id: number
 username: string
 firstName: string
 lastName: string
 email: string
}

const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
const user = ref<User | null>(null)

let refreshPromise: Promise<string> | null = null

const isAuthenticated = computed(() => !!accessToken.value)

async function login(username:string, password: string) {
    let res: Response
    try{
      res = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password, expiresInMins: 1}),
      })
    }catch {
        //Network issues
        throw new Error('Could not reach the server. Check your connection and try again.')
    }
    if (!res.ok){
        // Server rejecting credentials
        throw new Error('Login failed - check your username and password.')
    }

    const data = await res.json()
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    user.value = {
        id: data.id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
    }

    //persist so reload doesnt log out
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken) 
}

async function fetchCurrentUser() {
    if (!accessToken.value || user.value) return

    try{
        const res = await fetch('https://dummyjson.com/auth/me', {
            headers: { Authorization: `Bearer ${accessToken.value}`},
            })

            if (res.status === 401) {
                // Token rejected or session expired
                logout()
                return
            }
            if(!res.ok) {
                //Unexpected server side errors like 500. Skip rehydration, we leave session alone
                return
            }
            
            const data = await res.json()
            user.value = {
                id: data.id,
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
            }
            } catch {
                //Unexpected errors like couldnt reach the server or DNS or timeout. Token may still be valid
                return
            }
        }

function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    refreshPromise = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
}

//Refresh Access to be used by useFetch when we get 401 and need a new access token
async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) {
        // We prevent duplicate refresh requests
        return refreshPromise
    }

    refreshPromise = (async (): Promise<string> => {
        if (!refreshToken.value) {
        logout()
        throw new Error('No refresh token available. Please login again.')
    }

    try {
        const res = await fetch('https://dummyjson.com/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({refreshToken: refreshToken.value, expiresInMins: 1}),
            })
    if (!res.ok) {
        logout()
        throw new Error('Session expired. Please login again.')
    }
    
    const data = await res.json()
    accessToken.value = data.accessToken
    refreshToken.value = data.refreshToken
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    
    return data.accessToken
    } catch (error) {
        logout()
        throw error
    }})()

    try {
        return await refreshPromise;
    }
    finally {
        // Clears the promise so next call doesn't return the cached value
        refreshPromise = null
    }
}

export function useAuth () {
    return {
        accessToken,
        refreshToken,
        user,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
        fetchCurrentUser,
    }
}