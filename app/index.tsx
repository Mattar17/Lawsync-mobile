import LoadingScreen from "@/app/components/LoadingScreen";
import { router } from "expo-router";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { useEffect, useState } from "react";
import { getLawyerById } from "./api/lawyers";
import { authStorage } from "./utils/authStorage";
import { useUserStore } from "./zustandStore/userStore";

interface MyJwtPayload extends JwtPayload {
  lawyer_id?: string;
  lawyer_email?: string;
  is_admin?:boolean;
}

export default function Index() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const {accessToken} = await authStorage.getTokens();

        if (!accessToken) {
          router.replace("/Login");
          return;
        }

        // Fetch / populate user info if not in store
        const currentUser = useUserStore.getState().user;
        if (!currentUser) {
          try {
            const decoded = jwtDecode<MyJwtPayload>(accessToken);
            if (decoded.lawyer_id) {
              const data = await getLawyerById(decoded.lawyer_id);
              const profile =
                (data as { data?: any; user?: any })?.data ||
                (data as { data?: any; user?: any })?.user ||
                data;
              if (profile && typeof profile === "object") {
                useUserStore.getState().setUser({
                  id: (profile as any).id || decoded.lawyer_id,
                  name: (profile as any).name || "",
                  bio: (profile as any).bio || "",
                  email: (profile as any).email || decoded.lawyer_email || "",
                  pictureUrl:
                    (profile as any).picture_url ||
                    (profile as any).pictureUrl ||
                    "",
                });
              }
            }
          } catch (error) {
            console.log("Failed to load user profile on startup:", error);
          }
        }

        router.replace("/Choice" as never);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setTimeout(() => {
          setInitializing(false);
        }, 1500);
      }
    }

    init();
  }, []);

  return <LoadingScreen />;
}
