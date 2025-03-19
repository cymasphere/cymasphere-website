import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

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
    <div className="language-selector" ref={dropdownRef}>
      <div 
        className="selected-language" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flag-icon">{FLAGS[currentLanguage]}</span>
        <span className="language-name">{t(`language.${currentLanguage}`)}</span>
        <span className="dropdown-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="language-dropdown">
          {Object.keys(FLAGS).map((langCode) => (
            <div 
              key={langCode}
              className={`language-option ${langCode === currentLanguage ? 'active' : ''}`}
              onClick={() => changeLanguage(langCode)}
            >
              <span className="flag-icon">{FLAGS[langCode]}</span>
              <span className="language-name">{t(`language.${langCode}`)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 