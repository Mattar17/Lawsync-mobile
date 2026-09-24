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
  email: string;
  isAdmin?: boolean;
  isVerified?: boolean;
};

type UserStore = {
  user: User | null;
  Office: Office | null;
  isVerified: boolean;
  hasPendingVerification: boolean;
  setUser: (user: User | null) => void;
  setCurrentOffice: (office: Office) => void;
  setIsVerified: (isVerified: boolean) => void;
  setHasPendingVerification: (hasPending: boolean) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      Office: null,
      isVerified: false,
      hasPendingVerification: false,
      setUser: (user) =>
        set((state) => ({
          user,
          isVerified: Boolean(user?.isVerified),
          hasPendingVerification: user?.isVerified
            ? false
            : state.hasPendingVerification,
        })),
      setCurrentOffice: (office) => set({ Office: office }),
      setIsVerified: (isVerified) =>
        set((state) => ({
          isVerified,
          hasPendingVerification: isVerified
            ? false
            : state.hasPendingVerification,
          user: state.user ? { ...state.user, isVerified } : null,
        })),
      setHasPendingVerification: (hasPendingVerification) =>
        set({ hasPendingVerification }),
      clearUser: () =>
        set({
          user: null,
          Office: null,
          isVerified: false,
          hasPendingVerification: false,
        }),
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
