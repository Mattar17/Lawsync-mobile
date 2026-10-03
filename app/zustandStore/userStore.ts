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
  isSubscribed?: boolean;
  subscriptionEndDate?: string | null;
};

type UserStore = {
  user: User | null;
  Office: Office | null;
  isVerified: boolean;
  hasPendingVerification: boolean;
  isSubscribed: boolean;
  subscriptionEndDate: string | null;
  hasPendingSubscription: boolean;
  setUser: (user: User | null) => void;
  setCurrentOffice: (office: Office) => void;
  setIsVerified: (isVerified: boolean) => void;
  setHasPendingVerification: (hasPending: boolean) => void;
  setIsSubscribed: (
    isSubscribed: boolean,
    subscriptionEndDate?: string | null,
  ) => void;
  setSubscriptionEndDate: (date: string | null) => void;
  setHasPendingSubscription: (hasPending: boolean) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      Office: null,
      isVerified: false,
      hasPendingVerification: false,
      isSubscribed: false,
      subscriptionEndDate: null,
      hasPendingSubscription: false,
      setUser: (user) =>
        set((state) => ({
          user,
          isVerified: Boolean(user?.isVerified),
          hasPendingVerification: user?.isVerified
            ? false
            : state.hasPendingVerification,
          isSubscribed: Boolean(user?.isSubscribed),
          subscriptionEndDate:
            user?.subscriptionEndDate !== undefined
              ? user.subscriptionEndDate
              : state.subscriptionEndDate,
          hasPendingSubscription: user?.isSubscribed
            ? false
            : state.hasPendingSubscription,
        })),
      setCurrentOffice: (office) => set({ Office: office }),
      setIsVerified: (isVerified) =>
        set((state) => {
          if (
            state.isVerified === isVerified &&
            state.user?.isVerified === isVerified
          ) {
            return state;
          }
          return {
            isVerified,
            hasPendingVerification: isVerified
              ? false
              : state.hasPendingVerification,
            user: state.user ? { ...state.user, isVerified } : null,
          };
        }),
      setHasPendingVerification: (hasPendingVerification) =>
        set((state) =>
          state.hasPendingVerification === hasPendingVerification
            ? state
            : { hasPendingVerification },
        ),
      setIsSubscribed: (isSubscribed, subscriptionEndDate) =>
        set((state) => {
          const resolvedEndDate =
            subscriptionEndDate !== undefined
              ? subscriptionEndDate
              : state.subscriptionEndDate;

          const pendingAfter = isSubscribed
            ? false
            : state.hasPendingSubscription;

          if (
            state.isSubscribed === isSubscribed &&
            state.subscriptionEndDate === resolvedEndDate &&
            state.hasPendingSubscription === pendingAfter &&
            state.user?.isSubscribed === isSubscribed &&
            state.user?.subscriptionEndDate === resolvedEndDate
          ) {
            return state;
          }

          return {
            isSubscribed,
            subscriptionEndDate: resolvedEndDate,
            hasPendingSubscription: pendingAfter,
            user: state.user
              ? {
                  ...state.user,
                  isSubscribed,
                  subscriptionEndDate: resolvedEndDate,
                }
              : null,
          };
        }),
      setSubscriptionEndDate: (subscriptionEndDate) =>
        set((state) => {
          if (
            state.subscriptionEndDate === subscriptionEndDate &&
            state.user?.subscriptionEndDate === subscriptionEndDate
          ) {
            return state;
          }
          return {
            subscriptionEndDate,
            user: state.user ? { ...state.user, subscriptionEndDate } : null,
          };
        }),
      setHasPendingSubscription: (hasPendingSubscription) =>
        set((state) =>
          state.hasPendingSubscription === hasPendingSubscription
            ? state
            : { hasPendingSubscription },
        ),
      clearUser: () =>
        set({
          user: null,
          Office: null,
          isVerified: false,
          hasPendingVerification: false,
          isSubscribed: false,
          subscriptionEndDate: null,
          hasPendingSubscription: false,
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
