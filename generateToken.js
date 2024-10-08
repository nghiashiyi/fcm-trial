const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('./config'); // Import the config file

// Use the private key directly from config.js
const privateKey = config.privateKey;

// Function to generate the JWT
async function generateJWT() {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const payload = {
        iss: config.serviceAccountEmail, // Service account email from config
        sub: config.serviceAccountEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // Token expiry time (1 hour)
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
    };

    // Sign the JWT with your private key
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    return token;
}

// Function to get the access token
async function getAccessToken() {
    const jwtToken = await generateJWT();

    // Make the POST request to get the OAuth2 token
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwtToken,
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (response.status === 200) {
        console.log('Access Token:', response.data.access_token);
        console.log('Expires In:', response.data.expires_in, 'seconds');
    } else {
        throw new Error(`Error fetching token: ${response.status} ${response.statusText}`);
    }
}

// Main function to generate and print the access token
async function generateToken() {
    try {
        await getAccessToken(); // Generate the access token and print it
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Run the function
generateToken();
