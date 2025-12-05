import client from "./client";
import { client as nonAdminClient } from "../client";

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: string;
    name: string;
    role: "admin" | "staff";
  };
}

export const loginAsAdmin = async (
  rid: string,
  pin: string
): Promise<AdminLoginResponse> => {
  const response = await nonAdminClient.post(`/api/${rid}/admin/login`, {
    pin,
  });
  return response.data;
};

export const getAdmin = async (rid: string) => {
  return client.get(`/api/${rid}/admin`);
};

export const getMenuItems = async (rid: string) => {
  const response = await client.get(`/api/${rid}/admin/menu`);
  return response;
};

export const addMenuItem = async (rid: string, menuItem: any) => {
  const response = await client.post(`/api/${rid}/admin/menu`, menuItem);
  return response;
};

export const updateMenuItem = async (
  rid: string,
  id: string,
  menuItem: any
) => {
  const response = await client.put(`/api/${rid}/admin/menu/${id}`, menuItem);
  return response;
};

export const deleteMenuItem = async (rid: string, id: string) => {
  const response = await client.delete(`/api/${rid}/admin/menu/${id}`);
  return response;
};

export const getStaffMembers = async (rid: string) => {
  const response = await client.get(`/api/${rid}/admin/staff`);
  return response;
};

export const addStaffMember = async (rid: string, staff: any) => {
  const response = await client.post(`/api/${rid}/admin/staff`, staff);
  return response;
};

export const updateStaffMember = async (rid: string, id: string, staff: any) => {
  const response = await client.put(`/api/${rid}/admin/staff/${id}`, staff);
  return response;
};

export const deleteStaffMember = async (rid: string, id: string) => {
  const response = await client.delete(`/api/${rid}/admin/staff/${id}`);
  return response;
};

export const getDashboardStats = async (rid: string) => {
  const response = await client.get(`/api/${rid}/admin/stats`);
  return response;
};

export const getOrderHistory = async (
  rid: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
) => {
  const response = await client.get(`/api/${rid}/admin/orders`, {
    params,
  });
  return response;
};

export const addWaiter = async (rid: string, waiter: any) => {
  const response = await client.post(`/api/${rid}/admin/waiters`, waiter);
  return response;
};

