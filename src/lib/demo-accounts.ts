/**
 * Demo login accounts created by `npm run db:seed` / `npm run db:seed:users`.
 * Shared by the seed scripts and the login page's development-only quick-login panel.
 * These are local demo credentials — never reuse them in a real deployment.
 */
export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HOTEL_MANAGER' | 'TOUR_OPERATOR' | 'TOUR_GUIDE' | 'CUSTOMER';
  label: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'admin@sairpakistan.com', password: 'Admin@12345', name: 'Platform Admin', role: 'SUPER_ADMIN', label: 'Super Admin' },
  { email: 'ops@sairpakistan.com', password: 'Ops@12345', name: 'Operations Admin', role: 'ADMIN', label: 'Admin' },
  { email: 'hotel@sairpakistan.com', password: 'Hotel@12345', name: 'Hotel Manager', role: 'HOTEL_MANAGER', label: 'Hotel Manager' },
  { email: 'operator@sairpakistan.com', password: 'Operator@12345', name: 'Tour Operator', role: 'TOUR_OPERATOR', label: 'Tour Operator' },
  { email: 'guide@sairpakistan.com', password: 'Guide@12345', name: 'Tour Guide', role: 'TOUR_GUIDE', label: 'Tour Guide' },
  { email: 'demo@sairpakistan.com', password: 'Customer@12345', name: 'Demo Traveler', role: 'CUSTOMER', label: 'Customer' }
];
