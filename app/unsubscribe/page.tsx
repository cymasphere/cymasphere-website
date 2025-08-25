'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface UnsubscribeResponse {
  success: boolean;
  message: string;
  email?: string;
  status?: string;
}

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [response, setResponse] = useState<UnsubscribeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setError('No email address provided');
      return;
    }

    // Auto-unsubscribe when page loads
    handleUnsubscribe();
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResponse(data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!email) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, action: 'resubscribe' }),
      });

      const data = await response.json();
      setResponse(data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resubscribe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
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
          <div style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>Invalid Unsubscribe Link</div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            No email address provided. Please use the unsubscribe link from your email.
          </div>
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
        maxWidth: '600px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '30px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#333' }}>Email Preferences</h1>
          <p style={{ margin: '12px 0 0 0', color: '#666', fontSize: '16px' }}>
            Manage your email subscription for: <strong>{email}</strong>
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '18px', color: '#666' }}>Processing...</div>
            </div>
          )}

          {error && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              backgroundColor: '#fee',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
              <div style={{ fontSize: '16px', color: '#c33' }}>{error}</div>
            </div>
          )}

          {response && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              backgroundColor: response.success ? '#efe' : '#fee',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '16px' }}>
                {response.success ? '✅' : '❌'}
              </div>
              <div style={{ 
                fontSize: '16px', 
                color: response.success ? '#363' : '#c33',
                marginBottom: '8px'
              }}>
                {response.message}
              </div>
              {response.status && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Status: <strong>{response.status}</strong>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            {response?.success && response.status === 'INACTIVE' ? (
              <button
                onClick={handleResubscribe}
                disabled={loading}
                style={{ 
                  padding: '12px 24px',
                  backgroundColor: '#6c63ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Resubscribe to Emails
              </button>
            ) : (
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                style={{ 
                  padding: '12px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Unsubscribe from Emails
              </button>
            )}
          </div>

          {/* Info */}
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.6'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>What happens when you unsubscribe?</h3>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>You'll stop receiving marketing emails from Cymasphere</li>
              <li>Your email will be marked as INACTIVE in our system</li>
              <li>You can resubscribe at any time</li>
              <li>You may still receive important account-related emails</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '20px 30px', 
          backgroundColor: '#f8f9fa', 
          borderTop: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <a 
            href="/" 
            style={{ 
              color: '#6c63ff', 
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Return to Cymasphere
          </a>
        </div>
      </div>
    </div>
  );
}
