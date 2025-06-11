import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";

const provider = new GoogleAuthProvider();

export function login() {
  signInWithRedirect(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export async function handleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Create or update user in our database
      const userData = {
        firebaseUid: result.user.uid,
        email: result.user.email!,
        name: result.user.displayName!,
        avatar: result.user.photoURL,
      };

      await apiRequest("POST", "/api/users", userData);
      return result.user;
    }
  } catch (error) {
    console.error("Auth redirect error:", error);
    throw error;
  }
}

export function onAuthChange(callback: (user: any) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (user) {
    return user.uid;
  }
  return null;
}
