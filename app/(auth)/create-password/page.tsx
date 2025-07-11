"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import EnergyBall from "@/components/common/EnergyBall";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import LoadingComponent from "@/components/common/LoadingComponent";

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--background);
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 30% 50%,
        rgba(108, 99, 255, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(78, 205, 196, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 70%,
        rgba(108, 99, 255, 0.1),
        transparent 40%
      );
    z-index: 0;
  }
`;

const BackButton = styled.div`
  position: fixed;
  top: 25px;
  left: 30px;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1rem;
  z-index: 10;
  transition: all 0.3s ease;

  &:hover {
    color: var(--text);
  }

  svg {
    margin-right: 8px;
  }

  @media (max-width: 768px) {
    top: 20px;
    left: 20px;
  }
`;

const FormCard = styled(motion.div)`
  max-width: 450px;
  width: 100%;
  padding: 2.5rem;
  border-radius: 12px;
  background: rgba(25, 23, 36, 0.85);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin: 0 20px;

  &:before {
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(
      135deg,
      rgba(108, 99, 255, 0.5) 0%,
      rgba(108, 99, 255, 0) 50%,
      rgba(78, 205, 196, 0.5) 100%
    );
    border-radius: 18px;
    z-index: -1;
    opacity: 0.4;
    filter: blur(8px);
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const Title = styled(motion.h2)`
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--text);
  font-size: 2rem;

  span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const Description = styled(motion.p)`
  margin-bottom: 2rem;
  color: var(--text-secondary);
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text);
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  background-color: rgba(15, 14, 23, 0.6);
  color: var(--text);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 38px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--text);
  }
`;

const Button = styled(motion.button)`
  padding: 0.85rem;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
    transform: translateY(-2px);
  }

  &:disabled {
    background: rgba(108, 99, 255, 0.5);
    cursor: not-allowed;
    transform: translateY(0);
    box-shadow: none;
  }
`;

const Message = styled(motion.div)`
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const ErrorMessage = styled(Message)`
  color: var(--danger);
  background-color: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
`;

const SuccessMessage = styled(Message)`
  color: var(--success);
  background-color: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.2);
`;

const LinkText = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);

  a {
    color: var(--primary);
    text-decoration: none;

    &:hover {
      color: var(--accent);
      text-decoration: underline;
    }
  }
`;

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

const customStyles = `
  /* Override any possible styling for the SPHERE text */
  .sphere, span:contains("SPHERE"), [class*="sphere"] {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    background: none !important;
    background-clip: unset !important;
    -webkit-background-clip: unset !important;
    text-fill-color: #FFFFFF !important;
    opacity: 1 !important;
    font-weight: 700 !important;
  }
`;

// Custom logo component specifically for the create password page
const CustomLogo = () => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ marginRight: "10px" }}>
        <EnergyBall size="48px" />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          textTransform: "uppercase",
          letterSpacing: "2.5px",
          fontSize: "1.8rem",
          fontWeight: 700,
          fontFamily: "var(--font-montserrat), sans-serif",
        }}
      >
        <span
          style={{
            background: "linear-gradient(90deg, var(--primary), var(--accent))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CYMA
        </span>
        <span
          style={{
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
          }}
        >
          SPHERE
        </span>
      </div>
    </div>
  );
};

function CreatePassword() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const { supabase, session, user } = useAuth();

  // Initialize translations
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  // Check for URL error parameters on component mount
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description");

    if (errorParam) {
      let errorMessage = "";

      if (errorCode === "otp_expired") {
        errorMessage = t(
          "createPassword.errors.linkExpired",
          "The password reset link has expired. Please request a new one."
        );
      } else if (errorCode === "access_denied") {
        errorMessage = t(
          "createPassword.errors.accessDenied",
          "The password reset link is invalid or has expired. Please request a new one."
        );
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, " "));
      } else {
        errorMessage = t(
          "createPassword.errors.invalidLink",
          "The password reset link is invalid. Please request a new one."
        );
      }

      setUrlError(errorMessage);
    }
  }, [searchParams, t]);

  // Wait for translations to load
  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Monitor session state for password recovery
  useEffect(() => {
    console.log("Create password page - Auth state:", {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
    });

    // Session is ready when we have a session (PASSWORD_RECOVERY event establishes this)
    if (session) {
      setSessionReady(true);
      console.log("✅ Session ready for password update");
    } else {
      setSessionReady(false);
      console.log("⏳ Waiting for password recovery session...");
    }
  }, [session, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset state
    setError("");
    setMessage("");

    // Check if there are URL errors (invalid/expired link)
    if (urlError) {
      setError(
        t(
          "createPassword.errors.invalidLink",
          "Cannot update password with invalid link. Please request a new password reset."
        )
      );
      return;
    }

    // Check if we have a valid session for password recovery
    if (!session) {
      setError(
        t(
          "createPassword.errors.noSession",
          "No active password recovery session. Please use the link from your password reset email."
        )
      );
      return;
    }

    // Only validate that passwords match
    if (password !== confirmPassword) {
      setError(
        t("createPassword.errors.passwordMismatch", "Passwords do not match")
      );
      return;
    }

    // Remove password strength and length validation

    setLoading(true);

    try {
      console.log("Attempting to update password...");
      console.log("Current session:", session ? "exists" : "null");
      console.log("Current user:", user ? user.email : "null");

      // Use updateUser to set the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      console.log("Password update result:", updateError);

      if (updateError) {
        console.error("Password reset error:", updateError);

        // Handle specific errors
        if (
          updateError.message?.includes("token") ||
          updateError.message?.includes("session") ||
          updateError.message?.includes("expired") ||
          updateError.message?.includes("invalid")
        ) {
          setError(
            t(
              "createPassword.errors.invalidSession",
              "Invalid or expired session. Please request a new password reset."
            )
          );
        } else {
          setError(
            updateError.message ||
              t(
                "createPassword.errors.generic",
                "Failed to reset password. Please try again."
              )
          );
        }
      } else {
        // Success
        console.log("Password updated successfully");
        setMessage(
          t(
            "createPassword.success",
            "Your password has been successfully reset!"
          )
        );
        // Clear form
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(
        t(
          "createPassword.errors.generic",
          "An unexpected error occurred. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // If translations are still loading, show loading component
  if (!translationsLoaded) {
    return (
      <AuthContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <LoadingComponent text={t("common.loading", "Loading...")} />
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Link href="/login" legacyBehavior>
        <BackButton>
          <FaArrowLeft /> {t("createPassword.backToLogin", "Back to Login")}
        </BackButton>
      </Link>

      <FormCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <LogoContainer>
          <Link href="/">
            <CustomLogo />
          </Link>
        </LogoContainer>

        <Title
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {t("createPassword.title", "Set New Password")}
        </Title>

        {/* Show URL error if present */}
        {urlError ? (
          <>
            <ErrorMessage
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {urlError}
            </ErrorMessage>

            <Description
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {t(
                "createPassword.requestNewLink",
                "Please request a new password reset link."
              )}
              <br />
              <Link href="/reset-password">
                {t("createPassword.requestHere", "Click here to request one.")}
              </Link>
            </Description>
          </>
        ) : (
          <Description
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t(
              "createPassword.description",
              "Create a new password for your account. For security, please choose a strong password that you don't use elsewhere."
            )}
          </Description>
        )}

        {error && (
          <ErrorMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </ErrorMessage>
        )}

        {message && (
          <SuccessMessage
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {message}
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <Link href="/login" legacyBehavior>
                <Button
                  as="a"
                  style={{
                    display: "inline-block",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  {t("createPassword.proceedToLogin", "Proceed to Login")}
                </Button>
              </Link>
            </div>
          </SuccessMessage>
        )}

        {!message && !urlError && (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="password">
                {t("createPassword.newPasswordLabel", "New Password")}
              </Label>
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t(
                  "createPassword.newPasswordPlaceholder",
                  "Enter your new password"
                )}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">
                {t("createPassword.confirmPasswordLabel", "Confirm Password")}
              </Label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t(
                  "createPassword.confirmPasswordPlaceholder",
                  "Confirm your new password"
                )}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </FormGroup>

            <Button
              type="submit"
              disabled={loading || !sessionReady}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              {loading
                ? t("createPassword.updating", "Updating...")
                : !sessionReady
                ? t(
                    "createPassword.waitingForSession",
                    "Waiting for session..."
                  )
                : t("createPassword.setPassword", "Set New Password")}
            </Button>
          </Form>
        )}

        {!message && (
          <LinkText>
            {t("createPassword.rememberPassword", "Remember your password?")}{" "}
            <Link href="/login">{t("createPassword.login", "Log in")}</Link>
          </LinkText>
        )}
      </FormCard>
    </AuthContainer>
  );
}

export default CreatePassword;
