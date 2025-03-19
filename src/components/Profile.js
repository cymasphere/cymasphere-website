import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import DashboardLayout from './dashboard/DashboardLayout';
import { FaUser, FaLock, FaEnvelope, FaShieldAlt, FaTimesCircle, FaSave } from 'react-icons/fa';

const ProfileContainer = styled.div`
  width: 100%;
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

function Profile() {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const handleProfileChange = (e, key) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      [key]: e.target.value
    }));
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    // Handle profile update logic here
    console.log('Profile updated:', profile);
    setMessage({
      text: 'Profile information updated successfully!',
      type: 'success'
    });
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    if (profile.newPassword !== profile.confirmPassword) {
      setMessage({
        text: 'New passwords do not match!',
        type: 'error'
      });
      return;
    }
    
    if (!profile.currentPassword) {
      setMessage({
        text: 'Current password is required!',
        type: 'error'
      });
      return;
    }
    
    // Reset password fields
    setProfile(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    
    setMessage({
      text: 'Password changed successfully!',
      type: 'success'
    });
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };
  
  return (
    <ProfileContainer>
      <SectionTitle>My Profile</SectionTitle>
      
      {message.text && (
        <Message type={message.type}>
          {message.type === 'error' ? <FaTimesCircle /> : <FaUser />}
          {message.text}
        </Message>
      )}
      
      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle><FaUser /> Personal Information</CardTitle>
        <CardContent>
          <Form onSubmit={handleUpdateProfile}>
            <TwoColumnGrid>
              <FormGroup>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange(e, 'firstName')}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange(e, 'lastName')}
                  required
                />
              </FormGroup>
            </TwoColumnGrid>
            
            <FormGroup>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange(e, 'email')}
                required
              />
            </FormGroup>
            
            <Button type="submit">
              <FaSave /> Save Changes
            </Button>
          </Form>
        </CardContent>
      </ProfileCard>
      
      <ProfileCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CardTitle><FaLock /> Change Password</CardTitle>
        <CardContent>
          <Form onSubmit={handleChangePassword}>
            <FormGroup>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={profile.currentPassword}
                onChange={(e) => handleProfileChange(e, 'currentPassword')}
                required
              />
            </FormGroup>
            
            <TwoColumnGrid>
              <FormGroup>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={profile.newPassword}
                  onChange={(e) => handleProfileChange(e, 'newPassword')}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={profile.confirmPassword}
                  onChange={(e) => handleProfileChange(e, 'confirmPassword')}
                  required
                />
              </FormGroup>
            </TwoColumnGrid>
            
            <Button type="submit">
              <FaLock /> Update Password
            </Button>
          </Form>
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

export default ProfileWithLayout; 