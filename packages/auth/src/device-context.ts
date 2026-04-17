/**
 * 🔐 ENTERPRISE AUTH: Device Context Management
 * 
 * Generates and manages device identification for multi-device session tracking.
 * Device ID is stored in localStorage and persists across sessions.
 */

const DEVICE_ID_KEY = 'auth_device_id';
const DEVICE_NAME_KEY = 'auth_device_name';

/**
 * Generate a unique device ID using crypto.randomUUID()
 */
function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Detect device name from user agent
 */
function detectDeviceName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown Device';
  }

  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  
  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return `${browser} on ${os}`;
}

/**
 * Get or create device ID from localStorage
 */
export function getDeviceId(): string {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in globalThis) {
    const storage = (globalThis as typeof globalThis & { localStorage: Storage }).localStorage;
    let deviceId = storage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      storage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  }

  return generateDeviceId(); // Server-side or no storage - generate temporary ID
}

/**
 * Get or create device name from localStorage
 */
export function getDeviceName(): string {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in globalThis) {
    const storage = (globalThis as typeof globalThis & { localStorage: Storage }).localStorage;
    let deviceName = storage.getItem(DEVICE_NAME_KEY);
    
    if (!deviceName) {
      deviceName = detectDeviceName();
      storage.setItem(DEVICE_NAME_KEY, deviceName);
    }
    
    return deviceName;
  }

  return detectDeviceName(); // Server-side or no storage - detect from UA
}

/**
 * Get device context headers for API requests
 */
export function getDeviceHeaders(): Record<string, string> {
  return {
    'x-device-id': getDeviceId(),
    'x-device-name': getDeviceName(),
  };
}

/**
 * Clear device context (useful for logout or device reset)
 */
export function clearDeviceContext(): void {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in globalThis) {
    const storage = (globalThis as typeof globalThis & { localStorage: Storage }).localStorage;
    storage.removeItem(DEVICE_ID_KEY);
    storage.removeItem(DEVICE_NAME_KEY);
  }
}

/**
 * Update device name (useful for user customization)
 */
export function updateDeviceName(name: string): void {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis && 'localStorage' in globalThis) {
    const storage = (globalThis as typeof globalThis & { localStorage: Storage }).localStorage;
    storage.setItem(DEVICE_NAME_KEY, name);
  }
}
