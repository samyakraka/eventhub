"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import type { User, UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: "organizer" | "attendee") => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  getUserProfile: () => UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // User exists in Firebase Auth but not in Firestore
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);

    // Check if user document exists, if not create one
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      const userData = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || "User",
        createdAt: new Date(),
      };
      await setDoc(doc(db, "users", result.user.uid), userData);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore (without role initially)
    const userData = {
      uid: result.user.uid,
      email: result.user.email!,
      displayName,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", result.user.uid), userData);
  };

  const updateUserRole = async (role: "organizer" | "attendee") => {
    if (!firebaseUser) return;

    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || "User",
      role,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", firebaseUser.uid), userData, { merge: true });
    setUser(userData);
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!firebaseUser || !user) return;

    const updatedProfile: UserProfile = {
      ...user.profile,
      ...profileData,
      updatedAt: new Date(),
    };

    const userData: Partial<User> = {
      profile: updatedProfile,
    };

    await setDoc(doc(db, "users", firebaseUser.uid), userData, { merge: true });
    setUser({ ...user, profile: updatedProfile });
  };

  const getUserProfile = (): UserProfile | null => {
    return user?.profile || null;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        logout,
        updateUserRole,
        updateUserProfile,
        getUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
