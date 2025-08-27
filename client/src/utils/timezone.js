// Timezone utility functions

// Format UTC timestamp in specified timezone offset
export function formatInOffset(utcMs, offsetMinutes) {
  const shifted = new Date(utcMs + offsetMinutes * 60000);
  const hours = Math.floor(shifted.getUTCHours());
  const minutes = shifted.getUTCMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Format timezone offset for display
export function formatTimezoneOffset(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  
  if (minutes === 0) {
    return `(UTC${sign}${hours.toString().padStart(2, '0')}:00)`;
  } else {
    return `(UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')})`;
  }
}

// Generate timezone options from UTC-12:00 to UTC+14:00
export function generateTimezoneOptions() {
  const options = [];
  
  // UTC-12:00 to UTC+14:00
  for (let offset = -12 * 60; offset <= 14 * 60; offset += 30) {
    // Skip some non-standard offsets for cleaner list
    if (offset === -690 || offset === -630 || offset === -570 || 
        offset === -510 || offset === -450 || offset === -390 || 
        offset === -330 || offset === -270 || offset === -210 || 
        offset === -150 || offset === -90 || offset === -30 ||
        offset === 30 || offset === 90 || offset === 150 || 
        offset === 210 || offset === 270 || offset === 330 || 
        offset === 390 || offset === 450 || offset === 510 || 
        offset === 570 || offset === 630 || offset === 690) {
      continue;
    }
    
    options.push({
      value: offset,
      label: formatTimezoneOffset(offset)
    });
  }
  
  return options;
}

// Get default timezone offset (UTC+03:00 = 180 minutes)
export const DEFAULT_TIMEZONE_OFFSET = 180;

// LocalStorage key for timezone preference
export const TIMEZONE_STORAGE_KEY = 'tz_offset_min';
