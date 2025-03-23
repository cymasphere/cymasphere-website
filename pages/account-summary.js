import { useEffect, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import NextSEO from '../src/components/NextSEO';
import { useAuth } from '../src/contexts/NextAuthContext';
import { useRouter } from 'next/router';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

// Styled components for the account summary page
const Container = styled.div`
  max-width: 800px;
  margin: 6rem auto 2rem;
  padding: 0 1rem;
`;

const Card = styled.div`
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h3`
  color: var(--text);
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const DetailItem = styled.div`
  margin-bottom: 0.5rem;
`;

const DetailLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  font-weight: 500;
`;

const UsageBar = styled.div`
  height: 8px;
  background-color: var(--input-bg);
  border-radius: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
  
  &::before {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$percent}%;
    background-color: var(--primary);
    border-radius: 4px;
  }
`;

export default function AccountSummary({ initialData }) {
  const auth = useAuth() || {};
  const { currentUser } = auth;
  const router = useRouter();
  const [userData, setUserData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);

  // Client-side protection
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Refresh data client-side if needed
  useEffect(() => {
    if (!initialData && currentUser) {
      fetch('/api/user-data')
        .then(res => res.json())
        .then(data => {
          setUserData(data);
          setLoading(false);
        });
    }
  }, [initialData, currentUser]);

  if (!currentUser || loading) {
    return (
      <Container>
        <Card>
          <CardTitle>Loading account data...</CardTitle>
        </Card>
      </Container>
    );
  }

  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DynamicNextLayout title="Account Summary - CymaSphere">
      <NextSEO 
        title="Account Summary - CymaSphere"
        description="View your CymaSphere account summary and usage details"
        canonical="/account-summary"
        noindex={true} // Private page
      />
      
      <Container>
        <Card>
          <CardTitle>Account Information</CardTitle>
          <DetailsGrid>
            <DetailItem>
              <DetailLabel>Name</DetailLabel>
              <DetailValue>{userData.name}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Email</DetailLabel>
              <DetailValue>{userData.email}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Plan</DetailLabel>
              <DetailValue>{userData.plan}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Last Login</DetailLabel>
              <DetailValue>{formatDate(userData.lastLogin)}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Account Created</DetailLabel>
              <DetailValue>{formatDate(userData.accountCreated)}</DetailValue>
            </DetailItem>
          </DetailsGrid>
        </Card>
        
        <Card>
          <CardTitle>Preferences</CardTitle>
          <DetailsGrid>
            <DetailItem>
              <DetailLabel>Theme</DetailLabel>
              <DetailValue>{userData.preferences.theme}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Notifications</DetailLabel>
              <DetailValue>{userData.preferences.notifications ? 'Enabled' : 'Disabled'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Language</DetailLabel>
              <DetailValue>{userData.preferences.language.toUpperCase()}</DetailValue>
            </DetailItem>
          </DetailsGrid>
        </Card>
        
        <Card>
          <CardTitle>Usage</CardTitle>
          <DetailsGrid>
            <DetailItem>
              <DetailLabel>Projects</DetailLabel>
              <DetailValue>{userData.usage.projects} / 10</DetailValue>
              <UsageBar $percent={userData.usage.projects * 10} />
            </DetailItem>
            <DetailItem>
              <DetailLabel>Storage</DetailLabel>
              <DetailValue>{userData.usage.storage} / 5GB</DetailValue>
              <UsageBar $percent={parseInt(userData.usage.storage) * 20} />
            </DetailItem>
            <DetailItem>
              <DetailLabel>API Calls</DetailLabel>
              <DetailValue>{userData.usage.apiCalls} / 5000</DetailValue>
              <UsageBar $percent={userData.usage.apiCalls / 50} />
            </DetailItem>
          </DetailsGrid>
        </Card>
      </Container>
    </DynamicNextLayout>
  );
}

// This gets called on every request
export async function getServerSideProps(context) {
  // In production, you'd fetch from your actual API endpoint
  // This is just a demonstration of getServerSideProps
  const host = context.req.headers.host || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  try {
    // In a real app, you would likely check for authentication here
    // and redirect if the user is not authenticated
    
    // Try to fetch user data from the API
    const res = await fetch(`${protocol}://${host}/api/user-data`);
    const userData = await res.json();
    
    // Pass data to the page via props
    return { 
      props: { 
        initialData: userData 
      } 
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    // Return empty props if there's an error, and the client will fetch the data
    return { 
      props: { 
        initialData: null 
      } 
    };
  }
} 