export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoLatLngBounds {
  contain(latlng: KakaoLatLng): boolean;
  getSouthWest(): KakaoLatLng;
  getNorthEast(): KakaoLatLng;
}

export interface KakaoMap {
  getLevel(): number;
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number, options?: { anchor?: KakaoLatLng }): void;
  getCenter(): KakaoLatLng;
  getBounds(): KakaoLatLngBounds;
  relayout(): void;
}

export interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoMarkerClusterer {
  clear(): void;
  addMarkers(markers: KakaoMarker[]): void;
  setMinClusterSize(size: number): void;
}

export interface KakaoCustomOverlay {
  setContent(content: HTMLElement): void;
  setMap(map: KakaoMap | KakaoRoadview | null): void;
  getContent(): HTMLElement;
}

export interface KakaoRoadview {
  getPosition(): KakaoLatLng;
  setPanoId(panoId: string, latLng: KakaoLatLng): void;
}

export interface KakaoRoadviewClient {
  getNearestPanoId(
    latLng: KakaoLatLng,
    radius: number,
    callback: (panoId: string | null) => void
  ): void;
}

export interface KakaoEvent {
  addListener(
    target: KakaoMap | KakaoMarker | KakaoRoadview,
    type: string,
    handler: (...args: unknown[]) => void
  ): void;
  removeListener?(
    target: KakaoMap | KakaoMarker | KakaoRoadview,
    type: string,
    handler: (...args: unknown[]) => void
  ): void;
}

export interface KakaoMouseEvent {
  latLng: KakaoLatLng;
}

export interface KakaoMaps {
  maps: {
    // 기본 Map API
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
    Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
    MarkerClusterer?: new (options: {
      map: KakaoMap;
      averageCenter: boolean;
      minLevel: number;
      disableClickZoom: boolean;
      styles: Array<{
        width: string;
        height: string;
        background: string;
        borderRadius: string;
        color: string;
        textAlign: string;
        lineHeight: string;
        fontSize: string;
        fontWeight: string;
      }>;
    }) => KakaoMarkerClusterer;
    CustomOverlay: new (options: {
      position: KakaoLatLng;
      content: string | HTMLElement;
      yAnchor: number;
      zIndex?: number;
    }) => KakaoCustomOverlay;

    // Roadview API
    RoadviewClient: new () => KakaoRoadviewClient;
    Roadview: new (container: HTMLElement) => KakaoRoadview;

    // 이벤트
    event: KakaoEvent;
  };
}

declare global {
  interface Window {
    kakao: KakaoMaps;
  }
}
