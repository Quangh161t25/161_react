// PWA Installation & Device helper

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<(canInstall: boolean) => void>();

// Register beforeinstallprompt as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    listeners.forEach((cb) => cb(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((cb) => cb(false));
  });
}

export const pwaService = {
  // Subscribe to install availability changes
  subscribe(callback: (canInstall: boolean) => void): () => void {
    listeners.add(callback);
    callback(this.canPromptInstall());
    return () => {
      listeners.delete(callback);
    };
  },

  // Check if browser can show native install prompt
  canPromptInstall(): boolean {
    return deferredPrompt !== null;
  },

  // Trigger native install prompt (Android, Chrome, Edge)
  async promptInstall(): Promise<boolean> {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        listeners.forEach((cb) => cb(false));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Install prompt error:', err);
      return false;
    }
  },

  // Check if app is already running in standalone mode (installed)
  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  },

  // Device detection
  getDeviceInfo() {
    if (typeof window === 'undefined') {
      return { isIOS: false, isAndroid: false, isMobile: false, isDesktop: true };
    }
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/i.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi|Tablet/i.test(ua);
    return {
      isIOS,
      isAndroid,
      isMobile,
      isDesktop: !isMobile,
    };
  },
};
