import { createPartnerSlug } from './partnerSeo';

export const createStoreSlug = (storeName: string) => createPartnerSlug(storeName).replace(/^partner$/, 'store');

export const getStorePath = (storeId: number, storeName: string) =>
  `/stores/${storeId}/${createStoreSlug(storeName)}`;
