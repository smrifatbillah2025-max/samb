// auth.js - Centralized Firebase Authentication Manager
// Updated for new Firebase configuration

class AuthManager {
    constructor() {
        this.firebaseConfig = {
            apiKey: "AIzaSyBRAQwYpcEVyQAVFjGF-WuNmGg8-K5pMHE",
            authDomain: "gen-lang-client-0706325479.firebaseapp.com",
            databaseURL: "https://gen-lang-client-0706325479-default-rtdb.firebaseio.com",
            projectId: "gen-lang-client-0706325479",
            storageBucket: "gen-lang-client-0706325479.firebasestorage.app",
            messagingSenderId: "336160005275",
            appId: "1:336160005275:web:6f4aa0912b165c91d6fa3e",
            measurementId: "G-01Z6XHSGP0"
        };
        
        this.app = null;
        this.auth = null;
        this.db = null;
        this.googleProvider = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Dynamically import Firebase modules
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
            const { 
                getAuth, 
                createUserWithEmailAndPassword, 
                signInWithEmailAndPassword, 
                signInWithPopup, 
                GoogleAuthProvider, 
                updateProfile,
                onAuthStateChanged,
                signOut
            } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
            const { 
                getFirestore, 
                doc, 
                setDoc, 
                getDoc 
            } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

            // Initialize Firebase
            this.app = initializeApp(this.firebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            this.googleProvider = new GoogleAuthProvider();

            // Store Firebase functions for use
            this.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
            this.signInWithEmailAndPassword = signInWithEmailAndPassword;
            this.signInWithPopup = signInWithPopup;
            this.updateProfile = updateProfile;
            this.onAuthStateChanged = onAuthStateChanged;
            this.signOut = signOut;
            this.doc = doc;
            this.setDoc = setDoc;
            this.getDoc = getDoc;

            this.initialized = true;
            console.log('AuthManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AuthManager:', error);
            throw error;
        }
    }

    // Check if user is authenticated
    async getCurrentUser() {
        if (!this.initialized) await this.initialize();
        
        return new Promise((resolve) => {
            this.onAuthStateChanged(this.auth, (user) => {
                resolve(user);
            });
        });
    }

    // Sign up with email and password
    async signUp(email, password, userData = {}) {
        if (!this.initialized) await this.initialize();
        
        try {
            const userCredential = await this.createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Update profile if username is provided
            if (userData.username) {
                await this.updateProfile(user, {
                    displayName: userData.username
                });
            }

            // Save additional user data to Firestore
            await this.saveUserData(user, userData);

            return { success: true, user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        if (!this.initialized) await this.initialize();
        
        try {
            const userCredential = await this.signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Update last login
            await this.saveUserData(user, { lastLogin: new Date().toISOString() });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        if (!this.initialized) await this.initialize();
        
        try {
            const result = await this.signInWithPopup(this.auth, this.googleProvider);
            const user = result.user;

            // Save user data
            await this.saveUserData(user, {
                username: user.displayName || user.email.split('@')[0],
                school: 'Not specified',
                lastLogin: new Date().toISOString()
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: this.getGoogleErrorMessage(error) };
        }
    }

    // Sign out
    async logout() {
        if (!this.initialized) await this.initialize();
        
        try {
            await this.signOut(this.auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to sign out. Please try again.' };
        }
    }

    // Save user data to Firestore
    async saveUserData(user, additionalData = {}) {
        if (!this.initialized) await this.initialize();
        
        try {
            const userDocRef = this.doc(this.db, 'users', user.uid);
            const userDoc = await this.getDoc(userDocRef);
            
            const userData = {
                email: user.email,
                lastLogin: new Date().toISOString(),
                ...additionalData
            };
            
            if (!userDoc.exists()) {
                // New user - save all data
                userData.createdAt = new Date().toISOString();
                await this.setDoc(userDocRef, userData);
            } else {
                // Existing user - merge new data
                await this.setDoc(userDocRef, userData, { merge: true });
            }
            
            console.log('User data saved successfully');
        } catch (error) {
            console.error('Error saving user data:', error);
            // Don't throw error for non-critical operation
        }
    }

    // Get user data from Firestore
    async getUserData(user) {
        if (!this.initialized) await this.initialize();
        
        try {
            const userDocRef = this.doc(this.db, 'users', user.uid);
            const userDoc = await this.getDoc(userDocRef);
            
            if (userDoc.exists()) {
                return userDoc.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    // Set up authentication state listener
    onAuthStateChange(callback) {
        if (!this.initialized) {
            this.initialize().then(() => {
                this.onAuthStateChanged(this.auth, callback);
            });
        } else {
            this.onAuthStateChanged(this.auth, callback);
        }
    }

    // Protect routes - redirect to login if not authenticated
    async protectRoute(redirectPath = 'index.html') {
        if (!this.initialized) await this.initialize();
        
        return new Promise((resolve) => {
            this.onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    resolve(user);
                } else {
                    window.location.href = redirectPath;
                }
            });
        });
    }

    // Get user-friendly error messages
    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Try signing in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password is too weak. Use at least 6 characters.';
            case 'auth/user-not-found':
                return 'No account found with this email. Please sign up first.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please check and try again.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }

    // Get Google-specific error messages
    getGoogleErrorMessage(error) {
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                return 'Sign in was cancelled.';
            case 'auth/popup-blocked':
                return 'Popup was blocked. Please allow popups and try again.';
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with this email address.';
            default:
                return this.getErrorMessage(error);
        }
    }
}

// Export a global instance
window.authManager = new AuthManager();

// Auto-initialize on script load
document.addEventListener('DOMContentLoaded', () => {
    window.authManager.initialize().catch(console.error);
});