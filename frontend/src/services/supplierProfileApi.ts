// Supplier Profile API — لجلب بيانات المورد المسجَّل دخولاً + الكيان المرتبط

import { apiFetch } from './apiFetch';

export interface SupplierMeUser {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface SupplierMeProfile {
  id: string;
  supplier_type: string;
  status: string;
  company_name: string;
  country: string;
  city: string;
  phone: string;
  waitlist_id: string | null;
}

export interface SupplierLinkedHotel {
  kind: 'hotel';
  data: {
    id: number;
    name: string;
    city: number;
    city_name: string | null;
    country: string | null;
    address: string;
    stars: number;
    description: string;
    image: string | null;
    commission_percentage: string | null;
    is_active: boolean;
    is_ready_for_activation: boolean;
    missing_for_activation: string[];
  };
}

export interface SupplierLinkedService {
  kind: 'service';
  data: {
    id: number;
    name: string;
    description: string;
    image: string | null;
    service_type: string;
    base_price: string | null;
    final_price: number | null;
    currency: string;
    commission_percentage: string | null;
    is_active: boolean;
    city_name: string | null;
    is_ready_for_activation: boolean;
    missing_for_activation: string[];
  };
}

export interface SupplierMeResponse {
  user: SupplierMeUser;
  supplier: SupplierMeProfile;
  linked: SupplierLinkedHotel | SupplierLinkedService | null;
}

export async function fetchSupplierMe(): Promise<SupplierMeResponse> {
  const res = await apiFetch('/api/v1/accounts/supplier/me/');
  if (!res.ok) {
    throw new Error('فشل جلب بيانات المورد');
  }
  return res.json();
}
