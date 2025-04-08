"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";
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
  cursor: pointer;

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

  @media (max-width: 520px) {
    padding: 2rem 1.5rem;
    width: 90%;
  }
`;

const Title = styled(motion.h2)`
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text);
  font-size: 1.4rem;

  span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
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

// Add styled component for name fields container
const NameFieldsContainer = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }

  /* Adjust the FormGroup inside NameFieldsContainer to have no bottom margin */
  & > ${FormGroup} {
    flex: 1;
    margin-bottom: 0;
  }
`;

// Create a separate client component for handling search params
function SearchParamsHandler({
  setRedirectAfterLogin,
  setIsCheckoutComplete,
}: {
  setRedirectAfterLogin: (url: string) => void;
  setIsCheckoutComplete: (value: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams?.get("redirect");
    if (redirect) {
      setRedirectAfterLogin(redirect);
    }

    // Handle checkout complete param
    if (searchParams?.get("checkout_complete") === "true") {
      setIsCheckoutComplete(true);
    }

    // Handle email prefill from checkout
    const email = searchParams?.get("email");
    if (email) {
      // We'll handle this in the parent component
      window.sessionStorage.setItem("prefilled_email", email);
    }
  }, [searchParams, setRedirectAfterLogin, setIsCheckoutComplete]);

  return null;
}

function SignUp() {
  const { signUp, user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState("");
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      // Redirect to dashboard or home
      if (redirectAfterLogin) {
        router.push(redirectAfterLogin);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, redirectAfterLogin]);

  // Handle email prefill from checkout (stored in sessionStorage by SearchParamsHandler)
  useEffect(() => {
    const email = window.sessionStorage.getItem("prefilled_email");
    if (email) {
      setFormData((prev) => ({
        ...prev,
        email,
      }));
      // Clear it after use
      window.sessionStorage.removeItem("prefilled_email");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      return setError(
        "You must agree to the Terms of Service and Privacy Policy"
      );
    }

    try {
      setLoadingState(true);
      // Combine first and last name for the API call
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const result = await signUp(fullName, formData.email, formData.password);

      if (result.error) {
        console.error("Sign up error:", result.error.message);
        setError(result.error.message);
      } else {
        // Show success message
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      // Handle specific errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <AuthContainer>
      <Suspense fallback={null}>
        <SearchParamsHandler
          setRedirectAfterLogin={setRedirectAfterLogin}
          setIsCheckoutComplete={setIsCheckoutComplete}
        />
      </Suspense>

      <Link href="/" passHref legacyBehavior={false}>
        <BackButton>
          <FaArrowLeft /> Back to Home
        </BackButton>
      </Link>

      <FormCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CymasphereLogo
            size="40px"
            fontSize="1.8rem"
            showText={true}
            href={""}
            onClick={() => {}}
            className={""}
          />
        </div>

        <Title>
          Create an <span>account</span>
        </Title>

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
                Hi {formData.firstName}! A verification email has been sent to{" "}
                {formData.email}.
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
          <NameFieldsContainer>
            <FormGroup>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First Name"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last Name"
              />
            </FormGroup>
          </NameFieldsContainer>

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly={isCheckoutComplete}
              placeholder="Enter your email address"
              style={
                isCheckoutComplete
                  ? {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      cursor: "not-allowed",
                    }
                  : {}
              }
            />
            {isCheckoutComplete && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                }}
              >
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
              placeholder="Create a secure password"
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
              placeholder="Confirm your password"
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
            disabled={loadingState}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ButtonContent>
              {loadingState ? (
                <>
                  <div style={{ marginRight: "10px" }}>
                    <LoadingComponent size="20px" />
                  </div>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </ButtonContent>
          </Button>
        </Form>

        <LinkText>
          Already have an account? <Link href="/login">Log in</Link>
        </LinkText>
      </FormCard>
    </AuthContainer>
  );
}

export default SignUp;
