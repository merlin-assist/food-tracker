import { useEffect, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

interface TelegramUser {
  _id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const verifyTelegramAuth = useAction(api.telegramAuth.verifyTelegramAuth);
  const authenticate = useMutation(api.auth.authenticate);

  useEffect(() => {
    const initTelegram = async () => {
      // Check if running inside Telegram Mini App
      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        // Not in Telegram - for development
        console.log("Not running in Telegram Mini App");
        setIsLoading(false);
        return;
      }

      // Tell Telegram we're ready
      tg.ready();
      tg.expand();

      const initData = tg.initData;
      
      if (!initData) {
        console.log("No initData available");
        setIsLoading(false);
        return;
      }

      try {
        // First verify the Telegram auth (Node.js action)
        const telegramData = await verifyTelegramAuth({ initData });
        
        if (!telegramData) {
          console.error("Telegram auth verification failed");
          setIsLoading(false);
          return;
        }

        // Then create/update user in our database
        const userData = await authenticate(telegramData);
        if (userData) {
          setUser(userData as TelegramUser);
        }
      } catch (error) {
        console.error("Auth failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initTelegram();
  }, [verifyTelegramAuth, authenticate]);

  return { user, isLoading };
}
