import React, { useState, useEffect } from 'react';

import { useNavigate } from "react-router-dom";
import { db, auth } from '../../config/firebase'; // Importing Firebase db instance from config/firebase.js
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import './AddMoney.css';

export function AddMoney() {
  const [provider, setProvider] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate(); // Using the useNavigate hook for programmatic navigation

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/'); // Redirect to home if user is not authenticated
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userId = auth?.currentUser?.uid;
      if (!userId) {
        setErrorMessage('User not authenticated.');
        setSuccessMessage('');
        return;
      }

      // Check if transaction ID is already used
      const usedTransactionRef = collection(db, 'usedTransactions');
      const usedTransactionQuery = query(usedTransactionRef, where("transactionId", "==", transactionId));
      const usedTransactionSnapshot = await getDocs(usedTransactionQuery);

      if (!usedTransactionSnapshot.empty) {
        setErrorMessage('This transaction ID has already been used.');
        setSuccessMessage('');
        return;
      }

      const transactionRef = doc(db, 'payments', provider, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);

      if (transactionDoc.exists()) {
        const transactionData = transactionDoc.data();
        const amount = transactionData.amount;

        // Update the current user's balance
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newBalance = (userData.balance || 0) + amount;

          // Update user balance
          await updateDoc(userDocRef, { balance: newBalance });

          // Mark transaction ID as used
          await setDoc(doc(db, 'usedTransactions', transactionId), {
            transactionId,
            userId,
            provider,
            amount,
            timestamp: new Date()
          });

          setSuccessMessage(`Successfully added Tk ${amount} to your account.`);
          setErrorMessage('');

          // Navigate to the dashboard after a short delay
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setErrorMessage('User not found.');
          setSuccessMessage('');
        }
      } else {
        setErrorMessage('Transaction ID not found in the database. Please try again or contact admin for support. https://t.me/admi_n65 or join our support group: ');
        setSuccessMessage('');
      }
    } catch (error) {
      console.error("Error adding money: ", error);
      setErrorMessage('An error occurred while adding money.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="add-money-container">
      <h1>Add Money</h1>
      <p>To add money, send money to the phone number: <p className='number'>01885684277</p></p>
      <p>Remember to select the "Send Money" option on your bKash or NAGAD app. After sending money, select the payment option and enter your transaction ID below.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Select Provider:
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)} 
              required
            >
              <option value="">Select Provider</option>
              <option value="bKash">bKash</option>
              <option value="NAGAD">NAGAD</option>
            </select>
          </label>
        </div>
        <div className="form-group">
          <label>
            Transaction ID:
            <input 
              type="text" 
              value={transactionId} 
              onChange={(e) => setTransactionId(e.target.value)} 
              required 
            />
          </label>
        </div>
        <button type="submit" className="btn-submit">Add Money</button>
      </form>

      {successMessage && <p className="message success">{successMessage}</p>}
      {errorMessage && <p className="message error">{errorMessage}</p>}
    </div>
  );
}

export default AddMoney;
