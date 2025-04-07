import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./LanguageSelector.module.css";
import dynamic from "next/dynamic";

// Define language code type
type LanguageCode = "en" | "es" | "fr" | "de" | "ja";

// Flag icons for each language
const FLAGS: Record<LanguageCode, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵",
};

// Language names mapping
const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
};

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Use effect instead of useLayoutEffect for SSR compatibility
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const changeLanguage = (langCode: LanguageCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = (i18n.language || "en") as LanguageCode;

  return (
    <div
      className={`${styles["language-selector"]} ${
        isOpen ? styles["open"] : ""
      }`}
      ref={dropdownRef}
      data-type="language-selector"
    >
      <div
        className={styles["selected-language"]}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          setIsOpen(!isOpen);
        }}
      >
        <span className={styles["flag-icon"]}>{FLAGS[currentLanguage]}</span>
        <span className={styles["language-name"]}>
          {LANGUAGE_NAMES[currentLanguage] || t(`language.${currentLanguage}`)}
        </span>
        <span className={styles["dropdown-arrow"]}>▼</span>
      </div>

      {isOpen && (
        <div className={styles["language-dropdown"]}>
          {(Object.keys(FLAGS) as LanguageCode[]).map((langCode) => (
            <div
              key={langCode}
              className={`${styles["language-option"]} ${
                langCode === currentLanguage ? styles["active"] : ""
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                changeLanguage(langCode);
              }}
            >
              <span className={styles["flag-icon"]}>{FLAGS[langCode]}</span>
              <span className={styles["language-name"]}>
                {LANGUAGE_NAMES[langCode] || t(`language.${langCode}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export as client-side only component to avoid SSR issues
export default dynamic(() => Promise.resolve(LanguageSelector), {
  ssr: false,
});
