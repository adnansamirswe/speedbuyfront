import { db } from "../config/firebase";
import { doc, getDocs, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export const getProxyList = async (userId) => {
    const proxiesCollectionRef = collection(db, "users", userId, "proxies");
    const proxiesSnapshot = await getDocs(proxiesCollectionRef);
    return proxiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const addProxyToFirestore = async (userId, proxyData, newBalance) => {
    const proxiesCollectionRef = collection(db, "users", userId, "proxies");
    await addDoc(proxiesCollectionRef, proxyData);
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { balance: newBalance });
};

export const updateProxyInFirestore = async (userId, proxyId, updatedProxyData) => {
    const proxyDocRef = doc(db, "users", userId, "proxies", proxyId);
    await updateDoc(proxyDocRef, updatedProxyData);
};

export const removeProxyFromFirestore = async (userId, proxyId) => {
    const proxyDocRef = doc(db, "users", userId, "proxies", proxyId);
    await deleteDoc(proxyDocRef);
};
