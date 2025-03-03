const env = 'Clinic';

export const environment = {
    production: true,
    firebaseConfig: {
        apiKey: "AIzaSyAs1r47V9IasYZQ-lNcxPeWMPvHh-YYeSg",
        authDomain: "dental-app-new.firebaseapp.com",
        projectId: "dental-app-new",
        storageBucket: "dental-app-new.firebasestorage.app",
        messagingSenderId: "653467727331",
        appId: "1:653467727331:web:dd3aef59a5fc1034161cd6",
        measurementId: "G-R2V3XSZ3K7"
    },
    collectionPaths: {
        appointments: `${env}/appointmentsDoc/appointments`,
        patients: `${env}/patientsDoc/patients`,
        treatments: `${env}/treatmentsDoc/treatments`
    }
};