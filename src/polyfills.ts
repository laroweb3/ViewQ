import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
  (window as any).process = (window as any).process || { env: {} };

  // Gracefully handle uncaught exceptions and unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Gracefully handled uncaught rejection:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    // Check if the error is from firebase or network connection failure
    const errorMsg = event.message || '';
    if (errorMsg.includes('Firestore') || errorMsg.includes('connection') || errorMsg.includes('network')) {
      console.warn('Gracefully handled network/database error:', errorMsg);
    } else {
      console.warn('Gracefully handled uncaught error:', errorMsg);
    }
    event.preventDefault();
  });
}
