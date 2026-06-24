/**
 * @fileoverview Dashboard settings: profile (name, password reset), devices, email change, and account deletion.
 * @module app/(private)/(dashboard)/settings/page
 */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaMobileAlt,
  FaDesktop,
  FaTabletAlt,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaEnvelope,
  FaUser,
  FaLock,
  FaTimesCircle,
  FaSave,
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import AnimatedCard from "@/components/settings/CardComponent";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import { revokeCymasphereDeviceSession, fetchUserSessions } from "@/utils/supabase/actions";
import { extractCymasphereDeviceHost } from "@/utils/supabase/cymasphere-device";

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
    content: "▼";
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
  display: flex;
  align-items: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
  }
`;

const DevicesList = styled.div`
  margin-top: 1rem;
  margin-bottom: 1.5rem;
`;

// Update the styled component for active session highlighting
const DeviceItem = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: ${(props) =>
    props.$isActive ? "rgba(108, 99, 255, 0.1)" : "rgba(30, 30, 46, 0.5)"};
  border-radius: 6px;
  border: 1px solid
    ${(props) =>
      props.$isActive ? "var(--primary)" : "rgba(255, 255, 255, 0.05)"};
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

const DeviceLogoutButton = styled.button`
  background: rgba(255, 87, 51, 0.15);
  border: 1px solid rgba(255, 87, 51, 0.35);
  color: var(--error);
  border-radius: 6px;
  padding: 0.45rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: rgba(255, 87, 51, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

interface DeviceCounterProps {
  $warning: boolean;
}

const StyledDeviceCounter = styled.div<DeviceCounterProps>`
  background-color: ${(props) =>
    props.$warning ? "rgba(255, 87, 51, 0.2)" : "rgba(108, 99, 255, 0.1)"};
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${(props) => (props.$warning ? "var(--error)" : "var(--primary)")};
`;

// Create a wrapper component that accepts standard props and converts to transient props
const DeviceCounter: React.FC<
  React.PropsWithChildren<{ warning: boolean }>
> = ({ warning, children }) => {
  return (
    <StyledDeviceCounter $warning={warning}>{children}</StyledDeviceCounter>
  );
};

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ProfileFieldInput = styled.input`
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
    font-size: 16px;
    border-radius: 8px;
  }
`;

const ProfileFieldReadOnly = styled(ProfileFieldInput)`
  background-color: rgba(30, 30, 46, 0.3);
  color: var(--text-secondary);
  cursor: not-allowed;

  &:focus {
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

interface ProfileFlashRowProps {
  $variant: "error" | "success";
}

/**
 * @brief Inline alert for profile name save and password-reset email actions.
 */
const ProfileFlashRow = styled.div<ProfileFlashRowProps>`
  padding: 1rem;
  border-radius: 6px;
  margin: 0 0 1.5rem;
  color: ${(p) =>
    p.$variant === "error" ? "var(--error)" : "var(--success)"};
  background-color: ${(p) =>
    p.$variant === "error"
      ? "rgba(255, 87, 51, 0.1)"
      : "rgba(0, 201, 167, 0.1)"};
  border: 1px solid
    ${(p) =>
      p.$variant === "error"
        ? "rgba(255, 87, 51, 0.3)"
        : "rgba(0, 201, 167, 0.3)"};
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
`;

const profileActionButtonVariants = {
  hover: {
    scale: 1.03,
    boxShadow: "0 5px 15px rgba(108, 99, 255, 0.4)",
    transition: {
      duration: 0.3,
    },
  },
  tap: {
    scale: 0.98,
  },
};

const ProfileFormGroup = styled.div`
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    margin-bottom: 1.25rem;
  }
`;

const ProfileFieldLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text);

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
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

interface DeleteAccountFormState {
  deleteConfirmation: string;
}

interface PersonalInfoFormState {
  first_name: string;
  last_name: string;
}

interface ProfileFlashMessageState {
  text: string;
  type: "error" | "success" | "";
}

interface Device {
  name: string;
  type: "mobile" | "tablet" | "desktop";
  location: string;
  lastActive: string;
}

function Settings() {
  const { t } = useTranslation();

  const [deleteAccountForm, setDeleteAccountForm] =
    useState<DeleteAccountFormState>({
      deleteConfirmation: "",
    });

  const { user, refreshUser, requestEmailChange, updateProfile, resetPassword } =
    useAuth();

  const [personalInfoForm, setPersonalInfoForm] =
    useState<PersonalInfoFormState>({
      first_name: user?.profile?.first_name || "",
      last_name: user?.profile?.last_name || "",
    });

  const [profileFlash, setProfileFlash] = useState<ProfileFlashMessageState>({
    text: "",
    type: "",
  });
  const { devices, isLoadingDevices, refreshDevices } = useDashboard();

  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [devicePendingLogout, setDevicePendingLogout] = useState<{
    name: string;
    userAgent: string;
  } | null>(null);
  const [revokingDeviceUserAgent, setRevokingDeviceUserAgent] = useState<
    string | null
  >(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationIcon, setConfirmationIcon] = useState<
    "success" | "warning" | "info"
  >("success");

  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [isEmailChangeSubmitting, setIsEmailChangeSubmitting] = useState(false);

  /** @brief Refresh session / pro status on mount (aligned with login flow). */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /** @brief Keep Active Devices in sync when opening settings (no manual refresh). */
  useEffect(() => {
    void refreshDevices({ silent: true });
  }, [refreshDevices]);

  /** @brief Keep name fields in sync when the loaded profile updates. */
  useEffect(() => {
    if (user?.profile) {
      setPersonalInfoForm({
        first_name: user.profile.first_name || "",
        last_name: user.profile.last_name || "",
      });
    }
  }, [user]);

  // Use devices from DashboardContext instead of fetching separately
  const activeDevices = devices;
  const isLoadingSessions = isLoadingDevices;
  
  // Refresh devices when needed
  const refreshSessionData = useCallback(async () => {
    await refreshDevices();
  }, [refreshDevices]);

  // Helper function to format the last active time
  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 5) {
      return t("dashboard.settings.timeNow", "Now");
    } else if (diffMins < 60) {
      return t("dashboard.settings.timeMinutes", "{{count}} min ago", {
        count: diffMins,
      });
    } else if (diffMins < 24 * 60) {
      const diffHours = Math.floor(diffMins / 60);
      return t("dashboard.settings.timeHours", "{{count}} hr ago", {
        count: diffHours,
        hr:
          diffHours === 1
            ? t("dashboard.settings.hour", "hr")
            : t("dashboard.settings.hours", "hrs"),
      });
    } else {
      const diffDays = Math.floor(diffMins / (60 * 24));
      return t("dashboard.settings.timeDays", "{{count}} day ago", {
        count: diffDays,
        day:
          diffDays === 1
            ? t("dashboard.settings.day", "day")
            : t("dashboard.settings.days", "days"),
      });
    }
  };

  /**
   * @brief Updates local first/last name fields before save to Supabase profile.
   */
  const handlePersonalInfoFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof PersonalInfoFormState,
  ) => {
    setPersonalInfoForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  /**
   * @brief Persists name fields via AuthContext `updateProfile`.
   */
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.profile) return;

    const updatedProfile = {
      ...user.profile,
      ...personalInfoForm,
    };

    try {
      const { error } = await updateProfile(updatedProfile);
      if (error) {
        setProfileFlash({
          text: t(
            "dashboard.profile.errorUpdating",
            "Error updating profile: {{error}}",
            { error: error.toString() },
          ),
          type: "error",
        });
      } else {
        setProfileFlash({
          text: t(
            "dashboard.profile.profileUpdated",
            "Profile information updated successfully!",
          ),
          type: "success",
        });
      }
    } catch (err) {
      setProfileFlash({
        text: t(
          "dashboard.profile.unexpectedError",
          "An unexpected error occurred: {{error}}",
          {
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ),
        type: "error",
      });
    }

    setTimeout(() => {
      setProfileFlash({ text: "", type: "" });
    }, 3000);
  };

  /**
   * @brief Sends Supabase password reset email to the signed-in user's address.
   */
  const handleSendPasswordResetEmail = async () => {
    if (!user?.email) {
      setProfileFlash({
        text: t(
          "dashboard.profile.noEmailFound",
          "No email address found for password reset",
        ),
        type: "error",
      });
      setTimeout(() => setProfileFlash({ text: "", type: "" }), 3000);
      return;
    }

    try {
      const { error } = await resetPassword(user.email);
      if (error) {
        if (
          error.message.includes("email rate limit exceeded") ||
          error.message.includes("rate limit")
        ) {
          setProfileFlash({
            text: t(
              "dashboard.profile.tooManyAttempts",
              "Too many password reset attempts. Please wait a few minutes before trying again.",
            ),
            type: "error",
          });
        } else {
          setProfileFlash({
            text: t(
              "dashboard.profile.errorSendingReset",
              "Error sending reset email: {{error}}",
              { error: error.message },
            ),
            type: "error",
          });
        }
      } else {
        setProfileFlash({
          text: t(
            "dashboard.profile.passwordResetSent",
            "Password reset email sent! Please check your inbox.",
          ),
          type: "success",
        });
      }
    } catch (err) {
      setProfileFlash({
        text: t(
          "dashboard.profile.unexpectedError",
          "An unexpected error occurred: {{error}}",
          {
            error: err instanceof Error ? err.message : "Unknown error",
          },
        ),
        type: "error",
      });
    }

    setTimeout(() => {
      setProfileFlash({ text: "", type: "" });
    }, 3000);
  };

  /**
   * @brief Controlled input for the account deletion confirmation phrase.
   */
  const handleDeleteAccountFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof DeleteAccountFormState,
  ) => {
    setDeleteAccountForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const handleLogout = () => {
    setDevicePendingLogout(null);
    setShowLogoutModal(true);
  };

  const handleDeviceLogout = (device: {
    name: string;
    userAgent: string;
  }) => {
    setDevicePendingLogout(device);
    setShowLogoutModal(true);
  };

  /**
   * @brief Submits a Supabase Auth email change request and shows success or inline error.
   */
  const handleEmailChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeError(null);
    setIsEmailChangeSubmitting(true);
    try {
      const { error } = await requestEmailChange(newEmailInput);
      if (error) {
        setEmailChangeError(error.message);
        return;
      }
      setNewEmailInput("");
      setConfirmationTitle(
        t("dashboard.settings.emailChangeCheckInboxTitle", "Check your email"),
      );
      setConfirmationMessage(
        t(
          "dashboard.settings.emailChangeCheckInboxMessage",
          "We sent a confirmation link. Open it to complete the change. If secure email change is enabled in your project, check both your current and new inboxes.",
        ),
      );
      setConfirmationIcon("info");
      setShowConfirmationModal(true);
    } finally {
      setIsEmailChangeSubmitting(false);
    }
  };

  const confirmLogout = async () => {
    try {
      if (devicePendingLogout) {
        setRevokingDeviceUserAgent(devicePendingLogout.userAgent);
        const { error } = await revokeCymasphereDeviceSession(
          devicePendingLogout.userAgent,
        );

        setShowLogoutModal(false);
        const signedOutDeviceName = devicePendingLogout.name;
        setDevicePendingLogout(null);

        if (error) {
          setConfirmationTitle(
            t("dashboard.settings.logoutFailed", "Logout Failed"),
          );
          setConfirmationMessage(
            error ||
              t(
                "dashboard.settings.deviceLogoutError",
                "There was an error signing out that device. Please try again.",
              ),
          );
          setConfirmationIcon("warning");
          setShowConfirmationModal(true);
          return;
        }

        setConfirmationTitle(
          t("dashboard.settings.deviceLogoutSuccess", "Device Signed Out"),
        );
        setConfirmationMessage(
          t(
            "dashboard.settings.deviceLogoutMessage",
            "{{device}} has been signed out of the Cymasphere app.",
            { device: signedOutDeviceName },
          ),
        );
        setConfirmationIcon("success");
        setShowConfirmationModal(true);
        await refreshSessionData();
        return;
      }

      const { sessions, error: fetchError } = await fetchUserSessions();
      if (fetchError) {
        throw new Error(fetchError);
      }

      const revokeResults = await Promise.all(
        sessions.map((session) =>
          revokeCymasphereDeviceSession(session.user_agent),
        ),
      );

      const failedRevoke = revokeResults.find((result) => result.error);
      if (failedRevoke?.error) {
        throw new Error(failedRevoke.error);
      }

      setShowLogoutModal(false);
      setConfirmationTitle(
        t("dashboard.settings.logoutSuccess", "Logged Out Successfully"),
      );
      setConfirmationMessage(
        t(
          "dashboard.settings.logoutMessage",
          "You have been signed out from all other Cymasphere app devices.",
        ),
      );
      setConfirmationIcon("success");
      setShowConfirmationModal(true);

      await refreshSessionData();
    } catch (error) {
      console.error("Error logging out:", error);
      setShowLogoutModal(false);
      setDevicePendingLogout(null);
      setConfirmationTitle(
        t("dashboard.settings.logoutFailed", "Logout Failed"),
      );
      setConfirmationMessage(
        t(
          "dashboard.settings.logoutError",
          "There was an error logging out. Please try again.",
        ),
      );
      setConfirmationIcon("warning");
      setShowConfirmationModal(true);
    } finally {
      setRevokingDeviceUserAgent(null);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle account deletion logic

    if (deleteAccountForm.deleteConfirmation !== "DELETE") {
      setConfirmationTitle(
        t("dashboard.settings.confirmationRequired", "Confirmation Required")
      );
      setConfirmationMessage(
        t(
          "dashboard.settings.confirmationMessage",
          'Please type "DELETE" to confirm account deletion.'
        )
      );
      setConfirmationIcon("warning");
      setShowConfirmationModal(true);
      return;
    }

    // Show loading confirmation
    setConfirmationTitle(
      t("dashboard.settings.processingDeletion", "Processing Deletion Request")
    );
    setConfirmationMessage(
      t(
        "dashboard.settings.processingMessage",
        "Please wait while we process your account deletion request..."
      )
    );
    setConfirmationIcon("info");
    setShowConfirmationModal(true);

    try {
      if (!user?.id) {
        throw new Error("User ID not found");
      }

      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message
        setConfirmationTitle(
          t("dashboard.settings.accountDeleted", "Account Deleted")
        );
        setConfirmationMessage(
          t(
            "dashboard.settings.accountDeletedMessage",
            "Your account has been successfully deleted. You will be redirected to the homepage."
          )
        );
        setConfirmationIcon("success");

        // Wait 3 seconds then redirect to homepage
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      } else {
        // Show error message
        setConfirmationTitle(
          t("dashboard.settings.deletionFailed", "Deletion Failed")
        );
        setConfirmationMessage(
          t(
            "dashboard.settings.deletionFailedError",
            "Account deletion failed: {{error}}",
            { error: result.error }
          )
        );
        setConfirmationIcon("warning");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setConfirmationTitle(
        t("dashboard.settings.deletionFailed", "Deletion Failed")
      );
      setConfirmationMessage(
        t(
          "dashboard.settings.deletionProcessingError",
          "There was an error processing your account deletion. Please try again later."
        )
      );
      setConfirmationIcon("warning");
    }

    // Reset confirmation field
    setDeleteAccountForm((prev) => ({
      ...prev,
      deleteConfirmation: "",
    }));
  };

  // Function to render the appropriate device icon
  const renderDeviceIcon = (type: "mobile" | "tablet" | "desktop") => {
    switch (type) {
      case "mobile":
        return <FaMobileAlt />;
      case "tablet":
        return <FaTabletAlt />;
      case "desktop":
      default:
        return <FaDesktop />;
    }
  };

  // Helper function to translate device types
  const getDeviceTypeName = (type: "mobile" | "tablet" | "desktop"): string => {
    switch (type) {
      case "mobile":
        return t("dashboard.settings.deviceMobile", "Mobile");
      case "tablet":
        return t("dashboard.settings.deviceTablet", "Tablet");
      case "desktop":
      default:
        return t("dashboard.settings.deviceDesktop", "Desktop");
    }
  };

  const handleModalClose = () => {
    setShowConfirmationModal(false);
  };

  // Function to render confirmation modal icon
  const renderConfirmationIcon = () => {
    switch (confirmationIcon) {
      case "warning":
        return <FaExclamationTriangle style={{ color: "var(--warning)" }} />;
      case "info":
        return <FaInfoCircle style={{ color: "var(--primary)" }} />;
      case "success":
      default:
        return <FaCheck style={{ color: "var(--success)" }} />;
    }
  };

  return (
    <SettingsContainer>
      <SectionTitle>{t("dashboard.settings.title", "Settings")}</SectionTitle>

      {profileFlash.text ? (
        <ProfileFlashRow $variant={profileFlash.type as "error" | "success"}>
          {profileFlash.type === "error" ? <FaTimesCircle /> : <FaUser />}
          {profileFlash.text}
        </ProfileFlashRow>
      ) : null}

      <AnimatedCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle>
          <FaUser />{" "}
          {t("dashboard.profile.personalInfo", "Personal Information")}
        </CardTitle>
        <CardContent>
          <form onSubmit={handleSavePersonalInfo}>
            <TwoColumnGrid>
              <ProfileFormGroup>
                <ProfileFieldLabel>
                  {t("dashboard.profile.firstName", "First Name")}
                </ProfileFieldLabel>
                <ProfileFieldInput
                  type="text"
                  value={personalInfoForm.first_name}
                  onChange={(e) =>
                    handlePersonalInfoFieldChange(e, "first_name")
                  }
                  required
                />
              </ProfileFormGroup>
              <ProfileFormGroup>
                <ProfileFieldLabel>
                  {t("dashboard.profile.lastName", "Last Name")}
                </ProfileFieldLabel>
                <ProfileFieldInput
                  type="text"
                  value={personalInfoForm.last_name}
                  onChange={(e) =>
                    handlePersonalInfoFieldChange(e, "last_name")
                  }
                  required
                />
              </ProfileFormGroup>
            </TwoColumnGrid>
            <ProfileFormGroup>
              <ProfileFieldLabel>
                {t("dashboard.profile.email", "Email Address")}
              </ProfileFieldLabel>
              <ProfileFieldReadOnly
                type="email"
                value={user?.email || ""}
                readOnly
                disabled
                aria-readonly
              />
            </ProfileFormGroup>
            <Button
              type="submit"
              as={motion.button}
              whileHover="hover"
              whileTap="tap"
              variants={profileActionButtonVariants}
            >
              <FaSave style={{ marginRight: "0.5rem" }} />
              {t("dashboard.profile.saveChanges", "Save Changes")}
            </Button>
          </form>
        </CardContent>
      </AnimatedCard>

      <AnimatedCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <CardTitle>
          <FaLock />{" "}
          {t("dashboard.profile.passwordSection", "Change Password")}
        </CardTitle>
        <CardContent>
          <Button
            type="button"
            onClick={handleSendPasswordResetEmail}
            as={motion.button}
            whileHover="hover"
            whileTap="tap"
            variants={profileActionButtonVariants}
          >
            <FaLock style={{ marginRight: "0.5rem" }} />
            {t(
              "dashboard.profile.sendResetEmail",
              "Send Password Reset Email",
            )}
          </Button>
        </CardContent>
      </AnimatedCard>

      <AnimatedCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
      >
        <CardTitle>
          <FaMobileAlt /> {t("dashboard.settings.devices", "Active Devices")}
        </CardTitle>
        <CardContent>
          <DevicesList>
            {isLoadingSessions ? (
              <div style={{ textAlign: "center", padding: "1rem 0" }}>
                {t("common.loading", "Loading...")}
              </div>
            ) : activeDevices.length === 0 ? (
              <div style={{ padding: "1rem 0" }}>
                {t("dashboard.settings.noDevices", "No active devices found")}
              </div>
            ) : (
              activeDevices.map((device) => (
                <DeviceItem
                  key={extractCymasphereDeviceHost(device.userAgent)}
                  $isActive={
                    device.location ===
                    "current" /* For current session highlighting */
                  }
                >
                  <DeviceInfo>
                    {renderDeviceIcon(device.type)}
                    <div>
                      <DeviceName>
                        {device.name} ({getDeviceTypeName(device.type)})
                      </DeviceName>
                      <DeviceDetails>
                        {device.location === "current"
                          ? t(
                              "dashboard.settings.currentDevice",
                              "Current Device"
                            )
                          : device.location}{" "}
                        · {device.lastActive}
                      </DeviceDetails>
                    </div>
                  </DeviceInfo>
                  <DeviceLogoutButton
                    type="button"
                    onClick={() =>
                      handleDeviceLogout({
                        name: device.name,
                        userAgent: device.userAgent,
                      })
                    }
                    disabled={revokingDeviceUserAgent === device.userAgent}
                    aria-label={t(
                      "dashboard.settings.signOutDevice",
                      "Sign out device",
                    )}
                  >
                    <FaSignOutAlt />
                    {revokingDeviceUserAgent === device.userAgent
                      ? t("common.loading", "Loading...")
                      : t("dashboard.settings.signOutDevice", "Sign Out")}
                  </DeviceLogoutButton>
                </DeviceItem>
              ))
            )}
          </DevicesList>

          <DeviceCount>
            <DeviceLimit>
              {t(
                "dashboard.settings.devicesInfo",
                "You're using {{current}} of {{max}} allowed devices",
                {
                  current: activeDevices.length,
                  max: 3,
                }
              )}
            </DeviceLimit>
            <DeviceCounter warning={activeDevices.length >= 3}>
              {activeDevices.length} / 3
            </DeviceCounter>
          </DeviceCount>

          <Button onClick={handleLogout}>
            <FaSignOutAlt style={{ marginRight: "0.5rem" }} />
            {t("dashboard.settings.logoutAll", "Logout from All Other Devices")}
          </Button>
        </CardContent>
      </AnimatedCard>

      <AnimatedCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
      >
        <CardTitle>
          <FaEnvelope />{" "}
          {t("dashboard.settings.emailAddressSection", "Email address")}
        </CardTitle>
        <CardContent>
          {user?.new_email ? (
            <div
              style={{
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
                backgroundColor: "rgba(108, 99, 255, 0.12)",
                border: "1px solid rgba(108, 99, 255, 0.35)",
                borderRadius: "6px",
                fontSize: "0.9rem",
                color: "var(--text)",
              }}
            >
              <FaInfoCircle
                style={{
                  marginRight: "0.5rem",
                  verticalAlign: "middle",
                  color: "var(--primary)",
                }}
              />
              {t(
                "dashboard.settings.emailChangePending",
                "Confirmation pending for {{email}}. Check that inbox and use the link we sent.",
                { email: user.new_email },
              )}
            </div>
          ) : null}
          <div style={{ marginBottom: "0.75rem" }}>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.35rem",
              }}
            >
              {t("dashboard.settings.currentEmailLabel", "Current email")}
            </div>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "rgba(30, 30, 46, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text-secondary)",
                borderRadius: "6px",
                fontSize: "0.95rem",
              }}
            >
              {user?.email ?? "—"}
            </div>
          </div>
          <form onSubmit={handleEmailChangeSubmit}>
            <label
              htmlFor="settingsNewEmail"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                color: "var(--text)",
              }}
            >
              {t("dashboard.settings.newEmailLabel", "New email address")}
            </label>
            <input
              id="settingsNewEmail"
              type="email"
              autoComplete="email"
              value={newEmailInput}
              onChange={(e) => {
                setNewEmailInput(e.target.value);
                if (emailChangeError) setEmailChangeError(null);
              }}
              disabled={isEmailChangeSubmitting}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginBottom: emailChangeError ? "0.5rem" : "1rem",
                backgroundColor: "rgba(30, 30, 46, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text)",
                borderRadius: "6px",
              }}
            />
            {emailChangeError ? (
              <div
                style={{
                  color: "var(--error)",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                {emailChangeError}
              </div>
            ) : null}
            <Button
              type="submit"
              disabled={isEmailChangeSubmitting}
              style={{
                marginTop: 0,
                opacity: isEmailChangeSubmitting ? 0.7 : 1,
                cursor: isEmailChangeSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <FaEnvelope style={{ marginRight: "0.5rem" }} />
              {t(
                "dashboard.settings.sendEmailConfirmation",
                "Send confirmation email",
              )}
            </Button>
          </form>
        </CardContent>
      </AnimatedCard>

      <AnimatedCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.32 }}
      >
        <CardTitle>
          <FaTrash style={{ color: "var(--error)" }} />{" "}
          {t("dashboard.settings.dangerZone", "Danger Zone")}
        </CardTitle>
        <CardContent>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "rgba(255, 69, 58, 0.1)",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.5rem",
                color: "var(--error)",
              }}
            >
              <FaExclamationTriangle style={{ marginRight: "0.5rem" }} />
              <div style={{ fontWeight: 600 }}>
                {t(
                  "dashboard.settings.deleteWarning",
                  "Delete Account Permanently"
                )}
              </div>
            </div>
            <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
              {t(
                "dashboard.settings.deleteDesc",
                "This action cannot be undone. All of your data will be permanently deleted."
              )}
            </p>

            <form onSubmit={handleDeleteAccount}>
              <div
                style={{
                  marginBottom: "1rem",
                }}
              >
                <label
                  htmlFor="deleteConfirmation"
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {t(
                    "dashboard.settings.typeDelete",
                    'Type "DELETE" to confirm:'
                  )}
                </label>
                <input
                  type="text"
                  id="deleteConfirmation"
                  value={deleteAccountForm.deleteConfirmation}
                  onChange={(e) =>
                    handleDeleteAccountFieldChange(e, "deleteConfirmation")
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "rgba(30, 30, 46, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--text)",
                    borderRadius: "6px",
                  }}
                />
              </div>
              <Button
                type="submit"
                style={{
                  background: "var(--error)",
                  width: "100%",
                }}
              >
                {t("dashboard.settings.deleteAccount", "Delete My Account")}
              </Button>
            </form>
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowLogoutModal(false);
              setDevicePendingLogout(null);
            }}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>
                  {devicePendingLogout
                    ? t(
                        "dashboard.settings.confirmDeviceLogout",
                        "Sign Out Device",
                      )
                    : t("dashboard.settings.confirmLogout", "Confirm Logout")}
                </ModalTitle>
                <CloseButton
                  onClick={() => {
                    setShowLogoutModal(false);
                    setDevicePendingLogout(null);
                  }}
                >
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <p>
                  {devicePendingLogout
                    ? t(
                        "dashboard.settings.deviceLogoutConfirmation",
                        "Sign out {{device}} from the Cymasphere app? That device will need to sign in again.",
                        { device: devicePendingLogout.name },
                      )
                    : t(
                        "dashboard.settings.logoutConfirmation",
                        "Sign out from all other Cymasphere app devices? Each one will need to sign in again.",
                      )}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => {
                    setShowLogoutModal(false);
                    setDevicePendingLogout(null);
                  }}
                  style={{
                    marginRight: "0.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button
                  onClick={confirmLogout}
                  disabled={Boolean(revokingDeviceUserAgent)}
                >
                  {t("dashboard.settings.signOut", "Sign Out")}
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
              style={{ maxWidth: "500px" }}
            >
              <ModalHeader>
                <ModalTitle>{confirmationTitle}</ModalTitle>
                <CloseButton onClick={handleModalClose}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody
                style={{ textAlign: "center", padding: "2rem 1.5rem" }}
              >
                <div
                  style={{
                    fontSize: "4rem",
                    marginBottom: "1rem",
                    color: "var(--primary)",
                  }}
                >
                  {renderConfirmationIcon()}
                </div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "var(--text)",
                    marginBottom: "1.5rem",
                  }}
                >
                  {confirmationMessage}
                </p>
              </ModalBody>
              <ModalFooter style={{ justifyContent: "center" }}>
                <Button onClick={handleModalClose}>
                  {t("dashboard.main.gotIt", "Got It")}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </SettingsContainer>
  );
}

/**
 * @brief Settings route entry: SEO wrapper and remount on navigation.
 * @returns Fragment with NextSEO and settings content.
 */
export default function SettingsPage() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      <NextSEO
        title={`${t("dashboard.settings.title", "Settings")} - Cymasphere`}
        description={t(
          "dashboard.settings.seoDescription",
          "Account settings, devices, email, and profile for Cymasphere.",
        )}
        canonical="/settings"
        noindex={true}
      />
      <Settings key={pathname} />
    </>
  );
}
