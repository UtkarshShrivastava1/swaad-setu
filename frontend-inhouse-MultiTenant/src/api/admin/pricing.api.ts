// src/api/admin/pricing.api.ts
import client from "./client";

export interface Tax {
  name: string;
  percent: number;
  code: string;
  inclusive: boolean;
}

export interface PricingConfigPayload {
  taxes: Tax[];
  globalDiscountPercent: number;
  serviceChargePercent: number;
  activate?: boolean;
  reason?: string;
  effectiveFrom?: string;
}


export async function getActivePricingConfig(rid: string) {
  if (typeof rid !== 'string' || rid.length === 0) {
    return Promise.reject(new Error("Invalid rid provided to getActivePricingConfig"));
  }
  return client.get(`/api/restaurants/${rid}/pricing`);
}

export async function createPricingConfig(
  rid: string,
  data: PricingConfigPayload
) {
  return client.post(`/api/${rid}/admin/pricing`, data);
}

export async function activatePricingConfig(rid: string, version: number) {
  if (typeof rid !== 'string' || rid.length === 0) {
    return Promise.reject(new Error("Invalid rid provided to activatePricingConfig"));
  }
  return client.patch(`/api/${rid}/admin/pricing/${version}/activate`);
}
