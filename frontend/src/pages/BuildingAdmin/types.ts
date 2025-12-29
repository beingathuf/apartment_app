// src/pages/BuildingAdmin/types.ts
export interface Apartment {
  id: number;
  unit_number: string;
  owner_name: string | null;
  created_at: string;
}

export interface User {
  id: number;
  phone: string;
  name: string | null;
  role: string;
  apartment_id: number | null;
  created_at: string;
  unit_number?: string;
}

export interface VisitorPass {
  id: number;
  code: string;
  visitor_name: string | null;
  created_at: string;
  expires_at: string;
  status: string;
  resident_name?: string;
  resident_phone?: string;
  unit_number?: string;
  building_name?: string;
  isExpired?: boolean;
  isActive?: boolean;
  timeRemaining?: number;
}

export interface VerificationResult {
  pass: VisitorPass;
  valid: boolean;
  message: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  body?: string;
  created_at: string;
  building_id: number;
  category: string;
  priority: "low" | "medium" | "high" | "normal" | "urgent";
  expires_at?: string;
  is_active?: boolean;
  is_expired?: boolean;
  created_by_name?: string;
  visible?: boolean;
  days_ago?: number;
}



export interface Booking {
  id: number;
  building_id: number;
  apartment_id: number;
  amenity: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  guests: number;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejection_reason: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  unit_number: string;
  resident_name: string;
  resident_phone: string;
  approved_by_name: string | null;
}

export interface Watchman {
  id: number;
  phone: string;
  name: string;
  role: 'watchman';
  building_id: string;
  building_name: string;
  created_at: string;
  last_login: string | null;
}

export interface Stats {
  totalApartments: number;
  totalResidents: number;
  totalWatchmen: number;
  activePassesCount: number;
  verifiedToday: number;
  unreadNotices: number;
  pendingBookings: number;
  pendingComplaints: number;
}

export interface ComplaintStats {
  total: number;
  submitted: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  today: number;
}
export type TabType = "dashboard" | "apartments" | "residents" | "verify" | "notices" | "bookings" | "complaints";