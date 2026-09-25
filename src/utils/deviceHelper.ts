import { DeviceSession } from '../types';

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server_device';
  let deviceId = localStorage.getItem('sugeng_device_id');
  if (!deviceId) {
    deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      localStorage.setItem('sugeng_device_id', deviceId);
    } catch {
      // ignore
    }
  }
  return deviceId;
};

export const getDeviceOS = (): string => {
  if (typeof window === 'undefined') return 'Unknown OS';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS (iPhone/iPad)';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Desktop/Mobile';
};

export const getDeviceBrowser = (): string => {
  if (typeof window === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Google Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/OPR\//.test(ua)) return 'Opera';
  return 'Browser Web';
};

export const getDeviceDisplayName = (): string => {
  const browser = getDeviceBrowser();
  const os = getDeviceOS();
  return `${browser} (${os})`;
};

export const getCurrentDeviceSession = (): DeviceSession => {
  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceDisplayName(),
    browser: getDeviceBrowser(),
    os: getDeviceOS(),
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
};

/**
 * Filter and sanitize active sessions:
 * - Deduplicate by deviceId
 * - Drop sessions older than 30 days of inactivity
 */
export const cleanActiveDevices = (devices?: DeviceSession[]): DeviceSession[] => {
  if (!devices || !Array.isArray(devices)) return [];
  const map = new Map<string, DeviceSession>();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  devices.forEach((d) => {
    if (!d || !d.deviceId) return;
    const rawTime = d.lastActive || d.createdAt;
    const time = rawTime ? new Date(rawTime).getTime() : Date.now();
    const validTime = isNaN(time) || time === 0 ? Date.now() : time;
    if (validTime > thirtyDaysAgo) {
      map.set(d.deviceId, {
        ...d,
        lastActive: d.lastActive || new Date().toISOString(),
        createdAt: d.createdAt || new Date().toISOString(),
      });
    }
  });

  return Array.from(map.values());
};
