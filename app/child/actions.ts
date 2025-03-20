'use server'

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function getChildren() {
  try {
    const response = await apiClient.get('/api/children');
    return response.data;
  } catch (error) {
    console.error("Error fetching children:", error);
    throw new Error("Failed to fetch children");
  }
}

export async function getChild(childId: string) {
  try {
    const response = await apiClient.get(`/api/children/${childId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching child:", error);
    throw new Error("Failed to fetch child");
  }
}

export async function addChild(data: any) {
  try {
    const response = await apiClient.post('/api/children', data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/child');
    return response.data;
  } catch (error) {
    console.error("Error adding child:", error);
    throw new Error("Failed to add child");
  }
}

export async function updateChild(childId: string, data: any) {
  try {
    const response = await apiClient.put(`/api/children/${childId}`, data);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/child');
    return response.data;
  } catch (error) {
    console.error("Error updating child:", error);
    throw new Error("Failed to update child");
  }
}

export async function deleteChild(childId: string) {
  try {
    const response = await apiClient.delete(`/api/children/${childId}`);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/child');
    return response.data;
  } catch (error) {
    console.error("Error deleting child:", error);
    throw new Error("Failed to delete child");
  }
}