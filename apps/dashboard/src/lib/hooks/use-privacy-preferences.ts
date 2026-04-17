"use client";

import { useCallback, useEffect, useState } from "react";

const PRIVACY_PREFERENCES_STORAGE_VERSION = "v1";

export const PRIVACY_PREFERENCES_STORAGE_KEY = `notra_privacy_preferences:${PRIVACY_PREFERENCES_STORAGE_VERSION}`;

const HIDE_PERSONAL_DATA_EVENT = "notra:hide-personal-data-change";

interface StoredPrivacyPreferences {
  hidePersonalData: boolean;
}

const DEFAULTS: StoredPrivacyPreferences = {
  hidePersonalData: false,
};

function readStored(): StoredPrivacyPreferences {
  if (typeof window === "undefined") {
    return DEFAULTS;
  }

  try {
    const raw = window.localStorage.getItem(PRIVACY_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<StoredPrivacyPreferences>;
    return {
      hidePersonalData: Boolean(parsed?.hidePersonalData),
    };
  } catch {
    return DEFAULTS;
  }
}

function writeStored(value: StoredPrivacyPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PRIVACY_PREFERENCES_STORAGE_KEY,
      JSON.stringify(value)
    );
  } catch {
    // Ignore storage failures.
  }
}

export function useHidePersonalData(): {
  hidePersonalData: boolean;
  hasHydrated: boolean;
  setHidePersonalData: (value: boolean) => void;
} {
  const [hidePersonalData, setState] = useState<boolean>(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setState(readStored().hidePersonalData);
    setHasHydrated(true);

    const handleChange = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "boolean") {
        setState(event.detail);
        return;
      }
      setState(readStored().hidePersonalData);
    };

    window.addEventListener(HIDE_PERSONAL_DATA_EVENT, handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener(HIDE_PERSONAL_DATA_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const setHidePersonalData = useCallback((value: boolean) => {
    setState(value);
    writeStored({ hidePersonalData: value });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(HIDE_PERSONAL_DATA_EVENT, { detail: value })
      );
    }
  }, []);

  return { hidePersonalData, hasHydrated, setHidePersonalData };
}
