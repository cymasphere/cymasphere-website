import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaShieldAlt, FaTimesCircle, FaSave, FaCheck, FaTimes } from 'react-icons/fa';
import DashboardLayout from './dashboard/DashboardLayout';

const ProfileContainer = styled.div`
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

const ProfileCard = styled(motion.div)`
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
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #FF5733, #C70039);
  
  &:hover {
    box-shadow: 0 5px 15px rgba(255, 87, 51, 0.3);
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  color: ${props => props.type === 'error' ? 'var(--error)' : 'var(--success)'};
  background-color: ${props => props.type === 'error' ? 'rgba(255, 87, 51, 0.1)' : 'rgba(0, 201, 167, 0.1)'};
  border: 1px solid ${props => props.type === 'error' ? 'rgba(255, 87, 51, 0.3)' : 'rgba(0, 201, 167, 0.3)'};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.75rem;
  }
`;

const SuccessMessage = styled(Message)`
  background-color: rgba(0, 201, 167, 0.1);
  border-color: rgba(0, 201, 167, 0.3);
`;

const ErrorMessage = styled(Message)`
  background-color: rgba(255, 87, 51, 0.1);
  border-color: rgba(255, 87, 51, 0.3);
`;

const VerifiedBadge = styled.span`
  background-color: rgba(0, 201, 167, 0.1);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: var(--success);
  margin-left: 0.5rem;
`;

const UnverifiedBadge = styled.span`
  background-color: rgba(255, 87, 51, 0.1);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: var(--error);
  margin-left: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1.5rem;
`;

function Profile() {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    isEmailVerified: true,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const handleProfileChange = (e, key) => {
    setProfile({
      ...profile,
      [key]: e.target.value,
    });
  };
  
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    
    // Mock implementation - would be replaced with actual API call
    console.log('Updating profile:', profile);
    setSuccessMessage('Profile updated successfully!');
    setIsEditing(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  const handleChangePassword = (e) => {
    e.preventDefault();
    
    // Implement password validation
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    
    // Mock implementation - would be replaced with actual API call
    console.log('Changing password');
    setSuccessMessage('Password changed successfully!');
    
    // Clear all password fields
    setPasswordFields({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };
  
  return (
    <ProfileContainer>
      <SectionTitle>Profile</SectionTitle>
      
      {successMessage && (
        <SuccessMessage>
          {successMessage}
        </SuccessMessage>
      )}
      
      {errorMessage && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}
      
      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle>
          <FaUser /> Personal Information
        </CardTitle>
        <Form onSubmit={handleUpdateProfile}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                value={profile.firstName}
                onChange={(e) => handleProfileChange(e, 'firstName')}
                disabled={!isEditing}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                value={profile.lastName}
                onChange={(e) => handleProfileChange(e, 'lastName')}
                disabled={!isEditing}
              />
            </FormGroup>
          </FormRow>
          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              value={profile.email}
              onChange={(e) => handleProfileChange(e, 'email')}
              disabled={!isEditing}
            />
            {profile.isEmailVerified ? (
              <VerifiedBadge>
                <FaCheck /> Verified
              </VerifiedBadge>
            ) : (
              <UnverifiedBadge>
                <FaTimes /> Not Verified
              </UnverifiedBadge>
            )}
          </FormGroup>
          
          <ButtonGroup>
            {isEditing ? (
              <>
                <Button type="submit">
                  <FaSave /> Save Changes
                </Button>
                <CancelButton type="button" onClick={() => setIsEditing(false)}>
                  <FaTimesCircle /> Cancel
                </CancelButton>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </ButtonGroup>
        </Form>
      </ProfileCard>
      
      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <CardTitle>
          <FaLock /> Security
        </CardTitle>
        <Form onSubmit={handleChangePassword}>
          <FormGroup>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              type="password"
              id="currentPassword"
              value={passwordFields.currentPassword}
              onChange={(e) => setPasswordFields({...passwordFields, currentPassword: e.target.value})}
            />
          </FormGroup>
          <FormRow>
            <FormGroup>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                type="password"
                id="newPassword"
                value={passwordFields.newPassword}
                onChange={(e) => setPasswordFields({...passwordFields, newPassword: e.target.value})}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={passwordFields.confirmPassword}
                onChange={(e) => setPasswordFields({...passwordFields, confirmPassword: e.target.value})}
              />
            </FormGroup>
          </FormRow>
          <ButtonGroup>
            <Button type="submit">
              Change Password
            </Button>
          </ButtonGroup>
        </Form>
      </ProfileCard>
      
      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <CardTitle>
          <FaShieldAlt /> Account Protection
        </CardTitle>
        <CardContent>
          <p>Two-factor authentication adds an extra layer of security to your account. When enabled, you'll need to provide a verification code in addition to your password when signing in.</p>
          <ButtonGroup>
            <Button type="button">
              Enable Two-Factor Authentication
            </Button>
          </ButtonGroup>
        </CardContent>
      </ProfileCard>
    </ProfileContainer>
  );
}

function ProfileWithLayout() {
  return (
    <DashboardLayout>
      <Profile />
    </DashboardLayout>
  );
}

export { Profile };
export default ProfileWithLayout; 