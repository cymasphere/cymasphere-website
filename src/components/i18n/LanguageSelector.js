import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css';
import dynamic from 'next/dynamic';

// Flag icons for each language
const FLAGS = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵"
};

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use effect instead of useLayoutEffect for SSR compatibility
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <div className={styles['language-selector']} ref={dropdownRef}>
      <div 
        className={styles['selected-language']} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles['flag-icon']}>{FLAGS[currentLanguage]}</span>
        <span className={styles['language-name']}>{t(`language.${currentLanguage}`)}</span>
        <span className={styles['dropdown-arrow']}>▼</span>
      </div>
      
      {isOpen && (
        <div className={styles['language-dropdown']}>
          {Object.keys(FLAGS).map((langCode) => (
            <div 
              key={langCode}
              className={`${styles['language-option']} ${langCode === currentLanguage ? styles['active'] : ''}`}
              onClick={() => changeLanguage(langCode)}
            >
              <span className={styles['flag-icon']}>{FLAGS[langCode]}</span>
              <span className={styles['language-name']}>{t(`language.${langCode}`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Export as client-side only component to avoid SSR issues
export default dynamic(() => Promise.resolve(LanguageSelector), {
  ssr: false
}); 