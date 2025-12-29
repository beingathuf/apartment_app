// src/pages/Watchman/utils.ts
export function formatDateTime(dateTimeString: string): string {
  if (!dateTimeString) return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    
    // Format: DD/MM/YYYY HH:MM AM/PM
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  } catch (error) {
    return dateTimeString;
  }
}