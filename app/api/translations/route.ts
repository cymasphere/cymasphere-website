import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Languages we support - duplicated here to avoid importing from client component
const languages = ["en", "es", "fr", "it", "de", "pt", "tr", "zh", "ja"];
const defaultLanguage = "en";

// Deep merge of objects
const deepMerge = (target: any, source: any) => {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item: any) =>
  item && typeof item === "object" && !Array.isArray(item);

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
