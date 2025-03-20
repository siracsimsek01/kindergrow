import axios from "axios"

// Create an axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage or cookies
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const response = await axios.post("/api/auth/refresh")
        const { token } = response.data as { token: string }

        if (token) {
          localStorage.setItem("authToken", token)
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in"
        }
      }
    }

    return Promise.reject(error)
  },
)

