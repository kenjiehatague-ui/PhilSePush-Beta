import { Area } from '../types';
import { storageService } from './storageService';

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  nearestArea: Area;
  rawAddress?: string;
  source: 'gps' | 'ip';
}

export function inferUtilityProvider(city: string, province: string, region: string): { provider: string; lgu: string } {
  const c = (city || '').toLowerCase();
  const p = (province || '').toLowerCase();
  const r = (region || '').toLowerCase();

  let provider = 'Local Electric Cooperative';
  if (c.includes('davao') || p.includes('davao del sur')) {
    provider = 'Davao Light & Power Co. (DLPC)';
  } else if (c.includes('cagayan de oro') || p.includes('misamis oriental')) {
    provider = 'CEPALCO (Cagayan Electric Power & Light Co.)';
  } else if (c.includes('cebu') || c.includes('mandaue') || c.includes('talisay') || c.includes('lapu-lapu')) {
    provider = 'VECO (Visayan Electric Company)';
  } else if (
    r.includes('ncr') ||
    p.includes('metro manila') ||
    p.includes('cavite') ||
    p.includes('laguna') ||
    p.includes('rizal') ||
    p.includes('bulacan') ||
    p.includes('batangas') ||
    c.includes('makati') ||
    c.includes('quezon city') ||
    c.includes('pasig') ||
    c.includes('taguig') ||
    c.includes('manila') ||
    c.includes('mandaluyong') ||
    c.includes('san juan') ||
    c.includes('paranaque') ||
    c.includes('las pinas') ||
    c.includes('muntinlupa') ||
    c.includes('marikina') ||
    c.includes('valenzuela') ||
    c.includes('caloocan') ||
    c.includes('malabon') ||
    c.includes('navotas') ||
    c.includes('pasay')
  ) {
    provider = 'Meralco (Manila Electric Company)';
  } else if (c.includes('iloilo')) {
    provider = 'MORE Electric and Power Corp. (MORE Power)';
  } else if (c.includes('zamboanga')) {
    provider = 'ZAMCELCO';
  } else if (c.includes('general santos') || p.includes('south cotabato')) {
    provider = 'SOCOTECO II';
  } else if (c.includes('bacolod')) {
    provider = 'CENECO';
  } else if (c.includes('baguio') || p.includes('benguet')) {
    provider = 'BENECO';
  } else if (c.includes('tagum') || p.includes('davao del norte')) {
    provider = 'NORDECO (Northern Davao Electric Cooperative)';
  } else if (c.includes('digos') || p.includes('davao del sur')) {
    provider = 'DASURECO';
  } else if (p.includes('cotabato')) {
    provider = 'COTELCO';
  } else if (p.includes('bukidnon')) {
    provider = 'FIBECO / BUKSU';
  } else if (p.includes('leyte') || c.includes('tacloban')) {
    provider = 'LEYTECO / LEYECO';
  }

  const lgu = city ? `City Government of ${city}` : 'Local Government Unit';
  return { provider, lgu };
}

class LocationService {
  private findOrCreateArea(params: {
    barangay: string;
    city: string;
    province: string;
    region: string;
    lat: number;
    lng: number;
  }): Area {
    const areas = storageService.getAreas();
    const rawB = params.barangay.trim();
    const rawC = params.city.trim();

    const bClean = rawB.toLowerCase().replace('barangay', '').trim();
    const cClean = rawC.toLowerCase().replace('city', '').trim();

    // 1. Check if exact or fuzzy match exists in database
    const match = areas.find((a) => {
      const dbB = a.barangay.toLowerCase().replace('barangay', '').trim();
      const dbC = a.cityMunicipality.toLowerCase().replace('city', '').trim();

      const bHit = dbB && bClean && (dbB.includes(bClean) || bClean.includes(dbB));
      const cHit = dbC && cClean && (dbC.includes(cClean) || cClean.includes(dbC));

      return bHit && cHit;
    });

    if (match) {
      return match;
    }

    // 2. Format names
    const formattedBarangay = rawB.toLowerCase().startsWith('barangay')
      ? rawB
      : `Barangay ${rawB}`;

    const formattedCity =
      rawC.toLowerCase().includes('city') || rawC.toLowerCase().includes('municipality')
        ? rawC
        : `${rawC} City`;

    const { provider, lgu } = inferUtilityProvider(formattedCity, params.province, params.region);

    // 3. Dynamically add new Area to storageService database
    const newArea = storageService.addArea({
      region: params.region || 'Region XI (Davao Region)',
      province: params.province || 'Davao del Sur',
      cityMunicipality: formattedCity,
      district: 'District 1',
      barangay: formattedBarangay,
      latitude: Number(params.lat.toFixed(4)),
      longitude: Number(params.lng.toFixed(4)),
      supported: true,
      utilityProvider: provider,
      lguName: lgu
    });

    return newArea;
  }

  public async reverseGeocode(lat: number, lng: number): Promise<Area | null> {
    // Bounds check: Ensure coordinates are in the Philippines
    const isWithinPhilippines = lat >= 4.0 && lat <= 22.0 && lng >= 116.0 && lng <= 127.0;
    if (!isWithinPhilippines) {
      return null;
    }

    // Provider 0: Google Maps Geocoding API if key is available
    const mapsApiKey =
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.VITE_GOOGLE_MAPS_API_KEY : '');
    if (mapsApiKey) {
      try {
        const gRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsApiKey}`
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.results && gData.results.length > 0) {
            let barangay = '';
            let city = '';
            let province = '';
            let region = '';

            for (const res of gData.results) {
              for (const comp of res.address_components) {
                if (
                  !barangay &&
                  (comp.types.includes('sublocality_level_1') ||
                    comp.types.includes('neighborhood') ||
                    comp.types.includes('sublocality'))
                ) {
                  barangay = comp.long_name;
                }
                if (
                  !city &&
                  (comp.types.includes('locality') ||
                    comp.types.includes('administrative_area_level_2'))
                ) {
                  city = comp.long_name;
                }
                if (!province && comp.types.includes('administrative_area_level_2')) {
                  province = comp.long_name;
                }
                if (!region && comp.types.includes('administrative_area_level_1')) {
                  region = comp.long_name;
                }
              }
            }

            if (city || barangay) {
              return this.findOrCreateArea({
                barangay: barangay || `Barangay Center`,
                city: city || 'Local Municipality',
                province: province || 'Local Province',
                region: region || 'Philippines',
                lat,
                lng
              });
            }
          }
        }
      } catch (gErr) {
        console.warn('Google Maps Geocoding error:', gErr);
      }
    }

    // Provider 1: BigDataCloud Reverse Geocoding Client
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        let bdcBarangay =
          bdcData?.locality ||
          bdcData?.localityInfo?.informative?.find((i: any) => i.description === 'suburb')?.name ||
          '';
        let bdcCity =
          bdcData?.city ||
          bdcData?.localityInfo?.administrative?.find((a: any) => a.order === 4 || a.order === 5)?.name ||
          bdcData?.principalSubdivision ||
          '';
        let bdcProvince =
          bdcData?.principalSubdivision ||
          bdcData?.localityInfo?.administrative?.find((a: any) => a.order === 3)?.name ||
          '';
        let bdcRegion =
          bdcData?.localityInfo?.administrative?.find((a: any) => a.order === 2)?.name ||
          'Philippines';

        if (!bdcBarangay && bdcData?.localityInfo?.administrative) {
          const sub = bdcData.localityInfo.administrative.find(
            (a: any) =>
              a.order >= 5 ||
              a.name?.toLowerCase().includes('barangay') ||
              a.name?.toLowerCase().includes('poblacion')
          );
          if (sub) bdcBarangay = sub.name;
        }

        if (bdcCity || bdcBarangay) {
          return this.findOrCreateArea({
            barangay: bdcBarangay || 'Barangay Center',
            city: bdcCity || 'Local City',
            province: bdcProvince || 'Local Province',
            region: bdcRegion || 'Philippines',
            lat,
            lng
          });
        }
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud reverse geocode lookup error:', bdcErr);
    }

    // Provider 2: OpenStreetMap Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data?.address || {};
        const detectedBarangay =
          addr.suburb || addr.quarter || addr.village || addr.neighbourhood || addr.residential || addr.subdivision;
        const detectedCity =
          addr.city || addr.town || addr.municipality || addr.city_district || addr.county;
        const detectedProvince = addr.state_district || addr.state || addr.region;
        const detectedRegion = addr.region || addr.state || 'Philippines';

        if (detectedBarangay || detectedCity) {
          return this.findOrCreateArea({
            barangay: detectedBarangay || 'Barangay Center',
            city: detectedCity || 'Local City',
            province: detectedProvince || 'Local Province',
            region: detectedRegion || 'Philippines',
            lat,
            lng
          });
        }
      }
    } catch (e) {
      console.warn('Nominatim reverse geocode lookup exception:', e);
    }

    // Fallback: Haversine distance match from existing seed list
    return storageService.getNearestArea(lat, lng);
  }

  public async getCurrentPosition(): Promise<GeoLocationResult> {
    const getBrowserCoords = (): Promise<{ lat: number; lng: number; accuracy?: number }> => {
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser.'));
          return;
        }

        let resolved = false;

        // Try high accuracy first
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!resolved) {
              resolved = true;
              resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
            }
          },
          (err) => {
            // Standard accuracy fallback
            navigator.geolocation.getCurrentPosition(
              (pos2) => {
                if (!resolved) {
                  resolved = true;
                  resolve({
                    lat: pos2.coords.latitude,
                    lng: pos2.coords.longitude,
                    accuracy: pos2.coords.accuracy
                  });
                }
              },
              (err2) => {
                if (!resolved) {
                  resolved = true;
                  reject(err2 || err);
                }
              },
              { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
            );
          },
          { timeout: 9000, enableHighAccuracy: true, maximumAge: 10000 }
        );
      });
    };

    try {
      const coords = await getBrowserCoords();
      const nearestArea = await this.reverseGeocode(coords.lat, coords.lng);
      if (nearestArea) {
        return {
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.accuracy,
          nearestArea,
          rawAddress: `${nearestArea.barangay}, ${nearestArea.cityMunicipality}`,
          source: 'gps'
        };
      } else {
        throw new Error(
          `Your GPS position (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}) is outside Philippine territory.`
        );
      }
    } catch (err: any) {
      console.warn('GPS failed or permission denied:', err?.message || err);

      const isPermissionDenied =
        err?.code === 1 ||
        err?.message?.toLowerCase().includes('denied') ||
        err?.message?.toLowerCase().includes('permission');

      if (isPermissionDenied) {
        throw new Error(
          'GPS permission was denied by your browser settings. Please allow location permissions in your browser address bar or choose your Barangay manually from the search or map.'
        );
      }

      throw new Error(
        'Could not access your device GPS position. Please select your Barangay from the quick search or map pin drop below.'
      );
    }
  }

  public getHierarchyOptions() {
    const areas = storageService.getAreas();
    const regions = Array.from(new Set(areas.map((a) => a.region)));
    return {
      regions,
      getProvinces: (region: string) =>
        Array.from(new Set(areas.filter((a) => a.region === region).map((a) => a.province))),
      getCities: (province: string) =>
        Array.from(
          new Set(areas.filter((a) => a.province === province).map((a) => a.cityMunicipality))
        ),
      getBarangays: (city: string) =>
        Array.from(
          new Set(areas.filter((a) => a.cityMunicipality === city).map((a) => a.barangay))
        ),
      getSubdivisions: (barangay: string) =>
        Array.from(
          new Set(
            areas
              .filter((a) => a.barangay === barangay && a.subdivisionVillage)
              .map((a) => a.subdivisionVillage!)
          )
        )
    };
  }
}

export const locationService = new LocationService();


