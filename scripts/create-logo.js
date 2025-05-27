const fs = require('fs');
const path = require('path');

// Read the logo file
const logoPath = path.join(__dirname, '../public/images/cymasphere-logo.png');

try {
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  
  console.log('Original logo size:', logoBuffer.length, 'bytes');
  console.log('Base64 length:', logoBase64.length);
  
  // Create a smaller version by taking a sample
  // For PDF embedding, we'll create a data URL
  const dataUrl = `data:image/png;base64,${logoBase64}`;
  
  // Write to a JavaScript file that can be imported
  const jsContent = `// Auto-generated logo data
export const CYMASPHERE_LOGO = '${dataUrl}';
`;
  
  fs.writeFileSync(path.join(__dirname, '../utils/logo-data.ts'), jsContent);
  console.log('Logo data written to utils/logo-data.ts');
  
  // Also create a truncated version for testing
  const shortBase64 = logoBase64.substring(0, 1000) + '...';
  console.log('Sample base64 (first 1000 chars):', shortBase64);
  
} catch (error) {
  console.error('Error processing logo:', error);
} 