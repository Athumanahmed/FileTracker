/**
 * Minimal, dependency-free User-Agent parsing for UserSession display
 * fields (deviceName / browser / operatingSystem). Not exhaustive by
 * design -- it only needs to be good enough for a "your active sessions"
 * screen, not analytics-grade device detection.
 */
export const parseUserAgent = (userAgent) => {
  const ua = userAgent || "";

  let operatingSystem = "Unknown";
  if (/windows/i.test(ua)) operatingSystem = "Windows";
  else if (/mac os/i.test(ua)) operatingSystem = "macOS";
  else if (/android/i.test(ua)) operatingSystem = "Android";
  else if (/iphone|ipad|ios/i.test(ua)) operatingSystem = "iOS";
  else if (/linux/i.test(ua)) operatingSystem = "Linux";

  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome\//i.test(ua)) browser = "Chrome";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

  const deviceName = /mobile/i.test(ua) ? "Mobile Device" : "Desktop";

  return { deviceName, browser, operatingSystem };
};
