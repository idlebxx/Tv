/* ============================================
   push.js — Web Push subscription helpers
============================================ */

(function () {
  'use strict';

  function isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  function permission() {
    return Notification?.permission || 'unsupported';
  }

  async function requestPermission() {
    if (!isSupported()) return 'unsupported';
    return await Notification.requestPermission();
  }

  async function subscribe() {
    if (!isSupported()) return null;
    const perm = await requestPermission();
    if (perm !== 'granted') return null;
    const reg = await navigator.serviceWorker.ready;
    // In production: use VAPID key
    // const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_KEY });
    localStorage.setItem('idleb-push', '1');
    return true;
  }

  function unsubscribe() {
    localStorage.removeItem('idleb-push');
  }

  function isSubscribed() {
    return localStorage.getItem('idleb-push') === '1';
  }

  function notify(title, options) {
    if (permission() !== 'granted') return;
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
    } else {
      new Notification(title, options);
    }
  }

  window.IDLEB.push = { isSupported, permission, requestPermission, subscribe, unsubscribe, isSubscribed, notify };
})();
