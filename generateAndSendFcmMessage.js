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
        return response.data.access_token;
    } else {
        throw new Error(`Error fetching token: ${response.status} ${response.statusText}`);
    }
}

// Function to send the FCM message using the generated access token
async function sendFcmMessage(accessToken) {
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`;

    // Define the message payload in the format required by the FCM v1 API
    const messagePayload = {
        message: {
            token: config.deviceToken, // Use the device token from config.js
            notification: {
                title: 'Hello',
                body: 'Have a nice week',
            },
        },
    };

    try {
        // Make the POST request to FCM
        const response = await axios.post(fcmUrl, messagePayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Access token as a Bearer token
                'Content-Type': 'application/json', // Ensure the content type is JSON
            },
        });

        // Check if the message was sent successfully
        if (response.status === 200) {
            console.log('Message sent successfully:', response.data);
        } else {
            console.error('Error sending message:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Main function to link generating token and sending the message
async function generateTokenAndSendMessage() {
    try {
        const accessToken = await getAccessToken(); // Step 1: Generate the access token
        await sendFcmMessage(accessToken);          // Step 2: Use the access token to send the FCM message
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

// Run the function
generateTokenAndSendMessage();
