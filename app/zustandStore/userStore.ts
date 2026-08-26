// userStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Office = {
  id: string;
  name: string;
  owner_id: string;
  address?: string;
  phone?: string;
  description?: string;
};

export type User = {
  id: string;
  name: string;
  bio: string;
  pictureUrl: string;
};

type UserStore = {
  user: User | null;
  currentOffice: Office | null;
  setUser: (user: User) => void;
  setCurrentOffice: (office: Office) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      currentOffice: null,
      setUser: (user) => set({ user }),
      setCurrentOffice: (office) => set({ currentOffice: office }),
      clearUser: () => set({ user: null, currentOffice: null }),
    }),
    {
      name: "lawsync-user-store",
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    },
  ),
);
