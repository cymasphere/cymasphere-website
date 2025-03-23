import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGlobe, FaTrash, FaExclamationTriangle, FaSignOutAlt, FaMobileAlt, FaDesktop, FaTabletAlt, FaTimes, FaCheck, FaInfoCircle, FaCog, FaBell, FaPalette, FaChartLine, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 120px 20px 40px;
  
  @media (max-width: 768px) {
    padding: 100px 20px 40px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text);
`;

const TabContainer = styled.div`
  margin-bottom: 2rem;
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 768px) {
    flex-wrap: nowrap;
    padding-bottom: 0.5rem;
  }
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  color: ${props => props.active ? 'var(--primary)' : 'var(--text-secondary)'};
  font-weight: ${props => props.active ? '600' : '400'};
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: color 0.3s ease;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--primary);
    opacity: ${props => props.active ? '1' : '0'};
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    color: var(--primary);
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const TabContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text);
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--input-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.3s ease;
  outline: none;
  
  &:focus {
    border-color: var(--primary);
  }
  
  option {
    background-color: var(--card-bg);
  }
`;

const Toggle = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 1rem;
`;

const ToggleLabel = styled.span`
  color: var(--text);
  margin-left: 1rem;
`;

const ToggleSwitch = styled.div`
  width: 50px;
  height: 26px;
  background-color: ${props => props.checked ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 13px;
  position: relative;
  transition: background-color 0.3s ease;
  
  &:after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.checked ? '27px' : '3px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: left 0.3s ease;
  }
`;

const SettingCard = styled.div`
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.03);
  margin-bottom: 1rem;
`;

const SettingTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  h4 {
    margin: 0;
    color: var(--text);
  }
`;

const SettingDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const SliderContainer = styled.div`
  margin-top: 1rem;
`;

const Slider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    border: none;
  }
`;

const SliderValue = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.variant === 'primary' ? 'linear-gradient(90deg, var(--primary), var(--accent))' : 'transparent'};
  border: ${props => props.variant === 'primary' ? 'none' : '1px solid var(--primary)'};
  color: ${props => props.variant === 'primary' ? 'white' : 'var(--primary)'};
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-left: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.variant === 'primary' ? '0 4px 12px rgba(108, 99, 255, 0.3)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ColorSwatch = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  background-color: ${props => props.color};
  cursor: pointer;
  border: 2px solid ${props => props.selected ? 'white' : 'transparent'};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const SuccessMessage = styled.div`
  background-color: rgba(0, 201, 167, 0.1);
  color: var(--success);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid rgba(0, 201, 167, 0.3);
`;

function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [animations, setAnimations] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [accentColor, setAccentColor] = useState('#6C63FF');
  const [audioQuality, setAudioQuality] = useState(80);
  
  const colorOptions = [
    '#6C63FF', // Default purple
    '#FF5E5B', // Coral
    '#00C9A7', // Teal
    '#FFC145', // Yellow
    '#845EC2', // Indigo
    '#FF9671', // Orange
    '#F9F871', // Light yellow
    '#59B0FF', // Light blue
    '#4E8D7C', // Green
    '#C34A36'  // Red
  ];
  
  const saveSettings = () => {
    console.log('Saving settings:', { theme, language, animations, emailNotifications, soundEffects, accentColor, audioQuality });
    setSuccessMessage('Settings saved successfully!');
    
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  return (
    <SettingsContainer>
      <SectionTitle>Settings</SectionTitle>
      
      {successMessage && (
        <SuccessMessage>{successMessage}</SuccessMessage>
      )}
      
      <TabContainer>
        <TabList>
          <Tab 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')}
          >
            <FaCog /> General
          </Tab>
          <Tab 
            active={activeTab === 'appearance'} 
            onClick={() => setActiveTab('appearance')}
          >
            <FaPalette /> Appearance
          </Tab>
          <Tab 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Notifications
          </Tab>
          <Tab 
            active={activeTab === 'language'} 
            onClick={() => setActiveTab('language')}
          >
            <FaGlobe /> Language & Region
          </Tab>
          <Tab 
            active={activeTab === 'privacy'} 
            onClick={() => setActiveTab('privacy')}
          >
            <FaChartLine /> Privacy & Data
          </Tab>
        </TabList>
        
        {activeTab === 'general' && (
          <TabContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SettingCard>
              <SettingTitle>
                <h4>Theme</h4>
                <Select 
                  value={theme} 
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </Select>
              </SettingTitle>
              <SettingDescription>
                Choose how CymaSphere appears to you. Select light mode, dark mode, or use your system preference.
              </SettingDescription>
            </SettingCard>
            
            <SettingCard>
              <SettingTitle>
                <h4>Interface Animations</h4>
                <Toggle onClick={() => setAnimations(!animations)}>
                  <ToggleSwitch checked={animations}>
                    {animations ? <FaToggleOn style={{ display: 'none' }} /> : <FaToggleOff style={{ display: 'none' }} />}
                  </ToggleSwitch>
                </Toggle>
              </SettingTitle>
              <SettingDescription>
                Enable or disable motion effects and animations throughout the interface.
              </SettingDescription>
            </SettingCard>
            
            <SettingCard>
              <SettingTitle>
                <h4>Sound Effects</h4>
                <Toggle onClick={() => setSoundEffects(!soundEffects)}>
                  <ToggleSwitch checked={soundEffects}>
                    {soundEffects ? <FaToggleOn style={{ display: 'none' }} /> : <FaToggleOff style={{ display: 'none' }} />}
                  </ToggleSwitch>
                </Toggle>
              </SettingTitle>
              <SettingDescription>
                Enable or disable UI sound effects when interacting with controls.
              </SettingDescription>
            </SettingCard>
            
            <SettingCard>
              <SettingTitle>
                <h4>Audio Quality</h4>
              </SettingTitle>
              <SettingDescription>
                Adjust the quality of audio playback. Higher quality uses more system resources.
              </SettingDescription>
              <SliderContainer>
                <Slider 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={audioQuality} 
                  onChange={(e) => setAudioQuality(parseInt(e.target.value))}
                />
                <SliderValue>
                  <span>Low (More Efficient)</span>
                  <span>High (Better Quality)</span>
                </SliderValue>
              </SliderContainer>
            </SettingCard>
            
            <ButtonGroup>
              <Button variant="outline" onClick={() => {
                setTheme('dark');
                setAnimations(true);
                setSoundEffects(true);
                setAudioQuality(80);
              }}>
                Reset to Default
              </Button>
              <Button variant="primary" onClick={saveSettings}>
                Save Changes
              </Button>
            </ButtonGroup>
          </TabContent>
        )}
        
        {activeTab === 'appearance' && (
          <TabContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SettingCard>
              <SettingTitle>
                <h4>Accent Color</h4>
              </SettingTitle>
              <SettingDescription>
                Choose the primary accent color used throughout CymaSphere.
              </SettingDescription>
              <ColorGrid>
                {colorOptions.map(color => (
                  <ColorSwatch 
                    key={color} 
                    color={color} 
                    selected={accentColor === color}
                    onClick={() => setAccentColor(color)}
                  />
                ))}
              </ColorGrid>
            </SettingCard>
            
            <ButtonGroup>
              <Button variant="outline" onClick={() => setAccentColor('#6C63FF')}>
                Reset to Default
              </Button>
              <Button variant="primary" onClick={saveSettings}>
                Save Changes
              </Button>
            </ButtonGroup>
          </TabContent>
        )}
        
        {activeTab === 'notifications' && (
          <TabContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SettingCard>
              <SettingTitle>
                <h4>Email Notifications</h4>
                <Toggle onClick={() => setEmailNotifications(!emailNotifications)}>
                  <ToggleSwitch checked={emailNotifications}>
                    {emailNotifications ? <FaToggleOn style={{ display: 'none' }} /> : <FaToggleOff style={{ display: 'none' }} />}
                  </ToggleSwitch>
                </Toggle>
              </SettingTitle>
              <SettingDescription>
                Receive important updates, security alerts, and personalized content via email.
              </SettingDescription>
            </SettingCard>
            
            <ButtonGroup>
              <Button variant="outline" onClick={() => setEmailNotifications(true)}>
                Reset to Default
              </Button>
              <Button variant="primary" onClick={saveSettings}>
                Save Changes
              </Button>
            </ButtonGroup>
          </TabContent>
        )}
        
        {activeTab === 'language' && (
          <TabContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SettingCard>
              <SettingTitle>
                <h4>Display Language</h4>
                <Select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </Select>
              </SettingTitle>
              <SettingDescription>
                Select the language you want CymaSphere to use in its interface.
              </SettingDescription>
            </SettingCard>
            
            <ButtonGroup>
              <Button variant="outline" onClick={() => setLanguage('en')}>
                Reset to Default
              </Button>
              <Button variant="primary" onClick={saveSettings}>
                Save Changes
              </Button>
            </ButtonGroup>
          </TabContent>
        )}
        
        {activeTab === 'privacy' && (
          <TabContent
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SettingCard>
              <SettingTitle>
                <h4>Data Collection & Analytics</h4>
                <Toggle onClick={() => setDataCollection(!dataCollection)}>
                  <ToggleSwitch checked={dataCollection}>
                    {dataCollection ? <FaToggleOn style={{ display: 'none' }} /> : <FaToggleOff style={{ display: 'none' }} />}
                  </ToggleSwitch>
                </Toggle>
              </SettingTitle>
              <SettingDescription>
                Allow CymaSphere to collect anonymous usage data to help improve the platform.
                This data is used only for product improvement and is never sold to third parties.
              </SettingDescription>
            </SettingCard>
            
            <ButtonGroup>
              <Button variant="outline" onClick={() => setDataCollection(true)}>
                Reset to Default
              </Button>
              <Button variant="primary" onClick={saveSettings}>
                Save Changes
              </Button>
            </ButtonGroup>
          </TabContent>
        )}
      </TabContainer>
    </SettingsContainer>
  );
}

export default Settings; 