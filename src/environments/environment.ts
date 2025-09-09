const env = 'Clinic';
const organizationId = '44fad3c4-54e2-461d-b10d-4336a5980746';

export const environment = {
    production: true,
    firebaseConfig: {
        apiKey: "AIzaSyCXnwkYCCr1_3oMytKqI2DP0iKltbEhdIo",
        authDomain: "dent-craft.firebaseapp.com",
        projectId: "dent-craft",
        storageBucket: "dent-craft.firebasestorage.app",
        messagingSenderId: "1035983595123",
        appId: "1:1035983595123:web:52a43aec8436466ec56c06"
    },
    organizationId,
    collectionPaths: {
        appointments: 'appointments',
        patients: 'patients',
        treatments: 'treatments'
    }
};