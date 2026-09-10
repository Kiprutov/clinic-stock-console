import { useAuth } from "./useAuth"

const controllers = new Map<string, AbortController>();

interface FetchOptions extends RequestInit {
    key?: string
    retry?: boolean
}

export async function useFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
   const { accessToken, refreshAccessToken } = useAuth()
   const { key, retry = true, ...init } = options

   let controller: AbortController | undefined
   if (key) {
    controllers.get(key)?.abort()
    controller = new AbortController()
    controllers.set(key, controller)
   }

   let res: Response
   try {
    res = await fetch(url, {
        ...init,
        signal: controller?.signal,
        headers: {
            ...(init.headers ?? {}),
            ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
        },

    })
   } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
    }

    throw new Error('Network request failed. Check your connection and try again.')
   } finally {
    if (key && controllers.get(key) === controller) {
        controllers.delete(key)
    }
   }

   if (res.status === 401 && retry) {
    await refreshAccessToken()

    return useFetch<T>(url, { ...options, retry: false})
   }

   if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
   }

   return res.json() as Promise<T>
}