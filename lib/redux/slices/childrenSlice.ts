import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { Child } from "../../types"

interface ChildrenState {
  items: Child[]
  selectedChild: Child | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: ChildrenState = {
  items: [],
  selectedChild: null,
  status: "idle",
  error: null,
}

export const fetchChildrenAsync = createAsyncThunk("children/fetchChildren", async () => {
  const response = await fetch("/api/children")
  if (!response.ok) {
    throw new Error("Failed to fetch children")
  }
  const data = await response.json()
  return data
})

export const addChildAsync = createAsyncThunk(
  "children/addChild",
  async (childData: { name: string; dateOfBirth: string; sex: string; imageUrl?: string }) => {
    const response = await fetch("/api/children", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(childData),
    })

    if (!response.ok) {
      throw new Error("Failed to add child")
    }

    const data = await response.json()
    return data
  },
)

export const updateChildAsync = createAsyncThunk(
  "children/updateChild",
  async ({ id, data }: { id: string; data: Partial<Child> }) => {
    const response = await fetch(`/api/children/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to update child")
    }

    const responseData = await response.json()
    return { id, updatedChild: responseData }
  },
)

export const deleteChildAsync = createAsyncThunk("children/deleteChild", async (id: string) => {
  const response = await fetch(`/api/children/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete child")
  }

  return id
})

const childrenSlice = createSlice({
  name: "children",
  initialState,
  reducers: {
    setSelectedChild: (state, action: PayloadAction<Child>) => {
      state.selectedChild = action.payload
    },
    clearSelectedChild: (state) => {
      state.selectedChild = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChildrenAsync.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchChildrenAsync.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload
        // Set the first child as selected if there's no selected child
        if (state.items.length > 0 && !state.selectedChild) {
          state.selectedChild = state.items[0]
        }
      })
      .addCase(fetchChildrenAsync.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message || "Failed to fetch children"
      })
      .addCase(addChildAsync.fulfilled, (state, action) => {
        const newChild = action.payload
        state.items.push(newChild)
        // If this is the first child, set it as selected
        if (state.items.length === 1) {
          state.selectedChild = newChild
        }
      })
      .addCase(updateChildAsync.fulfilled, (state, action) => {
        const { id, updatedChild } = action.payload
        const index = state.items.findIndex((child) => child.id === id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedChild }
          // Update selected child if it's the one being updated
          if (state.selectedChild && state.selectedChild.id === id) {
            state.selectedChild = { ...state.selectedChild, ...updatedChild }
          }
        }
      })
      .addCase(deleteChildAsync.fulfilled, (state, action) => {
        const id = action.payload
        state.items = state.items.filter((child) => child.id !== id)
        // If the deleted child was selected, select another one if available
        if (state.selectedChild && state.selectedChild.id === id) {
          state.selectedChild = state.items.length > 0 ? state.items[0] : null
        }
      })
  },
})

export const { setSelectedChild, clearSelectedChild } = childrenSlice.actions
export default childrenSlice.reducer

