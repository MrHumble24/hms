import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  branchId: string;
  userId?: string;
  userRole?: string;
}

export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore();
}
