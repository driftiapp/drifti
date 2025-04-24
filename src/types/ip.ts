export interface IPLocation {
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  latitude: number;
  longitude: number;
}

export type Action = 'login' | 'register' | 'password_reset' | 'block' | 'unblock' | 'whitelist' | 'remove_whitelist';
export type Severity = 'low' | 'medium' | 'high' | 'critical'; 