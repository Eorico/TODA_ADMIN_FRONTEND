const loginBtn  = document.getElementById('login-btn');
const adminIn   = document.getElementById('admin-id');
const passIn    = document.getElementById('password');
const errorMsg  = document.getElementById('error-msg');
const eyeBtn    = document.getElementById('eye-btn');
const eyeIcon   = document.getElementById('eye-icon');

/* ── Eye toggle ── */
let shown = false;
eyeBtn.addEventListener('click', () => {
    shown = !shown;
    passIn.type = shown ? 'text' : 'password';
    eyeIcon.innerHTML = shown
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

/* ── Login handler ── */
loginBtn.addEventListener('click', () => {
    const id   = adminIn.value.trim();
    const pass = passIn.value;

    errorMsg.classList.remove('visible');

    if (!id || !pass) {
    errorMsg.textContent = 'Please fill in both fields.';
    errorMsg.classList.add('visible');
    return;
    }

    // Simulate async login
    loginBtn.classList.add('loading');

    setTimeout(() => {
    loginBtn.classList.remove('loading');

    // Demo: accept "admin" / "admin123"
    if (id === 'admin' && pass === 'admin123') {
        loginBtn.style.background = 'linear-gradient(160deg, #2e7d32, #1b5e20)';
        loginBtn.querySelector('.btn-text').textContent = '✓ Access Granted';
        loginBtn.querySelector('.btn-text').style.display = 'block';

        localStorage.setItem("isLoggedIn", "true")

        setTimeout(() => {
            window.location.href = "../html/admin_dashboard.html";
        }, 1000);

    } else {
        errorMsg.textContent = 'Invalid admin ID or password. Please try again.';
        errorMsg.classList.add('visible');
        [adminIn, passIn].forEach(el => {
        el.style.borderColor = 'var(--crimson)';
        setTimeout(() => el.style.borderColor = '', 1200);
        });
    }
    }, 1400);
});

/* ── Enter key support ── */
[adminIn, passIn].forEach(el => {
    el.addEventListener('keydown', e => {
    if (e.key === 'Enter') loginBtn.click();
    });
});