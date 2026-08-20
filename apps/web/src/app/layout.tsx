import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { AppProviders } from "@/lib/providers";

export const metadata = { title: "HN LMS UI Preview", description: "Prototype giao diện LMS đa chi nhánh" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" {...mantineHtmlProps}><head><ColorSchemeScript defaultColorScheme="dark" /></head><body><AppProviders>{children}</AppProviders></body></html>;
}

