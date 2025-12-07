import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export async function trackStageChange(campaignId: string | null, from: string, to: string) {
  const date = new Date().toISOString().slice(0, 10);
  const basePath = `prospector_metrics/${date}`;
  const metricsRef = doc(db, basePath, `stage_${from}_to_${to}`);
  await setDoc(
    metricsRef,
    { count: increment(1), updatedAt: serverTimestamp(), campaignId },
    { merge: true }
  );
}

export async function trackChannelAction(channel: 'whatsapp' | 'email' | 'call', success = true) {
  const date = new Date().toISOString().slice(0, 10);
  const metricsRef = doc(
    db,
    `prospector_metrics/${date}`,
    `channel_${channel}_${success ? 'success' : 'fail'}`
  );
  await setDoc(metricsRef, { count: increment(1), updatedAt: serverTimestamp() }, { merge: true });
}

export async function trackConversion(campaignId: string | null) {
  const date = new Date().toISOString().slice(0, 10);
  const metricsRef = doc(db, `prospector_metrics/${date}`, 'conversion_won');
  await setDoc(
    metricsRef,
    { count: increment(1), updatedAt: serverTimestamp(), campaignId },
    { merge: true }
  );
}
