// src/pages/ForgotPassword.js

import { useState } from "react";
import { auth, db } from "../../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import './ForgotPassword.css';

export const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const checkEmailExists = async (email) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const handleResetPassword = async () => {
        if (!email) {
            setMessage("Email is required.");
            setMessageType("error");
            setTimeout(() => setMessage(""), 1500);
            return;
        }

        const emailExists = await checkEmailExists(email);

        if (!emailExists) {
            setMessage("Email does not exist.");
            setMessageType("error");
            setTimeout(() => setMessage(""), 1500);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent!");
            setMessageType("success");
        } catch (error) {
            setMessage("Error: " + error.message);
            setMessageType("error");
        }

        setTimeout(() => setMessage(""), 1500);
    };

    return (
        <div className="forgot-password">
            <h1>Forgot Password</h1>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleResetPassword}>Reset Password</button>
            {message && <p className={`message ${messageType}`}>{message}</p>}
            <Link to="/">Back to Login</Link>
        </div>
    );
};

export default ForgotPassword;
