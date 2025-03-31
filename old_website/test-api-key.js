// Simple script to test Firebase API key with the REST API
const https = require('https');

// Firebase API key to test
const API_KEY = 'AIzaSyBQUO30Ma7VbkJV-A0WfIVo8J0YVnsIQzo';

// Construct the URL to test with Firebase Auth REST API
const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

// Prepare request data (minimal valid request for testing)
const data = JSON.stringify({
  email: 'test@example.com',
  password: 'password123',
  returnSecureToken: true
});

// Configure the request
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

// Send the request
console.log(`Testing Firebase API key: ${API_KEY}`);
console.log(`Sending request to: ${url}`);

const req = https.request(url, options, (res) => {
  console.log(`Response status code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      // Try to parse the response as JSON
      const jsonResponse = JSON.parse(responseData);
      
      if (res.statusCode === 200) {
        console.log('✅ API key is valid! Authentication works.');
      } else {
        console.log('❌ API key test failed with response:');
        console.log(JSON.stringify(jsonResponse, null, 2));
        
        if (jsonResponse.error) {
          console.log('\nError details:');
          console.log(`- Code: ${jsonResponse.error.code}`);
          console.log(`- Message: ${jsonResponse.error.message}`);
          
          if (jsonResponse.error.message === 'API key not valid. Please pass a valid API key.') {
            console.log('\n⚠️ The API key is invalid or restricted.');
            console.log('Please check:');
            console.log('1. The API key is correct');
            console.log('2. The Firebase project is properly set up');
            console.log('3. There are no API restrictions in the Firebase Console');
          }
        }
      }
    } catch (e) {
      console.log('❌ Error parsing response:');
      console.log(responseData);
      console.log(e);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error making request:');
  console.log(error);
});

// Send the request data
req.write(data);
req.end(); 