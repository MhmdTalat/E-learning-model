import client from "./client";
import { User, AuthResponse, PasswordResetResponse } from "@/types";

interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  userName: string;
  role: 'Student' | 'Instructor' | 'Admin';
  departmentId?: number | null;
  phoneNumber?: string;
  bio?: string;
  profilePhotoUrl?: string;
  dateOfBirth?: string;
  address?: string;
  company?: string;
  profileImage?: File;
}

export const login = (email: string, password: string): Promise<AuthResponse> => {
  return client.post("/api/auth/login", { email, password })
    .then(res => res.data);
};

export const register = (payload: RegisterPayload): Promise<AuthResponse> => {
  // Use FormData if we have a file to upload
  if (payload.profileImage) {
    const parts = (payload.userName ?? '').trim().split(/\s+/).filter(Boolean);
    const formData = new FormData();
    formData.append('FirstMidName', parts[0] ?? 'User');
    formData.append('LastName', parts.slice(1).join(' ') || 'User');
    formData.append('Email', payload.email);
    formData.append('PhoneNumber', payload.phoneNumber ?? '');
    formData.append('Password', payload.password);
    formData.append('RoleType', (payload.role === 'Admin' ? 3 : payload.role === 'Instructor' ? 2 : 1).toString());
    if (payload.departmentId != null) {
      formData.append('DepartmentID', payload.departmentId.toString());
    }
    if (payload.bio) formData.append('Bio', payload.bio);
    formData.append('ProfilePhoto', payload.profileImage);
    if (payload.dateOfBirth) formData.append('DateOfBirth', new Date(payload.dateOfBirth).toISOString());
    if (payload.address) formData.append('Address', payload.address);
    if (payload.company) formData.append('Company', payload.company);

    console.log('[Register Payload - FormData with Image]');
    return client.post("/api/auth/register-with-photo", formData).then(res => res.data);
  }

  // Regular JSON payload without file
  const parts = (payload.userName ?? '').trim().split(/\s+/).filter(Boolean);
  const backendPayload = {
    FirstMidName: parts[0] ?? 'User',
    LastName: parts.slice(1).join(' ') || 'User',
    Email: payload.email,
    PhoneNumber: payload.phoneNumber ?? '',
    Password: payload.password,
    RoleType: payload.role === 'Admin' ? 3 : payload.role === 'Instructor' ? 2 : 1,
    DepartmentID: payload.departmentId ?? null,
    Bio: payload.bio ?? null,
    ProfilePhotoUrl: payload.profilePhotoUrl ?? null,
    DateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
    Address: payload.address ?? null,
    Company: payload.company ?? null,
  };
  
  console.log('[Register Payload - JSON]', JSON.stringify(backendPayload, null, 2));
  
  return client.post("/api/auth/register", backendPayload)
    .then(res => res.data);
};

export const getMe = (): Promise<User> => {
  return client.get("/api/auth/me")
    .then(res => res.data);
};

export const updateProfile = (payload: Partial<RegisterPayload>): Promise<User> => {
  return client.put("/api/auth/profile", payload)
    .then(res => res.data);
};

export const forgotPassword = (email: string): Promise<PasswordResetResponse> => {
  return client.post("/api/auth/forgot-password", { email })
    .then(res => res.data);
};

export const resetPassword = (email: string, token: string, password: string): Promise<PasswordResetResponse> => {
  return client.post("/api/auth/reset-password", {
    email,
    token,
    newPassword: password,
  }).then(res => res.data);
};
