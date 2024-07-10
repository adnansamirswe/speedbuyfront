import { auth, googleprovider } from "../config/firebase";
import { signOut, signInWithPopup, onAuthStateChanged } from "firebase/auth";

export const handleGoogleSignIn = async () => {
    try {
        await signInWithPopup(auth, googleprovider);
        return { success: true, userId: auth.currentUser.uid };
    } catch (err) {
        console.error("Google sign-in failed:", err);
        return { success: false, message: "Google sign-in failed: " + err.message };
    }
};

export const handleLogout = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (err) {
        console.error("Logout failed:", err);
        return { success: false, message: "Logout failed: " + err.message };
    }
};

export const authStateChangeHandler = (callback) => {
    return onAuthStateChanged(auth, callback);
};
