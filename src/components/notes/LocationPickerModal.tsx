import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Search,
  LocateFixed,
  Check,
  Loader2,
  Navigation,
} from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: string;
  initialCoordinates?: string;
  onSelectLocation: (location: string, coordinates: string) => void;
}

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    quarter?: string;
    neighbourhood?: string;
    city_district?: string;
    district?: string;
    town?: string;
    city?: string;
    state?: string;
    province?: string;
    country?: string;
  };
}

// Preset common locations in Vietnam
const QUICK_PRESETS = [
  { name: 'Văn phòng Hà Nội', lat: 21.028511, lng: 105.854167, address: 'Hoàn Kiếm, Hà Nội' },
  { name: 'Văn phòng TP.HCM', lat: 10.776889, lng: 106.700806, address: 'Quận 1, TP. Hồ Chí Minh' },
  { name: 'Chi nhánh Đà Nẵng', lat: 16.06778, lng: 108.22083, address: 'Hải Châu, Đà Nẵng' },
  { name: 'Sân bay Nội Bài', lat: 21.218715, lng: 105.804176, address: 'Sóc Sơn, Hà Nội' },
  { name: 'Sân bay Tân Sơn Nhất', lat: 10.818796, lng: 106.651842, address: 'Tân Bình, TP. Hồ Chí Minh' },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLocation = '',
  initialCoordinates = '',
  onSelectLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [selectedLat, setSelectedLat] = useState<number>(21.028511);
  const [selectedLng, setSelectedLng] = useState<number>(105.854167);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialLocation);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState<boolean>(false);

  // Parse initial coordinates if provided
  useEffect(() => {
    if (!isOpen) return;

    let initLat = 21.028511;
    let initLng = 105.854167;

    const raw = `${initialCoordinates || ''} ${initialLocation || ''}`;
    const match = raw.match(/(-?\d+\.\d+)[^\d,-]+([NSns])?[,\s]+(-?\d+\.\d+)[^\d,-]*([EWew])?/);
    if (match && match[1] && match[3]) {
      let lat = parseFloat(match[1]);
      let lng = parseFloat(match[3]);
      if (match[2]?.toUpperCase() === 'S') lat = -lat;
      if (match[4]?.toUpperCase() === 'W') lng = -lng;
      if (!isNaN(lat) && !isNaN(lng)) {
        initLat = lat;
        initLng = lng;
      }
    }

    setSelectedLat(initLat);
    setSelectedLng(initLng);
    setSelectedAddress(initialLocation || '');
    setSearchQuery('');
    setSearchResults([]);
  }, [isOpen, initialCoordinates, initialLocation]);

  // Reverse geocode lat, lng to address string
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const parts = [
            addr.road || addr.suburb || addr.quarter || addr.neighbourhood,
            addr.city_district || addr.district || addr.town || addr.city,
            addr.state || addr.province,
          ].filter(Boolean);
          const readable = parts.length > 0 ? parts.join(', ') : data.display_name;
          setSelectedAddress(readable);
          return;
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    } finally {
      setIsReverseGeocoding(false);
    }
    setSelectedAddress(`Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
  };

  // Dynamically load Leaflet and initialize map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initMap = async () => {
      // Load CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      const getLeaflet = async (): Promise<any> => {
        if ((window as any).L) return (window as any).L;
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve((window as any).L);
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      try {
        const L = await getLeaflet();
        if (!isMounted || !mapContainerRef.current) return;

        // Cleanup old map instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Custom pin icon
        const pinIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ef4444;
            color: #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
          ">
            <div style="transform: rotate(45deg); width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([selectedLat, selectedLng], 15);

        // Standard OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Zoom control in top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Draggable marker
        const marker = L.marker([selectedLat, selectedLng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        // Handle marker dragend
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setSelectedLat(pos.lat);
          setSelectedLng(pos.lng);
          reverseGeocode(pos.lat, pos.lng);
        });

        // Handle map click
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setSelectedLat(lat);
          setSelectedLng(lng);
          reverseGeocode(lat, lng);
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        // Invalidate size after layout settles
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
      }
    };

    const timer = setTimeout(initMap, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update map view when selectedLat/selectedLng change externally
  const updateMapPosition = (lat: number, lng: number, zoom = 16) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  // Search places via Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=vn&addressdetails=1&limit=6`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search result
  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    updateMapPosition(lat, lng, 16);

    let readable = result.display_name;
    if (result.address) {
      const addr = result.address;
      const parts = [
        addr.road || addr.suburb || addr.quarter || addr.neighbourhood,
        addr.city_district || addr.district || addr.town || addr.city,
        addr.state || addr.province,
      ].filter(Boolean);
      if (parts.length > 0) readable = parts.join(', ');
    }
    setSelectedAddress(readable);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Current GPS button
  const handleGetMyGPS = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGPS(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateMapPosition(lat, lng, 16);
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocatingGPS(false);
        alert(`Không thể lấy vị trí GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm selection
  const handleConfirm = () => {
    const coordString = `${selectedLat.toFixed(6)}° N, ${selectedLng.toFixed(6)}° E`;
    const finalLocation = selectedAddress.trim() || `Vị trí (${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)})`;
    onSelectLocation(finalLocation, coordString);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Chọn vị trí cụ thể trên bản đồ</h3>
              <p className="text-[11px] text-muted-foreground">
                Nhấp hoặc kéo ghim đỏ để chọn vị trí chính xác
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Quick Presets */}
        <div className="p-3 border-b border-border/60 bg-card space-y-2 relative">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm địa chỉ, tòa nhà, đường phố, địa điểm..."
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Tìm</span>
            </button>
            <button
              type="button"
              onClick={handleGetMyGPS}
              disabled={isLocatingGPS}
              className="h-9 px-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              title="Định vị vị trí GPS hiện tại của tôi"
            >
              <LocateFixed className={`w-3.5 h-3.5 text-rose-500 ${isLocatingGPS ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS của tôi</span>
            </button>
          </form>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-[54px] z-20 bg-card border border-border rounded-xl shadow-xl max-h-52 overflow-y-auto p-1 space-y-0.5">
              {searchResults.map((res) => (
                <button
                  key={res.place_id}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted/80 text-xs text-foreground flex items-start gap-2 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Presets row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Gợi ý nhanh:</span>
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => {
                  updateMapPosition(p.lat, p.lng, 16);
                  setSelectedAddress(`${p.name} (${p.address})`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-secondary text-secondary-foreground text-[11px] font-medium shrink-0 transition-colors cursor-pointer border border-border/40"
              >
                <Navigation className="w-2.5 h-2.5 text-primary" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map View */}
        <div className="relative flex-1 min-h-[320px] bg-muted/40">
          <div ref={mapContainerRef} className="w-full h-full min-h-[320px]" />
          {isReverseGeocoding && (
            <div className="absolute top-3 left-3 z-[400] bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border shadow-md flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Đang nhận diện địa chỉ...</span>
            </div>
          )}
        </div>

        {/* Footer: Selected Location info & Actions */}
        <div className="p-3 sm:p-4 border-t border-border bg-card space-y-3">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{selectedAddress || 'Chưa xác định tên địa điểm'}</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono pl-5">
              Tọa độ: {selectedLat.toFixed(6)}° N, {selectedLng.toFixed(6)}° E
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Xác nhận vị trí này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
