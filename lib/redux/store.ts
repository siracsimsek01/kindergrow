import { configureStore } from "@reduxjs/toolkit"
import childrenReducer from "./slices/childrenSlice"
import eventsReducer from "./slices/eventsSlice"
import uiReducer from "./slices/uiSlice"

export const store = configureStore({
  reducer: {
    children: childrenReducer,
    events: eventsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

