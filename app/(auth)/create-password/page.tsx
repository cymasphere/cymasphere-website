"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import EnergyBall from "@/components/common/EnergyBall";

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
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ marginRight: '10px' }}>
        <EnergyBall size="48px" />
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        textTransform: 'uppercase',
        letterSpacing: '2.5px',
        fontSize: '1.8rem',
        fontWeight: 700,
        fontFamily: 'var(--font-montserrat), sans-serif'
      }}>
        <span style={{
          background: 'linear-gradient(90deg, var(--primary), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>CYMA</span>
        <span style={{
          color: '#FFFFFF',
          WebkitTextFillColor: '#FFFFFF'
        }}>SPHERE</span>
      </div>
    </div>
  );
};

function CreatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useAuth();

  // Get hash token from URL
  const [hashToken, setHashToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract hash token from URL
    const hash = window.location.hash;
    if (hash && hash.startsWith('#access_token=')) {
      const tokenSegment = hash.split('&')[0];
      const token = tokenSegment.replace('#access_token=', '');
      setHashToken(token);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset state
    setError("");
    setMessage("");
    
    // Only validate that passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Remove password strength and length validation
    
    setLoading(true);
    
    try {
      // Use updateUser with the current session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });
      
      if (updateError) {
        console.error("Password reset error:", updateError);
        
        // Handle specific errors
        if (updateError.message.includes("token") || updateError.message.includes("session")) {
          setError("Invalid or expired session. Please request a new password reset.");
        } else {
          setError("Failed to reset password. Please try again.");
        }
      } else {
        // Success
        setMessage("Your password has been successfully reset!");
        // Clear form
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Link href="/login" passHref>
        <BackButton>
          <FaArrowLeft /> Back to Login
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
          Set New Password
        </Title>

        <Description
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Create a new password for your account. For security, please choose a strong password that you don't use elsewhere.
        </Description>

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
            <div style={{ marginTop: '10px' }}>
              <Link href="/login" passHref>
                <Button
                  as="a"
                  style={{ 
                    display: 'inline-block', 
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  Proceed to Login
                </Button>
              </Link>
            </div>
          </SuccessMessage>
        )}

        {!message && (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="password">New Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your new password"
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your new password"
              />
              <PasswordToggle 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </FormGroup>

            <Button
              type="submit"
              disabled={loading}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Set New Password
            </Button>
          </Form>
        )}

        {!message && (
          <LinkText>
            Remember your password? <Link href="/login">Log in</Link>
          </LinkText>
        )}
      </FormCard>
    </AuthContainer>
  );
}

export default CreatePassword; 