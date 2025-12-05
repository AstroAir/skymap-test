/**
 * Time formatting utilities
 */

// ============================================================================
// Basic Time Formatting
// ============================================================================

/**
 * Format timestamp to time string (HH:MM:SS)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format time for short display (HH:MM)
 * @param date - Date object or null
 * @returns Formatted time string or '--:--'
 */
export function formatTimeShort(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

/**
 * Format time with seconds (HH:MM:SS)
 * @param date - Date object or null
 * @returns Formatted time string or '--:--:--'
 */
export function formatTimeLong(date: Date | null): string {
  if (!date) return '--:--:--';
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format date for input[type="date"]
 * @param date - JavaScript Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for input[type="time"]
 * @param date - JavaScript Date object
 * @returns Formatted time string (HH:MM)
 */
export function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date and time together
 * @param date - Date object
 * @returns Formatted string like "2024-01-15 20:30"
 */
export function formatDateTime(date: Date): string {
  return `${formatDateForInput(date)} ${formatTimeForInput(date)}`;
}

// ============================================================================
// Duration Formatting
// ============================================================================

/**
 * Format duration in hours and minutes
 * @param hours - Duration in hours (can be fractional)
 * @returns Formatted string like "2h 30m"
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format duration in hours, minutes, and seconds
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m 45s"
 */
export function formatDurationLong(seconds: number): string {
  if (seconds <= 0) return '0s';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  
  return parts.join(' ');
}

// ============================================================================
// Relative Time
// ============================================================================

/**
 * Get relative time description
 * @param date - Target date
 * @param now - Reference date (defaults to current time)
 * @returns Relative time string like "in 2 hours" or "3 hours ago"
 */
export function getRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;
  
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);
  
  let value: string;
  if (days > 0) {
    value = days === 1 ? '1 day' : `${days} days`;
  } else if (hours > 0) {
    value = hours === 1 ? '1 hour' : `${hours} hours`;
  } else if (minutes > 0) {
    value = minutes === 1 ? '1 minute' : `${minutes} minutes`;
  } else {
    return isPast ? 'just now' : 'now';
  }
  
  return isPast ? `${value} ago` : `in ${value}`;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Wait for specified milliseconds
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
