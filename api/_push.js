// Push notifications to the admin's own devices (web push with VAPID keys). The key pair is made here the first time
// it is needed and kept in the database (gdb.config, readable only with the admin key), so no secret is set by hand.
// Devices sign up on /admin ("🔔 এই ডিভাইসে নোটিফিকেশন চালু করুন"); a device the push service no longer knows is dropped.
import webpush from 'web-push';
import { rpc } from './_db.js';

const admin = (action, data = null) => rpc('gdb_push_admin', { p_key: process.env.ADMIN_KEY, p_action: action, p_data: data }, { timeout: 5000 });

// the public key the admin page subscribes with (makes and stores the pair on first use)
export async function vapidPublic() {
  const k = await admin('keys');
  if (k && k.public) return k.public;
  const v = webpush.generateVAPIDKeys();
  const r = await admin('init', { public: v.publicKey, private: v.privateKey });
  return r && r.public;
}

// msg: { title, body, url, tag } -> how many devices it reached (never throws)
export async function notifyAdmins(msg) {
  try {
    if (!process.env.ADMIN_KEY) return 0;
    const d = await admin('list');
    if (!d || !d.public || !d.private || !Array.isArray(d.subs) || !d.subs.length) return 0;
    webpush.setVapidDetails('https://ghuredekhabangladesh.com', d.public, d.private);
    const body = JSON.stringify(msg);
    const res = await Promise.allSettled(d.subs.map(s => webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 86400, urgency: 'high', timeout: 5000 })));
    await Promise.allSettled(res.map((r, i) => (r.status === 'rejected' && r.reason && [404, 410].includes(r.reason.statusCode))
      ? admin('remove', { endpoint: d.subs[i].endpoint }) : null));
    return res.filter(r => r.status === 'fulfilled').length;
  } catch (e) {
    return 0;
  }
}
