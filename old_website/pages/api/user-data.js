// Next.js API route example: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  // This would typically fetch from a real database
  const userData = {
    name: 'Demo User',
    email: 'demo@example.com',
    plan: 'Pro',
    lastLogin: new Date().toISOString(),
    accountCreated: '2023-01-15T00:00:00.000Z',
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    },
    usage: {
      projects: 5,
      storage: '2.3GB',
      apiCalls: 1250
    }
  };

  // Add some artificial delay to simulate a real API call
  setTimeout(() => {
    res.status(200).json(userData);
  }, 500);
} 