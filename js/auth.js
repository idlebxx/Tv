/* ============================================
   auth.js — login / signup / logout
============================================ */

(function () {
  'use strict';
  const { auth } = window.IDLEB.stores;
  const { showToast } = window.IDLEB.utils;

  function login(email, password, name) {
    if (!email || !password) { showToast('املأ جميع الحقول', 'error'); return; }
    if (password.length < 6) { showToast('كلمة المرور قصيرة جداً', 'error'); return; }
    const user = {
      id: 'u_' + Date.now(),
      email,
      name: name || email.split('@')[0],
      provider: 'email',
    };
    auth.set({ user });
    showToast('مرحباً بك!', 'success');
    setTimeout(() => location.href = 'profile.html', 600);
  }

  function socialLogin(provider) {
    const user = {
      id: 'u_' + provider,
      email: `user@${provider}.com`,
      name: 'مستخدم ' + provider,
      provider,
    };
    auth.set({ user });
    showToast('تم الدخول', 'success');
    setTimeout(() => location.href = 'profile.html', 600);
  }

  function logout() {
    auth.set({ user: null });
    showToast('تم تسجيل الخروج');
    setTimeout(() => location.href = '../index.html', 400);
  }

  window.IDLEB.auth = { login, socialLogin, logout };
})();
