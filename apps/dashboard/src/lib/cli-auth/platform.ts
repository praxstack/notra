export function detectPlatform(): string {
  if (typeof navigator === "undefined") {
    return "this device";
  }
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) {
    return "macOS";
  }
  if (ua.includes("windows")) {
    return "Windows";
  }
  if (ua.includes("linux")) {
    return "Linux";
  }
  return "this device";
}
