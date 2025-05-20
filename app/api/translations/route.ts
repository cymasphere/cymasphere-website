import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import 'server-only';

// Languages we support - duplicated here to avoid importing from client component
const languages = ['en', 'es', 'fr', 'de', 'ja'];
const defaultLanguage = 'en';

// Deep merge of objects
const deepMerge = (target: any, source: any) => {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item: any) => (
  item && typeof item === 'object' && !Array.isArray(item)
);

export async function GET(request: NextRequest) {
  try {
    // Get the locale from the query parameter
    const { searchParams } = new URL(request.url);
    let locale = searchParams.get('locale') || defaultLanguage;
    
    console.log(`[translations-api] Request for locale: ${locale}`);
    
    // Validate the locale
    if (!languages.includes(locale)) {
      console.log(`[translations-api] Invalid locale requested: ${locale}, falling back to ${defaultLanguage}`);
      locale = defaultLanguage;
    }
    
    // Always load English translations as the base (fallback)
    const engFilePath = path.join(process.cwd(), 'locales', `${defaultLanguage}.json`);
    const engFileContents = await fs.readFile(engFilePath, 'utf8');
    const engData = JSON.parse(engFileContents);
    
    console.log(`[translations-api] Loaded English base translations with ${Object.keys(engData).length} top-level keys`);
    
    // If locale is English, just return English translations
    if (locale === defaultLanguage) {
      return NextResponse.json(engData);
    }
    
    // Otherwise, load requested locale and merge with English for fallback
    try {
      const filePath = path.join(process.cwd(), 'locales', `${locale}.json`);
      console.log(`[translations-api] Looking for locale file at: ${filePath}`);
      
      const fileContents = await fs.readFile(filePath, 'utf8');
      const localeData = JSON.parse(fileContents);
      
      console.log(`[translations-api] Loaded ${locale} translations with ${Object.keys(localeData).length} top-level keys`);
      
      // Deep merge with English data, so English is used for missing keys
      const mergedData = deepMerge(engData, localeData);
      
      console.log(`[translations-api] Merged translations for ${locale} (using English fallbacks)`);
      
      return NextResponse.json(mergedData);
    } catch (localeError) {
      console.error(`Error loading locale ${locale}, falling back to English:`, localeError);
      return NextResponse.json(engData);
    }
  } catch (error) {
    console.error('Error loading translations:', error);
    return NextResponse.json({ error: 'Failed to load translations' }, { status: 500 });
  }
} 