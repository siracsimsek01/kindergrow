'use server'

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export async function getGrowthEntries(childId: string, startDate?: string, endDate?: string) {
  try {
    let url = `/api/growth?childId=${childId}`;
    
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    
    if (endDate) {
      url += `&endDate=${endDate}`;
    }
    
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching growth entries:", error);
    throw new Error("Failed to fetch growth entries");
  }
}

export async function addGrowthEntry(data: any) {
  try {
    const response = await apiClient.post('/api/growth', data);
    revalidatePath('/dashboard/growth');
    revalidatePath('/dashboard');
    return response.data;
  } catch (error) {
    console.error("Error adding growth entry:", error);
    throw new Error("Failed to add growth entry");
  }
}

export async function updateGrowthEntry(growthId: string, data: any) {
  try {
    const response = await apiClient.put(`/api/growth/${growthId}`, data);
    revalidatePath('/dashboard/growth');
    revalidatePath('/dashboard');
    return response.data;
  } catch (error) {
    console.error("Error updating growth entry:", error);
    throw new Error("Failed to update growth entry");
  }
}

export async function deleteGrowthEntry(growthId: string) {
  try {
    const response = await apiClient.delete(`/api/growth/${growthId}`);
    revalidatePath('/dashboard/growth');
    revalidatePath('/dashboard');
    return response.data;
  } catch (error) {
    console.error("Error deleting growth entry:", error);
    throw new Error("Failed to delete growth entry");
  }
}

export async function getGrowthPercentiles(childId: string, weight: number, height: number, ageInMonths: number, sex: string) {
  try {
    const response = await apiClient.get(`/api/growth/percentiles?childId=${childId}&weight=${weight}&height=${height}&ageInMonths=${ageInMonths}&sex=${sex}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching growth percentiles:", error);
    throw new Error("Failed to fetch growth percentiles");
  }
}