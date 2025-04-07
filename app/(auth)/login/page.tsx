"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";

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

const BackButton = styled.span`
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

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
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

const ForgotPassword = styled.div`
  text-align: right;
  margin-bottom: 1.5rem;

  a {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;

    &:hover {
      color: var(--primary);
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

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth() || {};
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Reset any previous errors
    setError("");

    try {
      setLoading(true);

      // Call signIn and get the result
      const result = await auth.signIn(email, password);

      if (result.error) {
        console.error("Login error:", result.error);

        // Handle specific error codes
        if (result.error.code === "user_not_found") {
          setError("No account found with this email. Please sign up first.");
        } else if (result.error.code === "invalid_credentials") {
          setError("Incorrect password. Please try again.");
        } else if (result.error.code === "email_address_invalid") {
          setError("Invalid email format.");
        } else if (result.error.code === "over_request_rate_limit") {
          setError(
            "Too many failed login attempts. Please try again later or reset your password."
          );
        } else {
          setError(`Failed to log in: ${result.error.message}`);
        }
      } else {
        console.log("User logged in successfully");
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError(
        `Failed to log in: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  // async function handleGoogleSignIn() {
  //   setError("");
  //   try {

  //     setLoading(true);
  //     await auth.googleSignIn();
  //     router.push("/dashboard");
  //   } catch (error) {
  //     console.error("Google sign-in error:", error);
  //     setError(`Failed to sign in with Google: ${error.message}`);
  //     setLoading(false);
  //   }
  // }

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
            href=""
            onClick={() => {}}
            className=""
          />
        </div>

        <Subtitle>Login to access your account</Subtitle>

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
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>

          <ForgotPassword>
            <Link href="/reset-password">Forgot password?</Link>
          </ForgotPassword>

          <Button type="submit" disabled={loading}>
            <ButtonContent>
              {loading ? (
                <>
                  <SpinnerIcon /> Logging in...
                </>
              ) : (
                "Log In"
              )}
            </ButtonContent>
          </Button>
        </Form>

        <LinkText>
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </LinkText>
      </FormCard>
    </AuthContainer>
  );
}

export default Login;
