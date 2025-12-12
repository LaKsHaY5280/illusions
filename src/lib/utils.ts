// Utility functions for error handling and edge cases

export const handleSocketError = (error: any): string => {
  if (error.message?.includes("timeout")) {
    return "Connection timeout. Check your internet connection.";
  }
  if (error.message?.includes("refused")) {
    return "Cannot connect to server. Please try again.";
  }
  if (error.message?.includes("already voted")) {
    return "You've already voted on this poll.";
  }
  return "Something went wrong. Please refresh the page.";
};

export const isValidImageUrl = (url: string): boolean => {
  try {
    // Check if URL is properly formatted
    if (!url || typeof url !== "string") return false;

    // Check for valid image extensions
    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".svg",
      ".avif",
      ".webp",
    ];
    const hasValidExtension = validExtensions.some((ext) =>
      url.toLowerCase().endsWith(ext)
    );

    return hasValidExtension;
  } catch {
    return false;
  }
};

export const getTimerColor = (percentage: number): string => {
  if (percentage > 66) return "bg-green-400";
  if (percentage > 33) return "bg-yellow-400";
  return "bg-red-400";
};

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Debounce function to prevent rapid repeated actions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for vote submissions
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Safe localStorage wrapper with fallback
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn("localStorage not available:", error);
    }
  },
};

// Detect if user is on mobile
export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Detect if user is on iOS
export const isIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Check if browser supports WebSocket
export const supportsWebSocket = (): boolean => {
  return typeof WebSocket !== "undefined";
};

// Vibrate on mobile (for feedback)
export const vibrate = (duration: number = 50): void => {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  } catch (error) {
    // Vibration not supported, silently fail
  }
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
};

// Network quality detection
export const getNetworkQuality = (): "fast" | "slow" | "offline" => {
  if (typeof navigator === "undefined" || !navigator.onLine) {
    return "offline";
  }

  // @ts-ignore - experimental API
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === "4g") return "fast";
    if (effectiveType === "3g" || effectiveType === "2g") return "slow";
  }

  return "fast"; // Default to fast if can't determine
};

// Performance monitoring
export const measurePerformance = (label: string, fn: () => void): void => {
  if (typeof performance === "undefined") {
    fn();
    return;
  }

  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
};
