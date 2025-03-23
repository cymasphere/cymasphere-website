import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/NextAuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaGoogle, FaArrowLeft, FaSpinner } from "react-icons/fa";

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
  margin-bottom: 1.5rem;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.8rem;

  &:hover {
    text-decoration: none;
  }
`;

const LogoImage = styled.img`
  height: 40px;
  width: 40px;
  margin-right: 10px;
  transition: transform 0.3s ease;

  ${Logo}:hover & {
    transform: rotate(20deg);
  }
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;

  span {
    font-family: "Montserrat", sans-serif;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.2rem;
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

const ErrorMessage = styled(motion.div)`
  color: var(--danger);
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  background-color: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
`;

const GoogleButton = styled(Button)`
  background: transparent;
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;

  &:before,
  &:after {
    content: "";
    flex-grow: 1;
    background-color: rgba(255, 255, 255, 0.1);
    height: 1px;
  }

  span {
    margin: 0 10px;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
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

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const SpinnerIcon = styled(FaSpinner)`
  animation: rotate 1s linear infinite;

  @keyframes rotate {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const auth = useAuth() || {};
  const { signup, googleSignIn } = auth;
  const router = useRouter();

  // Force reset loading state if component unmounts
  useEffect(() => {
    return () => {
      if (loading) {
        console.log("Component unmounting while loading, forcing reset");
        // This is for cleanup if the component unmounts while loading
        setLoading(false);
      }
    };
  }, [loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setPasswordConfirm(value);
    } else if (name === "name") {
      setUsername(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset any previous errors and success state
    setError("");

    // Validate form
    if (password !== passwordConfirm) {
      return setError("Passwords do not match");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    // Initialize the hardTimeoutId at the top
    let hardTimeoutId;

    // HARD TIMEOUT: No matter what, loading will stop after 8 seconds max
    setLoading(true);
    hardTimeoutId = setTimeout(() => {
      console.log("Hard timeout reached, forcing loading state to false");
      setLoading(false);
    }, 8000);

    try {
      setError("");
      setLoading(true);
      
      if (!signup) {
        throw new Error('Authentication is not initialized. Please try again later.');
      }
      
      await signup(email, password, username);
      router.push("/dashboard");
    } catch (err) {
      // Clear hard timeout since operation failed
      if (hardTimeoutId) clearTimeout(hardTimeoutId);

      console.error("Sign up error:", err);

      // IMPORTANT: Reset loading state immediately
      setLoading(false);

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
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      
      if (!googleSignIn) {
        throw new Error('Google authentication is not initialized. Please try again later.');
      }
      
      await googleSignIn();
      router.push("/dashboard");
    } catch (err) {
      // Clear hard timeout since operation failed
      if (hardTimeoutId) clearTimeout(hardTimeoutId);

      console.error("Google sign in error:", err);

      // IMPORTANT: Reset loading state immediately
      setLoading(false);

      // Set error message
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
        className="form-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <LogoContainer>
          <Logo to="/">
            <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
            <LogoText>
              <span>CYMA</span>SPHERE
            </LogoText>
          </Logo>
        </LogoContainer>

        <Subtitle>Create an account</Subtitle>

        {/* Display success message if signup was successful */}
        {success && (
          <SuccessMessage>
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
              <br />
              <br />
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Continue to Dashboard
              </button>
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
            />
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

          <Button type="submit" disabled={loading}>
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
          Already have an account? <Link to="/login">Log in</Link>
        </LinkText>
      </FormCard>
    </AuthContainer>
  );
}

export default SignUp;
