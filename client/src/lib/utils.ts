import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return formatTime(d);
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function getToken(): string | null {
  return localStorage.getItem('schat_token');
}

export function setToken(token: string): void {
  localStorage.setItem('schat_token', token);
  resetInactivityTimer(); // Reset the timer when token is set
}

export function removeToken(): void {
  localStorage.removeItem('schat_token');
  clearInactivityTimer(); // Clear the timer when logged out
}

export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// Inactivity timeout (5 minutes)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
let inactivityTimer: number | undefined;

// Function to reset the inactivity timer
export function resetInactivityTimer(): void {
  // Clear any existing timer
  clearInactivityTimer();
  
  // Only set the timer if user is logged in
  if (isTokenValid()) {
    inactivityTimer = window.setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT);
  }
}

// Function to clear the inactivity timer
export function clearInactivityTimer(): void {
  if (inactivityTimer) {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = undefined;
  }
}

// Function to handle logout due to inactivity
export function logoutDueToInactivity(): void {
  // Only proceed if user is currently logged in
  if (isTokenValid()) {
    // Remove the token
    removeToken();
    
    // Set a flag to show the inactivity message
    localStorage.setItem('inactive_logout', 'true');
    
    // Redirect to login page
    window.location.href = '/';
  }
}

// Function to check and display inactivity message
export function checkInactivityLogout(): boolean {
  const inactiveLogout = localStorage.getItem('inactive_logout');
  
  if (inactiveLogout === 'true') {
    localStorage.removeItem('inactive_logout');
    return true;
  }
  
  return false;
}
