// OTP API — تسجيل دخول المورد بدون كلمة سر

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface OtpRequestResponse {
  success: boolean;
  expires_in: number;
  message: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  tokens: {
    access: string;
    refresh: string;
  };
  user: {
    id: number | string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  };
}

export async function requestOtp(email: string): Promise<OtpRequestResponse> {
  const res = await fetch(`${BASE}/api/v1/accounts/otp/request/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'فشل طلب الرمز');
  }
  return data;
}

export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResponse> {
  const res = await fetch(`${BASE}/api/v1/accounts/otp/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: code.trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'الرمز غير صحيح');
  }
  return data;
}
