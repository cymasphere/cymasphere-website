import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Remove unused variables and functions
// const languages = ["en", "es", "fr", "it", "de", "pt", "tr", "zh", "ja"];
// const defaultLanguage = "en";
// const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => { ... };
// const isObject = (item: unknown): item is Record<string, unknown> => { ... };

const loadTranslations = (locale: string): Record<string, unknown> => {
  try {
    const filePath = path.join(
      process.cwd(),
      "public/locales",
      locale,
      "common.json"
    );
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as Record<string, unknown>;
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    return {};
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";

  const translations: Record<string, unknown> = loadTranslations(locale);

  return NextResponse.json(translations);
}
