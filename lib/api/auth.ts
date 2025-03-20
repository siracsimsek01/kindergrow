import { apiClient } from "../api-client"



export async function getCurrentUser() {
  try {
    const response = await apiClient.get("/api/auth/user")
    return response.data
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

