import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaGoogle, FaArrowLeft, FaSpinner } from 'react-icons/fa';

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--background);
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 50%, rgba(108, 99, 255, 0.15), transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(78, 205, 196, 0.15), transparent 50%),
                radial-gradient(circle at 40% 70%, rgba(108, 99, 255, 0.1), transparent 40%);
    z-index: 0;
  }
`;

const BackButton = styled(Link)`
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
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
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
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
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
  
  &:before, &:after {
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

const formVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.03,
    boxShadow: "0 5px 15px rgba(108, 99, 255, 0.4)",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.98
  }
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleSignIn } = useAuth();
  const navigate = useNavigate();
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Reset any previous errors
    setError('');
    
    try {
      setLoading(true);
      await login(email, password);
      console.log('User logged in successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error codes
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError(`Failed to log in: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }
  
  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      
      await googleSignIn();
      console.log('Google login successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      setError(`Failed to sign in with Google: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContainer>
      <BackButton to="/">
        <FaArrowLeft /> Back to Home
      </BackButton>
      
      <FormCard
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
            <Link to="/reset-password">Forgot password?</Link>
          </ForgotPassword>
          
          <Button 
            type="submit"
            disabled={loading}
          >
            <ButtonContent>
              {loading ? (
                <>
                  <SpinnerIcon /> Logging in...
                </>
              ) : (
                'Log In'
              )}
            </ButtonContent>
          </Button>
        </Form>
        
        <OrDivider>
          <span>or</span>
        </OrDivider>
        
        <GoogleButton 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <ButtonContent>
            {loading ? (
              <>
                <SpinnerIcon /> Connecting...
              </>
            ) : (
              <>
                <FaGoogle /> Sign in with Google
              </>
            )}
          </ButtonContent>
        </GoogleButton>
        
        <LinkText>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </LinkText>
      </FormCard>
    </AuthContainer>
  );
}

export default Login; 