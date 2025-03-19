import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaLock, FaCreditCard, FaCalendarAlt, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';

const PageContainer = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: var(--background);
  padding: 0;
  
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

const HeaderNav = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const LogoContainer = styled.div`
  z-index: 1;
  display: flex;
  flex-direction: column;
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

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1rem;
  z-index: 10;
  padding: 10px 0;
  margin-top: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--text);
  }
  
  svg {
    margin-right: 8px;
  }
`;

const MainContent = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 80px;
  z-index: 5;
  position: relative;
`;

const CheckoutContainer = styled.div`
  max-width: 700px;
  width: 100%;
  padding: 25px 30px;
  background: rgba(25, 23, 36, 0.85);
  border-radius: 12px;
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

const Header = styled.div`
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 5px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const OrderSummary = styled.div`
  background: rgba(30, 28, 42, 0.5);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  color: var(--text-secondary);
`;

const Value = styled.span`
  color: var(--text);
  font-weight: 600;
`;

const Total = styled(OrderItem)`
  font-weight: 600;
  padding-top: 8px;
  margin-top: 3px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
  
  label {
    font-size: 1.05rem;
  }
  
  div {
    font-size: 1.1rem;
    color: var(--primary);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: rgba(15, 14, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.95rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const CardNumberField = styled.div`
  flex: 10;
`;

const CardExpiryField = styled.div`
  flex: 2;
`;

const CardCvcField = styled.div`
  flex: 1.5;
`;

const InputWithIcon = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  margin-top: 5px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(108, 99, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.75rem;
`;

// Replace with an image component
const StripeLogo = styled.img`
  height: 22px;
  width: auto;
  object-fit: contain;
`;

const StripeInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.75rem;
`;

// Function to parse query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const MockCheckout = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    name: '',
    email: '',
  });
  
  // Parse the query parameters to get the plan details
  const planName = query.get('plan') || 'Cymasphere Pro';
  const billingPeriod = query.get('billing') || 'monthly';
  const price = query.get('price') || '$19.99';
  
  // Format the price based on billing period
  const formatPrice = () => {
    switch(billingPeriod) {
      case 'yearly':
        return `$${price}/year`;
      case 'lifetime':
        return `$${price} (one-time)`;
      default:
        return `$${price}/month`;
    }
  };
  
  // Format credit card number with spaces every 4 digits
  const formatCardNumber = (value) => {
    // Remove all non-numeric characters
    const v = value.replace(/\D/g, '');
    const parts = [];
    
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    
    return parts.join(' ');
  };
  
  // Format expiration date as MM/YY
  const formatExpiryDate = (value) => {
    // Remove all non-numeric characters
    const v = value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (v.length > 0) {
      // Ensure month is within 1-12 range
      let month = v.substring(0, 2);
      if (month.length === 1 && parseInt(month) > 1) {
        month = '0' + month;
      } else if (month.length === 2 && (parseInt(month) < 1 || parseInt(month) > 12)) {
        month = '12';
      }
      
      if (v.length > 2) {
        return `${month}/${v.substring(2, 4)}`;
      }
      return month;
    }
    
    return v;
  };
  
  // Format CVC to only accept numbers
  const formatCVC = (value) => {
    // Remove all non-numeric characters
    return value.replace(/\D/g, '').substring(0, 3);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      setFormData({
        ...formData,
        [name]: formatCardNumber(value)
      });
    } else if (name === 'cardExpiry') {
      setFormData({
        ...formData,
        [name]: formatExpiryDate(value)
      });
    } else if (name === 'cardCvc') {
      setFormData({
        ...formData,
        [name]: formatCVC(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Add a function to handle scrolling to pricing section
  const handleBackToPricing = (e) => {
    e.preventDefault();
    navigate('/');
    // Use setTimeout to ensure navigation completes before scrolling
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate payment processing
    setTimeout(() => {
      // Check if using a test card number for failure (4000 0000 0000 0002 is a test decline card)
      if (formData.cardNumber.replace(/\s/g, '') === '4000000000000002') {
        // Redirect to an error page or stay on checkout with an error message
        navigate(`/checkout-success?error=payment_failed&session_id=failed_${Date.now()}`);
      } else {
        // Redirect to success page
        navigate(`/checkout-success?session_id=mock_session_${Date.now()}`);
      }
    }, 1500);
  };
  
  return (
    <PageContainer>
      <HeaderNav>
        <HeaderContent>
          <LogoContainer>
            <Logo to="/">
              <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
              <LogoText>
                <span>CYMA</span>SPHERE
              </LogoText>
            </Logo>
            <BackButton to="/" onClick={handleBackToPricing}>
              <FaArrowLeft /> Back to Pricing
            </BackButton>
          </LogoContainer>
        </HeaderContent>
      </HeaderNav>
      
      <MainContent>
        <CheckoutContainer>
          <Header>
            <Title>Secure Checkout</Title>
            <Subtitle><FaLock /> SSL Encrypted Payment</Subtitle>
          </Header>
          
          <OrderSummary>
            <OrderItem>
              <Label>Plan</Label>
              <Value>{planName}</Value>
            </OrderItem>
            <OrderItem>
              <Label>Billing</Label>
              <Value>{billingPeriod === 'lifetime' ? 'One-time payment' : 
                billingPeriod === 'yearly' ? 'Yearly subscription' : 'Monthly subscription'}</Value>
            </OrderItem>
            <Total>
              <Label>Total</Label>
              <Value>{formatPrice()}</Value>
            </Total>
          </OrderSummary>
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <InputLabel>Email</InputLabel>
              <Input 
                type="email" 
                name="email" 
                placeholder="your.email@example.com" 
                required 
                value={formData.email}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <InputLabel>Cardholder Name</InputLabel>
              <Input 
                type="text" 
                name="name" 
                placeholder="Name on card" 
                required
                value={formData.name}
                onChange={handleChange}
              />
            </FormGroup>
            
            <InputRow>
              <CardNumberField>
                <InputLabel>Card Number</InputLabel>
                <Input 
                  type="text" 
                  name="cardNumber" 
                  placeholder="4242 4242 4242 4242" 
                  required
                  value={formData.cardNumber}
                  onChange={handleChange}
                  maxLength={19}
                />
              </CardNumberField>
              
              <CardExpiryField>
                <InputLabel>Expiry Date</InputLabel>
                <Input 
                  type="text" 
                  name="cardExpiry" 
                  placeholder="MM/YY" 
                  required
                  value={formData.cardExpiry}
                  onChange={handleChange}
                  maxLength={5}
                />
              </CardExpiryField>
              
              <CardCvcField>
                <InputLabel>CVC</InputLabel>
                <Input 
                  type="text" 
                  name="cardCvc" 
                  placeholder="123" 
                  required
                  value={formData.cardCvc}
                  onChange={handleChange}
                  maxLength={3}
                />
              </CardCvcField>
            </InputRow>
            
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Pay Now'} <FaLock size={14} />
            </SubmitButton>
            
            <SecurityNote>
              <FaLock /> This is a secure, encrypted payment. No actual payment will be processed in development mode.
            </SecurityNote>
            
            <StripeInfo>
              <span>Powered by</span>
              <StripeLogo src="/stripe.png" alt="Stripe" />
              <span>— Secure payment processing</span>
            </StripeInfo>
          </Form>
        </CheckoutContainer>
      </MainContent>
    </PageContainer>
  );
}

export default MockCheckout; 