export interface PlatformBenefit {
  benefitId?: number | string | null;
  carrier?: string | null;
  grade: string;
  context: string;
  onlineContext?: string | null;
  offlineContext?: string | null;
}

export interface Platform {
  id: string;
  storeId: number;
  partnerId: number;
  partnerName?: string;
  name: string;
  category: string;
  business: string;
  city: string;
  town: string;
  legalDong: string;
  address: string;
  roadName: string;
  roadAddress: string;
  postCode: string;
  latitude: number;
  longitude: number;
  carrier?: string | null;
  benefits: string[];
  benefitDetails?: PlatformBenefit[];
  rating: number;
  distance: number;
  hasCoupon: boolean;
  imageUrl?: string;
  phone?: string;
  hours?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface MapLocation {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface MapCluster {
  clusterId: string;
  category: string;
  administrativeUnitType?: 'LEGAL_DONG' | 'TOWN' | 'CITY' | 'GRID' | null;
  administrativeUnitName?: string | null;
  targetMapLevel?: number | null;
  latitude: number;
  longitude: number;
  count: number;
}
