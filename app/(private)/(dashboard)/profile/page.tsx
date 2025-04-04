"use client";
import React from "react";
import NextSEO from "@/components/NextSEO";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaUser, FaLock, FaTimesCircle, FaSave } from "react-icons/fa";
import { usePathname } from "next/navigation";

const ProfileContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text);

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const ProfileCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
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

  @media (max-width: 768px) {
    margin-bottom: 1.25rem;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text);

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
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

  @media (max-width: 768px) {
    padding: 0.85rem 1rem;
    font-size: 16px; /* Prevent zoom on iOS */
    border-radius: 8px;
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

  @media (max-width: 768px) {
    padding: 0.85rem 1.5rem;
    width: 100%;
    justify-content: center;
    border-radius: 8px;
    margin-top: 1.5rem;
  }
`;

// Kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #ff5733, #c70039);

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

interface MessageProps {
  type: "error" | "success";
  children: React.ReactNode;
}

const Message = styled.div<MessageProps>`
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  color: ${(props) =>
    props.type === "error" ? "var(--error)" : "var(--success)"};
  background-color: ${(props) =>
    props.type === "error"
      ? "rgba(255, 87, 51, 0.1)"
      : "rgba(0, 201, 167, 0.1)"};
  border: 1px solid
    ${(props) =>
      props.type === "error"
        ? "rgba(255, 87, 51, 0.3)"
        : "rgba(0, 201, 167, 0.3)"};
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
  }

  @media (max-width: 768px) {
    padding: 0.85rem;
    border-radius: 8px;
  }
`;

// Add animation variants
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: custom * 0.1,
    },
  }),
};

const buttonVariants = {
  hover: {
    scale: 1.03,
    boxShadow: "0 5px 15px rgba(108, 99, 255, 0.4)",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  tap: {
    scale: 0.98,
  },
};

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface MessageData {
  text: string;
  type: "error" | "success" | "";
}

function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState<MessageData>({ text: "", type: "" });
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true after component has mounted to prevent state updates during unmounting
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Use this function to safely update state only if the component is still mounted
  const safeSetMessage = (messageData: MessageData) => {
    if (isMounted) {
      setMessage(messageData);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof ProfileData
  ) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      [key]: e.target.value,
    }));
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update logic here
    console.log("Profile updated:", profile);
    safeSetMessage({
      text: "Profile information updated successfully!",
      type: "success",
    });

    // Clear message after 3 seconds
    const timer = setTimeout(() => {
      safeSetMessage({ text: "", type: "" });
    }, 3000);

    // Clear timeout if component unmounts
    return () => clearTimeout(timer);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (profile.newPassword !== profile.confirmPassword) {
      safeSetMessage({
        text: "New passwords do not match!",
        type: "error",
      });
      return;
    }

    if (!profile.currentPassword) {
      safeSetMessage({
        text: "Current password is required!",
        type: "error",
      });
      return;
    }

    // Reset password fields
    setProfile((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));

    safeSetMessage({
      text: "Password changed successfully!",
      type: "success",
    });

    // Clear message after 3 seconds with proper cleanup
    const timer = setTimeout(() => {
      safeSetMessage({ text: "", type: "" });
    }, 3000);

    // Clear timeout if component unmounts
    return () => clearTimeout(timer);
  };

  return (
    <ProfileContainer>
      <SectionTitle>My Profile</SectionTitle>

      {message.text && (
        <Message type={message.type as "error" | "success"}>
          {message.type === "error" ? <FaTimesCircle /> : <FaUser />}
          {message.text}
        </Message>
      )}

      <ProfileCard
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <CardTitle>
          <FaUser /> Personal Information
        </CardTitle>
        <CardContent>
          <Form onSubmit={handleUpdateProfile}>
            <TwoColumnGrid>
              <FormGroup>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleProfileChange(e, "firstName")}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleProfileChange(e, "lastName")}
                  required
                />
              </FormGroup>
            </TwoColumnGrid>

            <FormGroup>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange(e, "email")}
                required
              />
            </FormGroup>

            <Button
              type="submit"
              as={motion.button}
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <FaSave /> Save Changes
            </Button>
          </Form>
        </CardContent>
      </ProfileCard>

      <ProfileCard
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <CardTitle>
          <FaLock /> Change Password
        </CardTitle>
        <CardContent>
          <Form onSubmit={handleChangePassword}>
            <FormGroup>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={profile.currentPassword}
                onChange={(e) => handleProfileChange(e, "currentPassword")}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>New Password</Label>
              <Input
                type="password"
                value={profile.newPassword}
                onChange={(e) => handleProfileChange(e, "newPassword")}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={profile.confirmPassword}
                onChange={(e) => handleProfileChange(e, "confirmPassword")}
                required
              />
            </FormGroup>

            <Button
              type="submit"
              as={motion.button}
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <FaLock /> Update Password
            </Button>
          </Form>
        </CardContent>
      </ProfileCard>
    </ProfileContainer>
  );
}

export default function ProfilePage() {
  const pathname = usePathname();

  return (
    <>
      <NextSEO
        title="Profile - Cymasphere"
        description="Your Cymasphere profile"
        canonical="/profile"
        noindex={true}
      />
      <Profile key={pathname} />
    </>
  );
}
