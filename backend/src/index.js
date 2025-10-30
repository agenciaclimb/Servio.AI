const express = require('express');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// IMPORTANT: Replace with your actual service account key path or environment variable
// For local development, you might use a service account key file.
// For Cloud Run, Firebase Admin SDK will automatically pick up credentials from the environment.
// const serviceAccount = require('./path/to/your/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Placeholder for Cloud Run environment
admin.initializeApp();

const db = admin.firestore();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Basic "Hello World" endpoint
app.get('/', (req, res) => {
  res.status(200).send('Backend API is running!');
});

// Endpoint to get all users from Firestore
app.get('/users', async (req, res) => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    const users = [];
    snapshot.forEach(doc => {
      users.push(doc.data());
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error fetching users');
  }
});

// Endpoint to create a new user in Firestore (for testing purposes)
app.post('/users', async (req, res) => {
  try {
    const { email, name, type } = req.body;
    if (!email || !name || !type) {
      return res.status(400).send('Missing required fields: email, name, type');
    }

    const newUserRef = db.collection('users').doc(email);
    await newUserRef.set({
      email,
      name,
      type,
      memberSince: new Date().toISOString(),
      status: 'ativo',
      bio: '',
      location: ''
    });
    res.status(201).send('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).send('Error creating user');
  }
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});