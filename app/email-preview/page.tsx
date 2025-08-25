'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface EmailPreviewProps {
  campaignId?: string;
}

export default function EmailPreviewPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('c');
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setError('No campaign ID provided');
      setLoading(false);
      return;
    }

    const fetchEmailPreview = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/email-campaigns/preview?c=${campaignId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch email preview: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.html) {
          setEmailHtml(data.html);
        } else {
          throw new Error(data.error || 'Failed to generate email preview');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailPreview();
  }, [campaignId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f7f7f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>📧</div>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading email preview...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f7f7f7'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>Email Preview Error</div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>{error}</div>
          <a 
            href="/" 
            style={{ 
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#6c63ff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#f7f7f7', 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Email Preview</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
              Campaign ID: {campaignId}
            </p>
          </div>
          <a 
            href="/" 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#6c63ff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            ← Back
          </a>
        </div>

        {/* Email Content */}
        <div 
          dangerouslySetInnerHTML={{ __html: emailHtml }}
          style={{ 
            padding: '0',
            backgroundColor: 'white'
          }}
        />
      </div>
    </div>
  );
}
