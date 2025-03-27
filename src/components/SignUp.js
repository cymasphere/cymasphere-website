import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/NextAuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaGoogle, FaArrowLeft, FaSpinner } from "react-icons/fa";
import CymasphereLogo from './common/CymasphereLogo';

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

const BackButton = styled.a`
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
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(135deg, 
      rgba(108, 99, 255, 0.5) 0%, 
      rgba(108, 99, 255, 0) 50%, 
      rgba(78, 205, 196, 0.5) 100%);
    border-radius: 18px;
    z-index: -1;
    opacity: 0.4;
    filter: blur(8px);
  }
  
  @media (max-width: 520px) {
    padding: 2rem 1.5rem;
    width: 90%;
  }
`;

const Title = styled(motion.h2)`
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text);
  font-size: 2rem;
  
  span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
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
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.03);
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 0.9rem;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-top: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.23);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ErrorMessage = styled(motion.div)`
  background-color: rgba(255, 87, 51, 0.1);
  border-left: 3px solid var(--error);
  color: var(--error);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  
  &:before, &:after {
    content: "";
    flex: 1;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  span {
    margin: 0 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
`;

const GoogleButton = styled(motion.button)`
  width: 100%;
  padding: 0.9rem;
  background: transparent;
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.25);
  }
  
  svg {
    margin-right: 10px;
    color: #DB4437;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LinkText = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  
  a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
    
    &:hover {
      color: var(--accent);
      text-decoration: underline;
    }
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Checkbox = styled.input`
  margin-right: 10px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  
  a {
    color: var(--primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SpinnerIcon = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const formVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
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

// Add Success Message styled components here, outside of the component function
const SuccessMessage = styled(motion.div)`
  background-color: rgba(0, 201, 167, 0.1);
  border: 2px solid var(--success);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
`;

const SuccessTitle = styled.h3`
  color: var(--success);
  font-size: 24px;
  margin-bottom: 16px;
`;

const SuccessText = styled.div`
  color: var(--text);
  line-height: 1.6;
  font-size: 16px;
`;

function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const auth = useAuth() || {};
  
  // Force reset loading state if component unmounts
  useEffect(() => {
    return () => {
      if (loading) {
        console.log("Component unmounting while loading, forcing reset");
        setLoading(false);
      }
    };
  }, [loading]);

  // Handle email prefill from checkout
  useEffect(() => {
    if (router.isReady && router.query.email) {
      setFormData(prev => ({
        ...prev,
        email: router.query.email
      }));
    }
  }, [router.isReady, router.query.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset any previous errors
    setError("");
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    
    if (!agreeToTerms) {
      return setError("You must agree to the Terms of Service and Privacy Policy");
    }

    try {
      setLoading(true);
      
      if (!auth.signup) {
        throw new Error('Authentication is not initialized. Please try again later.');
      }
      
      await auth.signup(formData.email, formData.password, formData.name);
      
      // Show success message
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (err) {
      console.error("Sign up error:", err);
      
      // Handle specific errors
      if (err.message.includes("Email already in use")) {
        setError("Email is already in use");
      } else if (err.message.includes("invalid email")) {
        setError("Invalid email address");
      } else if (err.message.includes("weak password")) {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError(`Failed to create an account: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      
      if (!auth.googleSignIn) {
        throw new Error('Google authentication is not initialized. Please try again later.');
      }
      
      await auth.googleSignIn();
      router.push("/dashboard");
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(`Failed to sign in with Google: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <Link href="/" passHref>
        <BackButton>
          <FaArrowLeft /> Back to Home
        </BackButton>
      </Link>

      <FormCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <CymasphereLogo size="40px" fontSize="1.8rem" />
        </div>

        <Title>Create an account</Title>

        {/* Display success message if signup was successful */}
        {success && (
          <SuccessMessage
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SuccessTitle>Account Created Successfully!</SuccessTitle>
            <SuccessText>
              <strong style={{ fontSize: "1.1em", color: "var(--success)" }}>
                A verification email has been sent to {formData.email}.
              </strong>
              <br />
              <br />
              Please check your inbox (and spam folder) and click the link to
              verify your account.
              <br />
              <br />
              <strong>
                You must verify your email before accessing all features.
              </strong>
            </SuccessText>
          </SuccessMessage>
        )}

        {/* Display error message if there was an error */}
        {error && (
          <ErrorMessage
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </ErrorMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Full Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly={!!router.query.checkout_complete}
              style={router.query.checkout_complete ? {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                cursor: 'not-allowed'
              } : {}}
            />
            {router.query.checkout_complete && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-secondary)', 
                marginTop: '0.5rem' 
              }}>
                This email is linked to your purchase and cannot be changed
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={() => setAgreeToTerms(!agreeToTerms)}
              required
            />
            <CheckboxLabel htmlFor="terms">
              I agree to the <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>
            </CheckboxLabel>
          </CheckboxContainer>

          <Button 
            type="submit" 
            disabled={loading}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ButtonContent>
              {loading ? (
                <>
                  <SpinnerIcon /> Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </ButtonContent>
          </Button>
        </Form>

        <OrDivider>
          <span>OR</span>
        </OrDivider>

        <GoogleButton
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <ButtonContent>
            {loading ? (
              <>
                <SpinnerIcon /> Connecting...
              </>
            ) : (
              <>
                <FaGoogle /> Sign up with Google
              </>
            )}
          </ButtonContent>
        </GoogleButton>

        <LinkText>
          Already have an account? <Link href="/login">Log in</Link>
        </LinkText>
      </FormCard>
    </AuthContainer>
  );
}

export default SignUp;
