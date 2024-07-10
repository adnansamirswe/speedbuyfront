import React, { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import {
  getProxyList,
  addProxyToFirestore,
  updateProxyInFirestore,
  removeProxyFromFirestore,
} from "./firestoreService";
import { handleLogout } from "./authService";
import { auth as firebaseAuth, db } from "../config/firebase";
import { doc, onSnapshot, collection, addDoc, getDoc, query, where, getDocs } from "firebase/firestore"; // Added `query`, `where`, and `getDocs`
import './Dashboard.css';
import CountdownTimer from './CountdownTimer'; // Assuming CountdownTimer is in the same directory as Dashboard
import { ClipLoader } from "react-spinners";


export const Dashboard = () => {
  const [password, setPassword] = useState("");
  const [speed, setSpeed] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [proxyList, setProxyList] = useState([]);
  const [userId, setUserId] = useState("");
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState(0);
  const [proxyPage, setProxyPage] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [displayUsername, setDisplayUsername] = useState(""); // New state for display username
  const [usernameInput, setUsernameInput] = useState(""); // New state for input field


  const proxiesPerPage = 3;

  const getUserDetails = useCallback(() => {
    const userDocRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setDisplayUsername(userData.username); // Set display username here
        setBalance(userData.balance);
      }
    });
    return () => unsubscribe();
  }, [userId]);

  const fetchProxyList = useCallback(async () => {
    try {
      const proxies = await getProxyList(userId);
      proxies.sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate)); // Sort proxies by generatedDate descending
      proxies.sort((a, b) => (a.status === 'expired' ? -1 : 1)); // Move expired proxies to the top
      setProxyList(proxies);
    } catch (error) {
      console.error("Failed to fetch proxy list:", error);
    }
  }, [userId]);

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, "users", userId, "proxies"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId("");
        setIsLoggedOut(true);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      getUserDetails();
      fetchProxyList();
    }
  }, [userId, fetchProxyList, getUserDetails]);

  useEffect(() => {
    const speedMbps = parseInt(speed, 10);
    const expiryDays = parseInt(expiry, 10);
    if (!isNaN(speedMbps) && speedMbps >= 30 && speedMbps <= 100) {
      let calculatedPrice = speedMbps;
      switch (expiryDays) {
        case 30:
          calculatedPrice *= 2;
          break;
        case 15:
          calculatedPrice *= 1.5;
          break;
        case 7:
          calculatedPrice *= 1;
          break;
        default:
          calculatedPrice = 0;
      }
      setPrice(calculatedPrice);
    } else {
      setPrice(0);
    }
  }, [speed, expiry]);

  const handleGenerateProxy = async () => {
    const speedMbps = parseInt(speed, 10);
    const expiryDays = parseInt(expiry, 10);
  
    if (!usernameInput || !password || isNaN(speedMbps) || speedMbps < 30 || speedMbps > 100) {
      setMessage("All fields are required and speed must be between 30 Mbps and 100 Mbps.");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
  
    if (usernameInput.includes(" ")) {
      setMessage("Username cannot contain spaces.");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
  
    if (balance < price) {
      setMessage("Insufficient balance.");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
  
    const usernameExists = await checkUsernameExists(usernameInput);
    if (usernameExists) {
      setMessage("Username already exists. Please try something else.");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
  
    const currentDate = new Date();
    const expiryDate = new Date(currentDate);
    expiryDate.setDate(currentDate.getDate() + expiryDays + 1);
  
    setIsLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/generate_proxy", {
        username: usernameInput,
        password,
        speed: `${speedMbps}`
      });
  
      if (response.data.success) {
        const proxyData = {
          ...response.data.proxy,
          expiryDate: expiryDate.toISOString(),
          generatedDate: currentDate.toISOString(),
          status: 'active',
          countdownEnd: null
        };
        const newBalance = balance - price;
        await addProxyToFirestore(userId, proxyData, newBalance);
        setBalance(newBalance);
        setMessage("Proxy generated successfully!");
        setMessageType("success");
        fetchProxyList();
        setUsernameInput(""); // Reset the input field
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error("Error generating proxy:", error);
      setMessage("Failed to generate proxy. Please try again later.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRegenerateProxy = async (proxyId, oldIp) => {
    if (isRegenerating) return;

    setIsLoading(true);
    setIsRegenerating(true);

    try {
      const proxyDocRef = doc(db, "users", userId, "proxies", proxyId);
      const proxyDoc = await getDoc(proxyDocRef);

      if (!proxyDoc.exists()) {
        setMessage("Proxy not found.");
        setMessageType("error");
        setIsLoading(false);
        setIsRegenerating(false);
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      const proxy = proxyDoc.data();

      if (proxy.status === 'expired') {
        setMessage("Expired Proxy. Generate a New Proxy");
        setMessageType("error");
        setIsLoading(false);
        setIsRegenerating(false);
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      const { username, password, speed } = proxy;

      const response = await axios.post("http://localhost:5000/regenerate_proxy", {
        username,
        old_ip: oldIp,
        password,
        speed
      });

      if (response.data.success) {
        const countdownDuration = 600000; // Example: 20 seconds
        const countdownEnd = new Date(Date.now() + countdownDuration);

        const newProxyData = {
          ...response.data.proxy,
          generatedDate: new Date().toISOString(),
          countdownEnd: countdownEnd.toISOString()
        };
        await updateProxyInFirestore(userId, proxyId, newProxyData);
        setMessage("Proxy regenerated successfully!");
        setMessageType("success");
        fetchProxyList();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error("Error regenerating proxy:", error);
      setMessage("Failed to regenerate proxy. Please try again later.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemoveProxy = async (proxyId) => {
    const proxy = proxyList.find(p => p.id === proxyId);
    if (!proxy) return;

    try {
      await removeProxyFromFirestore(userId, proxyId);

      const expiredProxyData = {
        ...proxy,
        status: 'expired'
      };
      await addDoc(collection(db, "users", userId, "expiredProxies"), expiredProxyData);

      setMessage("Proxy removed successfully!");
      setMessageType("success");
      fetchProxyList();
    } catch (error) {
      console.error("Error removing proxy:", error);
      setMessage("Failed to remove proxy. Please try again later.");
      setMessageType("error");
    }

    setTimeout(() => setMessage(""), 3000);
  };

  const handleCountdownEnd = () => {
    // Handle the action when countdown ends (e.g., refresh proxy details)
    fetchProxyList();
  };

  const handleNextPage = () => {
    if ((proxyPage + 1) * proxiesPerPage < proxyList.length) {
      setProxyPage(proxyPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (proxyPage > 0) {
      setProxyPage(proxyPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <ClipLoader size={150} color={"#123abc"} loading={isLoading} />
      </div>
    );
  }
  

  if (isLoggedOut) {
    return <Navigate to="/" />;
  }

  const displayedProxies = proxyList.slice(proxyPage * proxiesPerPage, (proxyPage + 1) * proxiesPerPage);

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <Link to="/" onClick={() => handleLogout(setIsLoggedOut)} className="logout">Logout</Link>
        <Link to="/addmoney" className="add-money">Add Money</Link>
      </div>
      <h1>Welcome, {displayUsername}</h1> {/* Use displayUsername here */}
      <p className="balance">Balance: {balance} Taka</p>
      {message && <p className={`message ${messageType}`}>{message}</p>}
      <div className="input-container">
        <input
          type="text"
          placeholder="Username"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <input
          type="number"
          placeholder="Speed (Mbps)"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
        />
        <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
          <option value="30">30 Days</option>
          <option value="15">15 Days</option>
          <option value="7">7 Days</option>
        </select>
        <p>Price: {price} Taka</p>
        <button onClick={handleGenerateProxy}>Generate Proxy</button>
      </div>
      <div className="proxy-list">
        {displayedProxies.map((proxy) => (
          <div
            key={proxy.id}
            className={`proxy-item ${proxy.status === 'expired' ? 'expired' : ''}`}
            style={{ border: proxy.status === 'expired' ? '2px solid red' : '1px solid black' }}
          >
            <p>Status: <span style={{ color: proxy.status === 'expired' ? 'red' : 'green' }}>{proxy.status}</span></p>
            <p>IP: {proxy.ip}</p>
            <p>Port: {proxy.port}</p>
            <p>Username: {proxy.username}</p>
            <p>Password: {proxy.password}</p>
            <p>Speed: {proxy.speed} Mbps</p>
            <p>Generated: {new Date(proxy.generatedDate).toLocaleString()}</p>
            <p>Expiry: {new Date(proxy.expiryDate).toLocaleString()}</p>
            {proxy.status === 'expired' ? (
              <button onClick={() => handleRemoveProxy(proxy.id)}>Remove</button>
            ) : (
              <>
                <button onClick={() => handleRegenerateProxy(proxy.id, proxy.ip)} disabled={isRegenerating}>
                  Regenerate
                </button>
                {proxy.countdownEnd && (
                  <CountdownTimer countdownEnd={proxy.countdownEnd} onCountdownEnd={handleCountdownEnd} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="nav-buttons">
        <button onClick={handlePreviousPage} disabled={proxyPage === 0}>Previous</button>
        <button onClick={handleNextPage} disabled={(proxyPage + 1) * proxiesPerPage >= proxyList.length}>Next</button>
      </div>
    </div>
  );
};
