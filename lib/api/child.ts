import { apiClient } from "../api-client"

export async function getChildren() {
  try {
    const response = await apiClient.get("/api/children")
    return response.data
  } catch (error) {
    console.error("Error fetching children:", error)
    return []
  }
}

export async function getChild(childId: string) {
  try {
    const response = await apiClient.get(`/api/children/${childId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching child ${childId}:`, error)
    return null
  }
}

export async function addChild(data: any) {
  try {
    const response = await apiClient.post("/api/children", data)
    return response.data
  } catch (error) {
    console.error("Error adding child:", error)
    throw error
  }
}

export async function updateChild(childId: string, data: any) {
  try {
    const response = await apiClient.put(`/api/children/${childId}`, data)
    return response.data
  } catch (error) {
    console.error(`Error updating child ${childId}:`, error)
    throw error
  }
}

export async function deleteChild(childId: string) {
  try {
    const response = await apiClient.delete(`/api/children/${childId}`)
    return response.data
  } catch (error) {
    console.error(`Error deleting child ${childId}:`, error)
    throw error
  }
}

