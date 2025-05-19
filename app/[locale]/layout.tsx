import { Geist, Geist_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import StyledComponentsRegistry from "../registry";
import ClientLayout from "@/components/layout/ClientLayout";
import I18nProvider from "@/app/i18n/I18nProvider";
import "../globals.css";

// Define the interface for the LocaleLayout props
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function LocaleLayout({
  children,
  params: { locale },
}: LocaleLayoutProps) {
  return (
    <StyledComponentsRegistry>
      <I18nProvider>
        <ClientLayout>{children}</ClientLayout>
      </I18nProvider>
    </StyledComponentsRegistry>
  );
} 