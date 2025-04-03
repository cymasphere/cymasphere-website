import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from './dashboard/DashboardLayout';
import { FaGlobe, FaTrash, FaExclamationTriangle, FaSignOutAlt, FaMobileAlt, FaDesktop, FaTabletAlt, FaTimes, FaCheck, FaInfoCircle } from 'react-icons/fa';

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  
  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text);
`;

const SettingsCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.75rem;
    color: var(--primary);
  }
`;

const CardContent = styled.div`
  color: var(--text-secondary);
`;

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingTitle = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const SettingDescription = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const SelectWrapper = styled.div`
  position: relative;
  
  &::after {
    content: '▼';
    font-size: 0.8rem;
    color: var(--text-secondary);
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
`;

const Select = styled.select`
  background-color: rgba(30, 30, 46, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  padding: 0.5rem 2rem 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  appearance: none;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
  
  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
  }
`;

const DevicesList = styled.div`
  margin-top: 1rem;
  margin-bottom: 1.5rem;
`;

const DeviceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: rgba(30, 30, 46, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.75rem;
    color: var(--primary);
  }
`;

const DeviceName = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
`;

const DeviceDetails = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const LogoutDeviceButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  
  &:hover {
    color: var(--primary);
    text-decoration: underline;
  }
`;

const DeviceCount = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const DeviceLimit = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const DeviceCounter = styled.div`
  background-color: ${props => props.warning ? 'rgba(255, 87, 51, 0.2)' : 'rgba(108, 99, 255, 0.1)'};
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.warning ? 'var(--error)' : 'var(--primary)'};
`;

// Modal components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: var(--text);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--text);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
`;

function Settings() {
  const [settings, setSettings] = useState({
    language: 'en',
    audioQuality: 'high'
  });
  
  const [profile, setProfile] = useState({
    deleteConfirmation: ''
  });
  
  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeviceLogoutModal, setShowDeviceLogoutModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [deviceToLogout, setDeviceToLogout] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmationIcon, setConfirmationIcon] = useState('success');
  
  // Mock data for active devices
  const [activeDevices, setActiveDevices] = useState([
    { id: 1, name: 'MacBook Pro', type: 'desktop', location: 'San Francisco, CA', lastActive: 'Now' },
    { id: 2, name: 'iPhone 13', type: 'mobile', location: 'San Francisco, CA', lastActive: '10 min ago' },
    { id: 3, name: 'iPad Pro', type: 'tablet', location: 'San Francisco, CA', lastActive: '2 hrs ago' },
  ]);
  
  const handleSelectChange = (e, key) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: e.target.value
    }));
  };
  
  const handleProfileChange = (e, key) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      [key]: e.target.value
    }));
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  
  const confirmLogout = () => {
    // Handle logout logic here
    console.log('Logging out user');
    
    setShowLogoutModal(false);
    setConfirmationTitle('Logged Out Successfully');
    setConfirmationMessage('You have been logged out from all devices.');
    setConfirmationIcon('success');
    setShowConfirmationModal(true);
    
    // In a real implementation, you would use auth context to log out
    // and redirect to login page
    // Example: auth.logout();
    // navigate('/login');
  };
  
  const handleLogoutDevice = (device) => {
    setDeviceToLogout(device);
    setShowDeviceLogoutModal(true);
  };
  
  const confirmLogoutDevice = () => {
    if (!deviceToLogout) return;
    
    // Remove the device from active devices list
    setActiveDevices(prev => prev.filter(device => device.id !== deviceToLogout.id));
    
    console.log(`Logged out device ${deviceToLogout.id}`);
    setShowDeviceLogoutModal(false);
    
    setConfirmationTitle('Device Logged Out');
    setConfirmationMessage(`Your ${deviceToLogout.name} has been logged out successfully.`);
    setConfirmationIcon('success');
    setShowConfirmationModal(true);
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    // Handle account deletion logic here
    
    if (profile.deleteConfirmation !== 'DELETE') {
      setConfirmationTitle('Confirmation Required');
      setConfirmationMessage('Please type "DELETE" to confirm account deletion.');
      setConfirmationIcon('warning');
      setShowConfirmationModal(true);
      return;
    }
    
    console.log('Account deletion requested');
    setConfirmationTitle('Account Deletion Initiated');
    setConfirmationMessage('Account deletion request submitted. You will receive an email with further instructions.');
    setConfirmationIcon('info');
    setShowConfirmationModal(true);
    
    // Reset confirmation field
    setProfile(prev => ({
      ...prev,
      deleteConfirmation: ''
    }));
  };
  
  // Function to render the appropriate device icon
  const renderDeviceIcon = (type) => {
    switch(type) {
      case 'mobile':
        return <FaMobileAlt />;
      case 'tablet':
        return <FaTabletAlt />;
      case 'desktop':
      default:
        return <FaDesktop />;
    }
  };
  
  const handleModalClose = () => {
    setShowConfirmationModal(false);
  };
  
  // Function to render confirmation modal icon
  const renderConfirmationIcon = () => {
    switch(confirmationIcon) {
      case 'warning':
        return <FaExclamationTriangle style={{ color: 'var(--warning)' }} />;
      case 'info':
        return <FaInfoCircle style={{ color: 'var(--primary)' }} />;
      case 'success':
      default:
        return <FaCheck style={{ color: 'var(--success)' }} />;
    }
  };
  
  return (
    <SettingsContainer>
      <SectionTitle>Settings</SectionTitle>
      
      <SettingsCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle><FaGlobe /> Preferences</CardTitle>
        <CardContent>
          <SettingsList>
            <SettingItem>
              <SettingInfo>
                <SettingTitle>Language</SettingTitle>
                <SettingDescription>Set your preferred language</SettingDescription>
              </SettingInfo>
              <SelectWrapper>
                <Select 
                  value={settings.language}
                  onChange={(e) => handleSelectChange(e, 'language')}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                </Select>
              </SelectWrapper>
            </SettingItem>
            
            <SettingItem>
              <SettingInfo>
                <SettingTitle>Audio Quality</SettingTitle>
                <SettingDescription>Set the preferred audio quality for playback</SettingDescription>
              </SettingInfo>
              <SelectWrapper>
                <Select 
                  value={settings.audioQuality}
                  onChange={(e) => handleSelectChange(e, 'audioQuality')}
                >
                  <option value="low">Low (256 kbps)</option>
                  <option value="medium">Medium (320 kbps)</option>
                  <option value="high">High (lossless)</option>
                </Select>
              </SelectWrapper>
            </SettingItem>
          </SettingsList>
        </CardContent>
      </SettingsCard>
      
      <SettingsCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CardTitle><FaSignOutAlt /> Account Access</CardTitle>
        <CardContent>
          <p>Manage your active sessions and sign out from devices. You can be logged in on up to 5 devices at once.</p>
          
          <DevicesList>
            {activeDevices.map(device => (
              <DeviceItem key={device.id}>
                <DeviceInfo>
                  {renderDeviceIcon(device.type)}
                  <div>
                    <DeviceName>{device.name}</DeviceName>
                    <DeviceDetails>{device.location} • {device.lastActive}</DeviceDetails>
                  </div>
                </DeviceInfo>
                <LogoutDeviceButton onClick={() => handleLogoutDevice(device)}>
                  Sign Out
                </LogoutDeviceButton>
              </DeviceItem>
            ))}
          </DevicesList>
          
          <DeviceCount>
            <DeviceLimit>Device Limit: {activeDevices.length} of 5 used</DeviceLimit>
            <DeviceCounter warning={activeDevices.length >= 4}>
              {activeDevices.length} Active {activeDevices.length === 1 ? 'Device' : 'Devices'}
            </DeviceCounter>
          </DeviceCount>
          
          <OutlineButton onClick={handleLogout}>
            <FaSignOutAlt /> Sign Out From All Devices
          </OutlineButton>
        </CardContent>
      </SettingsCard>
      
      <SettingsCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CardTitle style={{ color: 'var(--danger)' }}><FaTrash /> Delete Account</CardTitle>
        <CardContent>
          <WarningBox>
            <FaExclamationTriangle />
            <p>
              Warning: Deleting your account is permanent and cannot be undone. All your data and settings will be permanently removed.
            </p>
          </WarningBox>
          
          <Form onSubmit={handleDeleteAccount}>
            <FormGroup>
              <Label>Type "DELETE" to confirm account deletion</Label>
              <Input
                type="text"
                value={profile.deleteConfirmation}
                onChange={(e) => handleProfileChange(e, 'deleteConfirmation')}
                required
              />
            </FormGroup>
            
            <DangerButton type="submit">Permanently Delete Account</DangerButton>
          </Form>
        </CardContent>
      </SettingsCard>
      
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutModal(false)}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>Confirm Logout</ModalTitle>
                <CloseButton onClick={() => setShowLogoutModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <p>Are you sure you want to sign out from all devices? This will end all your active sessions.</p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setShowLogoutModal(false)} style={{ marginRight: '0.5rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                  Cancel
                </Button>
                <Button onClick={confirmLogout}>
                  Sign Out
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      {/* Device Logout Confirmation Modal */}
      <AnimatePresence>
        {showDeviceLogoutModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeviceLogoutModal(false)}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>Confirm Device Logout</ModalTitle>
                <CloseButton onClick={() => setShowDeviceLogoutModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                {deviceToLogout && (
                  <>
                    <p>Are you sure you want to sign out from this device?</p>
                    <DeviceItem style={{ marginTop: '1rem' }}>
                      <DeviceInfo>
                        {renderDeviceIcon(deviceToLogout.type)}
                        <div>
                          <DeviceName>{deviceToLogout.name}</DeviceName>
                          <DeviceDetails>{deviceToLogout.location} • {deviceToLogout.lastActive}</DeviceDetails>
                        </div>
                      </DeviceInfo>
                    </DeviceItem>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setShowDeviceLogoutModal(false)} style={{ marginRight: '0.5rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                  Cancel
                </Button>
                <Button onClick={confirmLogoutDevice}>
                  Sign Out
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      {/* Confirmation Modal for various actions */}
      <AnimatePresence>
        {showConfirmationModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px' }}
            >
              <ModalHeader>
                <ModalTitle>{confirmationTitle}</ModalTitle>
                <CloseButton onClick={handleModalClose}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                  {renderConfirmationIcon()}
                </div>
                <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.5rem' }}>
                  {confirmationMessage}
                </p>
              </ModalBody>
              <ModalFooter style={{ justifyContent: 'center' }}>
                <Button onClick={handleModalClose}>
                  Got It
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </SettingsContainer>
  );
}

// Additional styled components for the new form elements
const Form = styled.form`
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text);
`;

const Input = styled.input`
  width: 100%;
  background-color: rgba(30, 30, 46, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const WarningBox = styled.div`
  background-color: rgba(255, 87, 51, 0.1);
  border: 1px solid rgba(255, 87, 51, 0.3);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  
  svg {
    color: var(--danger);
    margin-right: 0.75rem;
    font-size: 1.2rem;
    margin-top: 0.1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #FF5733, #C70039);
  
  &:hover {
    box-shadow: 0 5px 15px rgba(255, 87, 51, 0.3);
  }
`;

// Styled component for outline button
const OutlineButton = styled.button`
  background: transparent;
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    transform: translateY(-2px);
  }
`;

function SettingsWithLayout() {
  return (
    <DashboardLayout>
      <Settings />
    </DashboardLayout>
  );
}

export default SettingsWithLayout; 