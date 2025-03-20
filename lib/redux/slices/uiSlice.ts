import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UiState {
  initialLoading: boolean
  isAddChildModalOpen: boolean
  isAddEventModalOpen: boolean
}

const initialState: UiState = {
  initialLoading: true,
  isAddChildModalOpen: false,
  isAddEventModalOpen: false,
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setInitialLoading: (state, action: PayloadAction<boolean>) => {
      state.initialLoading = action.payload
    },
    setAddChildModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddChildModalOpen = action.payload
    },
    setAddEventModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddEventModalOpen = action.payload
    },
  },
})

export const { setInitialLoading, setAddChildModalOpen, setAddEventModalOpen } = uiSlice.actions

export default uiSlice.reducer

