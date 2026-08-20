"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MantineProvider, createTheme, localStorageColorSchemeManager } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { NextIntlClientProvider } from "next-intl";
import { isLocale, messages, type Locale, type MessageKey } from "@/lib/i18n/messages";
import { defaultThemePreset } from "@/lib/theme/preset";

const UIContext = createContext<{ locale: Locale; setLocale: (value: Locale) => void; t: (key: MessageKey) => string }>(
  { locale: "vi", setLocale: () => undefined, t: (key) => key },
);
const theme = createTheme({
  primaryColor: "cyan",
  defaultRadius: defaultThemePreset.dark.radiusScale,
  fontFamily: defaultThemePreset.dark.fontFamily,
  headings: { fontFamily: defaultThemePreset.dark.fontFamily, fontWeight: "650" },
  colors: {
    cyan: [
      "#e5fbff",
      "#c8f5fb",
      "#94eaf5",
      "#5bdce9",
      "#2bc9d8",
      "#15aebb",
      "#098b97",
      "#08717b",
      "#095b64",
      "#064a53",
    ],
  },
  components: {
    Button: { defaultProps: { size: "sm" } },
    TextInput: { defaultProps: { size: "sm" } },
    Select: { defaultProps: { size: "sm" } },
    Paper: { defaultProps: { radius: "md" } },
  },
});
const colorSchemeManager = localStorageColorSchemeManager({ key: "hnlms-color-scheme" });

function applyPreset() {
  const root = document.documentElement;
  for (const [mode, tokens] of [
    ["light", defaultThemePreset.light],
    ["dark", defaultThemePreset.dark],
  ] as const) {
    for (const [key, value] of Object.entries(tokens)) {
      if (typeof value === "string") root.style.setProperty(`--hn-${mode}-${key}`, value);
    }
  }
  root.dataset.themePreset = `${defaultThemePreset.key}@${defaultThemePreset.version}`;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");
  useEffect(() => {
    applyPreset();
    const saved = localStorage.getItem("hnlms-locale");
    if (isLocale(saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);
  const setLocale = (value: Locale) => {
    setLocaleState(value);
    localStorage.setItem("hnlms-locale", value);
    document.cookie = `hnlms-locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = value;
  };
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => messages[locale][key] }), [locale]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <UIContext.Provider value={value}>
        <MantineProvider theme={theme} defaultColorScheme="dark" colorSchemeManager={colorSchemeManager}>
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </UIContext.Provider>
    </NextIntlClientProvider>
  );
}

export const useUI = () => useContext(UIContext);
