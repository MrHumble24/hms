import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (
      style: "light" | "medium" | "heavy" | "rigid" | "soft",
    ) => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (
    message: string,
    callback: (confirmed: boolean) => void,
  ) => void;
  showPopup: (
    params: {
      title?: string;
      message: string;
      buttons?: { id: string; type?: string; text: string }[];
    },
    callback?: (buttonId: string) => void,
  ) => void;
  sendData: (data: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  // Location Manager (Telegram Bot API 6.9+)
  LocationManager?: {
    isInited: boolean;
    isLocationAvailable: boolean;
    isAccessRequested: boolean;
    isAccessGranted: boolean;
    init: (callback?: () => void) => void;
    getLocation: (
      callback: (
        location: {
          latitude: number;
          longitude: number;
          altitude?: number;
          course?: number;
          speed?: number;
          horizontal_accuracy?: number;
          vertical_accuracy?: number;
          course_accuracy?: number;
          speed_accuracy?: number;
        } | null,
      ) => void,
    ) => void;
    openSettings: () => void;
  };
}

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<
    TelegramWebApp["initDataUnsafe"]["user"] | null
  >(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setUser(tg.initDataUnsafe?.user || null);
      setIsReady(true);

      // Apply Telegram theme
      document.documentElement.style.setProperty(
        "--tg-theme-bg-color",
        tg.themeParams.bg_color || "#ffffff",
      );
      document.documentElement.style.setProperty(
        "--tg-theme-text-color",
        tg.themeParams.text_color || "#000000",
      );
      document.documentElement.style.setProperty(
        "--tg-theme-button-color",
        tg.themeParams.button_color || "#1677ff",
      );
    }
  }, []);

  const haptic = (
    type:
      | "light"
      | "medium"
      | "heavy"
      | "success"
      | "error"
      | "warning"
      | "selection",
  ) => {
    if (!webApp?.HapticFeedback) return;

    if (type === "selection") {
      webApp.HapticFeedback.selectionChanged();
    } else if (["success", "error", "warning"].includes(type)) {
      webApp.HapticFeedback.notificationOccurred(
        type as "success" | "error" | "warning",
      );
    } else {
      webApp.HapticFeedback.impactOccurred(
        type as "light" | "medium" | "heavy",
      );
    }
  };

  const showMainButton = (text: string, onClick: () => void) => {
    if (!webApp?.MainButton) return;
    webApp.MainButton.setText(text);
    webApp.MainButton.onClick(onClick);
    webApp.MainButton.show();
  };

  const hideMainButton = () => {
    webApp?.MainButton?.hide();
  };

  const showBackButton = (onClick: () => void) => {
    if (!webApp?.BackButton) return;
    webApp.BackButton.onClick(onClick);
    webApp.BackButton.show();
  };

  const hideBackButton = () => {
    webApp?.BackButton?.hide();
  };

  const sendDataToBot = (data: object) => {
    webApp?.sendData(JSON.stringify(data));
  };

  const closeApp = () => {
    webApp?.close();
  };

  // Get hotel ID from start_param (passed from bot)
  const getStartParam = () => {
    return webApp?.initDataUnsafe?.start_param || null;
  };

  // Request location using Telegram's LocationManager or fallback to browser
  const requestLocation = (
    onSuccess: (lat: number, lng: number) => void,
    onError: (error: string) => void,
  ) => {
    // Try Telegram's LocationManager first (available in newer versions)
    if (webApp?.LocationManager) {
      const lm = webApp.LocationManager;

      // Initialize if needed
      if (!lm.isInited) {
        lm.init(() => {
          if (lm.isLocationAvailable && lm.isAccessGranted) {
            lm.getLocation((location) => {
              if (location) {
                onSuccess(location.latitude, location.longitude);
              } else {
                onError("Could not get location from Telegram");
              }
            });
          } else if (!lm.isAccessGranted) {
            // Need to request access - show settings
            lm.openSettings();
            onError("Please grant location access in settings");
          } else {
            onError("Location not available");
          }
        });
      } else if (lm.isAccessGranted) {
        lm.getLocation((location) => {
          if (location) {
            onSuccess(location.latitude, location.longitude);
          } else {
            onError("Could not get location");
          }
        });
      } else {
        lm.openSettings();
        onError("Please grant location access");
      }
      return;
    }

    // Fallback to browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSuccess(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          onError(
            "Could not get your location. Please share location via the bot.",
          );
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      onError("Location not supported. Please share location via the bot.");
    }
  };

  return {
    webApp,
    user,
    isReady,
    isTelegram: !!webApp,
    haptic,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    sendDataToBot,
    closeApp,
    getStartParam,
    requestLocation,
    themeParams: webApp?.themeParams || {},
  };
};
