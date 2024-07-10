import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import {
    auth,
    googleprovider,
    db
} from "../../config/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    sendEmailVerification
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc
} from "firebase/firestore";
import './auth.css';

export const Signup = () => {
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await user.reload();
                setIsLoggedIn(user.emailVerified);
                if (!user.emailVerified) {
                    setMessage("Please verify your email before logging in.");
                    setMessageType("error");
                }
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

    const handleSignup = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
            const user = userCredential.user;
            await saveUserDetails(user.uid, username, signupEmail);
            await sendEmailVerification(user);
            setMessage("Signup successful! Verification email sent. Please verify your email.");
            setMessageType("success");
            await signOut(auth);
        } catch (err) {
            setMessage(`Signup failed: ${err.message}`);
            setMessageType("error");
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const userCredential = await signInWithPopup(auth, googleprovider);
            const user = userCredential.user;
            await saveUserDetails(user.uid, user.displayName || user.email.split("@")[0], user.email);
            setMessage("Signup with Google successful!");
            setMessageType("success");
        } catch (err) {
            setMessage(`Google signup failed: ${err.message}`);
            setMessageType("error");
        }
    };

    return (
        <div className="container">
            <h2>Signup</h2>
            <div className="input-container">
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div className="input-container">
                <input
                    placeholder="Email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                />
            </div>
            <div className="input-container">
                <input
                    type="password"
                    placeholder="Password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                />
            </div>
            <button className="button" onClick={handleSignup}>Signup</button>
            <button className="button-google-button" onClick={handleGoogleSignup}>Signup with Google</button>
            {message && <div className={`message ${messageType}`}>{message}</div>}
            <Link to="/login">Back to Login</Link>
        </div>
    );
};

export default Signup;
