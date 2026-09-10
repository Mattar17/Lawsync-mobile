import axios from "axios";
import { router } from "expo-router";
import { useUserStore } from "../zustandStore/userStore";
import { authStorage } from "./authStorage";

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export async function Logout() {
  try {
    const tokens = await authStorage.getTokens();

    if (tokens?.refreshToken) {
      await axios.post(
        `${BASE_URL}/api/auth/logout`,
        { refreshToken: tokens.refreshToken },
        {
          headers: {
            "x-client-type": "mobile",
            "x-api-key": process.env.EXPO_PUBLIC_API_KEY,
          },
          timeout: 4000,
        }
      );
    }
  } catch {
  } finally {
    await authStorage.clearTokens();

    useUserStore.getState().setUser(null);

    router.replace("/Login");
  }
}