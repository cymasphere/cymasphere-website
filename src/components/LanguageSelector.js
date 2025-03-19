import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Available languages
  const languages = [
    { code: 'en', name: t('language.en'), flag: '🇺🇸' },
    { code: 'es', name: t('language.es'), flag: '🇪🇸' },
    { code: 'fr', name: t('language.fr'), flag: '🇫🇷' },
    { code: 'de', name: t('language.de'), flag: '🇩🇪' },
    { code: 'ja', name: t('language.ja'), flag: '🇯🇵' },
  ];
  
  // Current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  // Change language handler
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div 
      ref={dropdownRef}
      className="language-selector"
      style={{
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'background-color 0.2s ease',
          userSelect: 'none'
        }}
      >
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.code.toUpperCase()}</span>
        <span style={{ marginLeft: '4px' }}>▼</span>
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: '#111',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
            width: '180px',
            overflow: 'hidden'
          }}
        >
          {languages.map((lang) => (
            <div
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 15px',
                cursor: 'pointer',
                color: lang.code === i18n.language ? '#00bcd4' : 'white',
                backgroundColor: lang.code === i18n.language ? 'rgba(0, 188, 212, 0.1)' : 'transparent',
                transition: 'background-color 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = lang.code === i18n.language ? 'rgba(0, 188, 212, 0.1)' : 'transparent'; }}
            >
              <span style={{ fontSize: '18px' }}>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector; 