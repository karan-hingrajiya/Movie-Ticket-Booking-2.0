// Shared UI utilities: field state, status, password strength, and theme
export function setFieldState(field, errorElement, message = "") {
    const fieldWrap = field?.closest?.(".field");
    if (fieldWrap) fieldWrap.classList.toggle("has-error", Boolean(message));
    if (errorElement) errorElement.textContent = message;
}

export function setStatus(statusElement, message = "", type = "") {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.dataset.type = type;
}

function ensureNotificationRoot() {
    let root = document.querySelector('.app-notifications');

    if (!root) {
        root = document.createElement('div');
        root.className = 'app-notifications';
        root.setAttribute('aria-live', 'polite');
        root.setAttribute('aria-atomic', 'true');
        document.body.appendChild(root);
    }

    return root;
}

function getNotificationQueueKey() {
    return 'zohocine-notification-queue';
}

function getNotificationIcon(type) {
    if (type === 'success') {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        `;
    }

    if (type === 'error') {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5" />
                <circle cx="12" cy="16.5" r=".7" fill="currentColor" stroke="none" />
            </svg>
        `;
    }

    if (type === 'warning') {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 21 19H3L12 3Z" />
                <path d="M12 9v4" />
                <circle cx="12" cy="16.5" r=".7" fill="currentColor" stroke="none" />
            </svg>
        `;
    }

    return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11.5v4" />
            <circle cx="12" cy="8" r=".7" fill="currentColor" stroke="none" />
        </svg>
    `;
}

export function notify(message, type = 'info', options = {}) {
    if (!message) return null;

    const root = ensureNotificationRoot();
    const toast = document.createElement('section');
    const title = options.title || (
        type === 'success'
            ? 'Success'
            : type === 'error'
                ? 'Something Went Wrong'
                : type === 'warning'
                    ? 'Please Check'
                    : 'Notice'
    );

    toast.className = `app-toast app-toast--${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.innerHTML = `
        <div class="app-toast__icon">${getNotificationIcon(type)}</div>
        <div class="app-toast__body">
            <p class="app-toast__title">${title}</p>
            <p class="app-toast__message">${message}</p>
        </div>
        <button class="app-toast__close" type="button" aria-label="Close notification">×</button>
    `;

    const close = () => {
        toast.classList.add('is-leaving');
        window.setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector('.app-toast__close')?.addEventListener('click', close);
    root.appendChild(toast);

    const duration = options.duration ?? (type === 'error' ? 5200 : 3600);
    window.setTimeout(close, duration);

    return toast;
}

export function notifyOnNextPage(message, type = 'info', options = {}) {
    if (!message) return;

    try {
        const key = getNotificationQueueKey();
        const queue = JSON.parse(sessionStorage.getItem(key) || '[]');
        queue.push({ message, type, options });
        sessionStorage.setItem(key, JSON.stringify(queue));
    } catch {
        notify(message, type, options);
    }
}

export function showQueuedNotifications() {
    try {
        const key = getNotificationQueueKey();
        const queue = JSON.parse(sessionStorage.getItem(key) || '[]');
        sessionStorage.removeItem(key);
        queue.forEach((item) => notify(item.message, item.type, item.options || {}));
    } catch {
        sessionStorage.removeItem(getNotificationQueueKey());
    }
}

export function notifySuccess(message, options = {}) {
    return notify(message, 'success', options);
}

export function notifyError(message, options = {}) {
    return notify(message, 'error', options);
}

export function notifyWarning(message, options = {}) {
    return notify(message, 'warning', options);
}

export function notifyInfo(message, options = {}) {
    return notify(message, 'info', options);
}

export async function parseApiResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        try {
            return await response.json();
        } catch {
            return {};
        }
    }

    try {
        const text = await response.text();
        return text ? { message: text } : {};
    } catch {
        return {};
    }
}

export function getApiMessage(payload, fallback = 'Something went wrong.') {
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload;
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message.trim();
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error.trim();
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        return payload.errors.join(', ');
    }
    if (Array.isArray(payload.message) && payload.message.length > 0) {
        return payload.message.join(', ');
    }
    return fallback;
}

export function getPasswordStrength(value) {
    let score = 0;
    if (!value) return { score: 0, label: "Start typing", className: "empty" };
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[@$!%*?&]/.test(value)) score++;
    if (score <= 2) return { score, label: "Weak", className: "weak" };
    if (score <= 4) return { score, label: "Good", className: "good" };
    return { score, label: "Strong", className: "strong" };
}

export function updatePasswordMeter(strengthBar, strengthText, passwordValue) {
    if (!strengthBar || !strengthText) return;
    const strength = getPasswordStrength(passwordValue);
    const progress = Math.max(strength.score, passwordValue ? 1 : 0) * 20;
    strengthBar.style.width = `${progress}%`;
    strengthBar.dataset.strength = strength.className;
    strengthText.textContent = strength.label;
}

export const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[A-Za-z0-9@$!%*?&]{8,}$/;

export function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}

// Password validator used across auth modules
export function validatePassword(value) {
    if (!value || typeof value !== 'string') return false;
    return passwordPattern.test(value.trim());
}

// Dark mode helpers: toggles class on <html> and persists to localStorage
function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
}

export function initDarkMode(toggleSelector = '.dark-toggle') {
    const toggle = document.querySelector(toggleSelector);
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const saved = localStorage.getItem('zohocine-theme');
    const prefersDark = Boolean(mediaQuery?.matches);
    const initial = saved || (prefersDark ? 'dark' : 'light');

    const setTheme = (theme) => {
        applyTheme(theme);
        localStorage.setItem('zohocine-theme', theme);
        if (toggle) {
            toggle.setAttribute('aria-pressed', String(theme === 'dark'));
        }
    };

    applyTheme(initial);
    if (!window.__zohocineQueuedNotificationsShown) {
        showQueuedNotifications();
        window.__zohocineQueuedNotificationsShown = true;
    }

    if (toggle && !toggle.dataset.themeBound) {
        toggle.dataset.themeBound = 'true';
        toggle.setAttribute('aria-pressed', String(initial === 'dark'));
        toggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        });
    }

    if (mediaQuery && !window.__zohocineThemeWatcherBound) {
        mediaQuery.addEventListener?.('change', (event) => {
            if (!localStorage.getItem('zohocine-theme')) {
                applyTheme(event.matches ? 'dark' : 'light');
            }
        });
        window.__zohocineThemeWatcherBound = true;
    }

    window.toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    };

    return { setTheme };
}
