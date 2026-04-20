import { create } from "zustand";
import type { TranslationMode } from "@/lib/types";

type RoomUiState = {
  draft: string;
  translationMode: TranslationMode;
  setDraft: (v: string) => void;
  setTranslationMode: (m: TranslationMode) => void;
  reset: () => void;
};

export const useRoomUiStore = create<RoomUiState>((set) => ({
  draft: "",
  translationMode: "softened",
  setDraft: (draft) => set({ draft }),
  setTranslationMode: (translationMode) => set({ translationMode }),
  reset: () => set({ draft: "", translationMode: "softened" }),
}));
