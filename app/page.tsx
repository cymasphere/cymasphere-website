import { redirect } from 'next/navigation';
import { defaultLanguage } from './i18n/i18n-config';

export default function RootPage() {
  // Redirect to the default language version
  redirect(`/${defaultLanguage}`);
} 