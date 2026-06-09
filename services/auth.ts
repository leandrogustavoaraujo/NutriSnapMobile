import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  Auth,
} from 'firebase/auth';

import { auth } from '../firebase';

export async function registerUser(
  email: string,
  password: string
): Promise<UserCredential> {
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginUser(
  email: string,
  password: string
): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser(): Promise<void> {
  return await signOut(auth);
}

export function getCurrentAuth(): Auth {
  return auth;
}