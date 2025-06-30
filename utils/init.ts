// Initialize email campaign scheduler on server startup
// This file runs when imported to start the internal scheduler

if (typeof window === 'undefined') {
  // Only run on server side
  import('./scheduler').then(({ emailScheduler }) => {
    console.log('📅 Email Campaign Scheduler initialized:', emailScheduler.getStatus());
  }).catch((error) => {
    console.error('❌ Failed to initialize email scheduler:', error);
  });
} 