// Base URL of the local data service. Override via VITE_API_URL in a
// .env.local file if the backend runs on a different host/port.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

// Static build without a backend (VITE_STORAGE=local): data lives in the
// browser's localStorage. Enables the welcome screen, demo data and the
// backup notice.
export const LOCAL_MODE = import.meta.env.VITE_STORAGE === 'local'
