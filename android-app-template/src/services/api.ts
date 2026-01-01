/**
 * API Service - Reuse from web app with React Native adaptations
 * Copy the services from web app and adapt axios calls for React Native
 */

import api from '../config/api';

// Re-export all services (copy from web app src/services/)
// They should work as-is since they use the api instance

export { default } from '../config/api';
export * from '../config/api';

