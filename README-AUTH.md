![Smart Attendance Manager Logo](logo.png)

# Firebase Authentication Guide

This project implements a complete Firebase authorization system with support for both email/password and Google authentication.

## Features

- Email/Password Registration and Login
- Google OAuth Integration
- User Session Management
- Protected Routes
- User Data Storage in Firestore
- Responsive UI Components

## Files Included

1. `auth.js` - Centralized authentication manager class
2. `index.html` - Main authentication page with toggle between login/signup
3. `app.html` - Protected application page (redirects to login if not authenticated)
4. `auth.html` - Standalone authorization demonstration page
5. `demo-auth.html` - Demonstration of how to use the AuthManager class

## Setup Instructions

1. The Firebase configuration is already included in all files
2. Open `index.html` in a browser to see the main authentication interface
3. Open `auth.html` to see a standalone authorization page
4. Open `demo-auth.html` to see how to use the AuthManager class

## Firebase Configuration

The project uses Firebase for authentication and data storage. All Firebase configuration is already set up in the files.

## How to Use

### Using the AuthManager Class (Recommended)

```javascript
// Include the auth.js file
<script src="auth.js"></script>

// Access the global instance
const auth = window.authManager;

// Register a new user
const result = await auth.signUp(email, password, { username });

// Login with email and password
const result = await auth.signIn(email, password);

// Sign in with Google
const result = await auth.signInWithGoogle();

// Logout
const result = await auth.logout();

// Get current user
const user = await auth.getCurrentUser();

// Protect a route
await auth.protectRoute('login.html');
```

### Direct Firebase Usage

The `index.html` and `app.html` files demonstrate direct usage of Firebase SDK without the AuthManager wrapper.

## Security Notes

- Passwords are securely hashed by Firebase
- Sessions are managed automatically by Firebase Auth
- All communications are encrypted over HTTPS
- User data is stored securely in Firestore

## Customization

To customize the authentication system:

1. Modify the UI in `index.html` or `auth.html`
2. Update error messages in `auth.js`
3. Add additional user fields in the registration process
4. Customize the protected route logic in `app.html`

## Troubleshooting

1. **CORS Issues**: Make sure you're serving the files through a local server, not directly opening in browser
2. **Firebase Errors**: Check the browser console for specific error messages
3. **Google Sign-In Blocked**: Ensure popups are enabled in your browser

## Support

For issues with the authorization system, check the browser console for error messages and ensure:
1. You have an active internet connection
2. Firebase configuration is correct
3. You're using compatible browsers (modern Chrome, Firefox, Edge, Safari)