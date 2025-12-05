import client from "./client";

export const updateAdminPin = async (
  rid: string,
  currentPin: string,
  newPin: string
) => {
  return client.patch(`/api/${rid}/admin/pin`, {
    currentPin,
    newPin,
  });
};

export const updateStaffPin = async (
  rid: string,
  adminPin: string,
  newStaffPin: string
) => {
  return client.patch(`/api/${rid}/admin/staff-pin`, {
    adminPin,
    newStaffPin,
  });
};
