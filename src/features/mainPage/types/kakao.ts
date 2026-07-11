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
  setPosition(position: KakaoLatLng): void;
}

export interface KakaoMarkerImage {
  readonly __kakaoMarkerImageBrand?: never;
}

export interface KakaoSize {
  readonly __kakaoSizeBrand?: never;
}

export interface KakaoPoint {
  readonly __kakaoPointBrand?: never;
}

export interface KakaoMarkerClusterer {
  clear(): void;
  addMarkers(markers: KakaoMarker[], nodraw?: boolean): void;
  removeMarkers(markers: KakaoMarker[], nodraw?: boolean): void;
  redraw(): void;
  setMinClusterSize(size: number): void;
}

export interface KakaoCustomOverlay {
  setContent(content: HTMLElement): void;
  setMap(map: KakaoMap | KakaoRoadview | null): void;
  setPosition(position: KakaoLatLng): void;
  setZIndex(zIndex: number): void;
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
    Marker: new (options: {
      position: KakaoLatLng;
      map?: KakaoMap;
      image?: KakaoMarkerImage;
      clickable?: boolean;
      title?: string;
      zIndex?: number;
    }) => KakaoMarker;
    MarkerImage: new (
      src: string,
      size: KakaoSize,
      options?: { offset?: KakaoPoint; alt?: string }
    ) => KakaoMarkerImage;
    Size: new (width: number, height: number) => KakaoSize;
    Point: new (x: number, y: number) => KakaoPoint;
    MarkerClusterer?: new (options: {
      map: KakaoMap;
      averageCenter: boolean;
      minLevel: number;
      disableClickZoom: boolean;
      styles: Array<Record<string, string>>;
    }) => KakaoMarkerClusterer;
    CustomOverlay: new (options: {
      position: KakaoLatLng;
      content: string | HTMLElement;
      clickable?: boolean;
      xAnchor?: number;
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
