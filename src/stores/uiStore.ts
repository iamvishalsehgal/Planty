import { create } from "zustand";

interface UIStore {
  isOnline: boolean;
  selectedRoom: string | null;
  isAddingPlant: boolean;
  bottomSheetOpen: boolean;

  setOnline: (online: boolean) => void;
  setSelectedRoom: (room: string | null) => void;
  setAddingPlant: (adding: boolean) => void;
  setBottomSheetOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isOnline: true,
  selectedRoom: null,
  isAddingPlant: false,
  bottomSheetOpen: false,

  setOnline: (online) => set({ isOnline: online }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setAddingPlant: (adding) => set({ isAddingPlant: adding }),
  setBottomSheetOpen: (open) => set({ bottomSheetOpen: open }),
}));
