import { getMessaging, getToken } from "firebase/messaging";
import app from "../firebaseConfig";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestForToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        return currentToken;
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.log("Unable to get permission to notify.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};