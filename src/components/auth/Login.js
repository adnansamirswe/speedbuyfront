// src/components/auth/Login.js
import { auth, googleprovider, db } from "../../config/firebase";
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import './auth.css';


export const Login = () => {
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.emailVerified) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (isLoggedIn) {
        return <Navigate to="/dashboard" />;
    }

    const saveUserDetails = async (uid, username, email) => {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                uid,
                username,
                email,
                balance: 0 // Initialize balance
            });
        }
    };

    const login = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            const user = userCredential.user;
            if (user.emailVerified) {
                setMessage("Login successful!");
                setMessageType("success");
            } else {
                await auth.signOut();
                setMessage("Email not verified. Please check your inbox and verify your email before logging in.");
                setMessageType("error");
            }
        } catch (err) {
            console.error(err);
            setMessage("Login failed. Please check your credentials.");
            setMessageType("error");
        }
    };

    const loginWithGoogle = async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleprovider);
            const user = userCredential.user;
            if (user.emailVerified) {
                await saveUserDetails(user.uid, user.displayName || user.email.split("@")[0], user.email);
                setMessage("Login with Google successful!");
                setMessageType("success");
            } else {
                await auth.signOut();
                setMessage("Email not verified. Please check your inbox and verify your email before logging in.");
                setMessageType("error");
            }
        } catch (err) {
            setMessage("Google login failed: " + err.message);
            setMessageType("error");
        }
    };

    return (
        <div className="container">
            <h2 className="title">Login</h2>
            <div className="input-container">
                <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>
            <div className="input-container">
                <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </div>
            <button className="button" onClick={login}>Login</button>
            <button className="button-google-button" onClick={loginWithGoogle}>Login with Google</button>
            {message && <p className={`message ${messageType}-animation`}>{message}</p>}
            <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
        </div>
    );
};

export default Login;
