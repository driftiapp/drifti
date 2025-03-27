const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drifti-58b5b-default-rtdb.firebaseio.com"
});

// Test Authentication
console.log('Testing Firebase Authentication...');
admin.auth().listUsers(1)
  .then((userRecords) => {
    console.log('✅ Authentication working! User count:', userRecords.users.length);
    console.log('First user:', userRecords.users[0].email);
  })
  .catch((error) => {
    console.error('❌ Authentication failed:', error);
  });

// Test Database URL
console.log('\nChecking Firebase Configuration...');
const app = admin.app();
console.log('Project ID:', app.options.projectId);
console.log('Database URL:', app.options.databaseURL);

// Test Realtime Database
console.log('\nTesting Realtime Database...');
const db = admin.database();
db.ref('test').set({
  timestamp: Date.now(),
  message: 'Test connection'
})
.then(() => {
  console.log('✅ Realtime Database write successful!');
  return db.ref('test').once('value');
})
.then((snapshot) => {
  console.log('✅ Realtime Database read successful!');
  console.log('Data:', snapshot.val());
  return db.ref('test').remove();
})
.then(() => {
  console.log('✅ Realtime Database cleanup successful!');
})
.catch((error) => {
  console.error('❌ Realtime Database failed:', error);
});

// Test Firestore
console.log('\nTesting Firestore...');
const firestore = admin.firestore();
firestore.collection('test').doc('connection').set({
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  message: 'Test connection'
})
.then(() => {
  console.log('✅ Firestore write successful!');
  return firestore.collection('test').doc('connection').get();
})
.then((doc) => {
  console.log('✅ Firestore read successful!');
  console.log('Data:', doc.data());
  return firestore.collection('test').doc('connection').delete();
})
.then(() => {
  console.log('✅ Firestore cleanup successful!');
})
.catch((error) => {
  console.error('❌ Firestore failed:', error);
}); 