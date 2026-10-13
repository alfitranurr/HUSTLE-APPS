'use client';

import useSWR from 'swr';

/** Indonesian provinces and regencies from a public dataset, with an offline fallback. */

const SOURCE = 'https://ibnux.github.io/data-indonesia';
const ABROAD = 'Other / Abroad';

interface Region {
  id: string;
  name: string;
}

const FALLBACK: Record<string, string[]> = {
  'DKI Jakarta': ['Kota Jakarta Pusat', 'Kota Jakarta Selatan', 'Kota Jakarta Timur', 'Kota Jakarta Barat', 'Kota Jakarta Utara'],
  Banten: ['Kota Tangerang', 'Kota Tangerang Selatan', 'Kabupaten Tangerang', 'Kota Cilegon', 'Kota Serang'],
  'Jawa Barat': ['Kota Bandung', 'Kota Bekasi', 'Kabupaten Bekasi', 'Kota Bogor', 'Kota Depok', 'Kota Cimahi'],
  'Jawa Tengah': ['Kota Semarang', 'Kota Surakarta', 'Kabupaten Kudus'],
  'DI Yogyakarta': ['Kota Yogyakarta', 'Kabupaten Sleman', 'Kabupaten Bantul'],
  'Jawa Timur': ['Kota Surabaya', 'Kota Malang', 'Kabupaten Sidoarjo', 'Kabupaten Gresik'],
  Bali: ['Kota Denpasar', 'Kabupaten Badung'],
  'Sumatera Utara': ['Kota Medan', 'Kota Binjai'],
  Riau: ['Kota Pekanbaru'],
  'Kepulauan Riau': ['Kota Batam', 'Kota Tanjung Pinang'],
  'Sulawesi Selatan': ['Kota Makassar'],
  'Kalimantan Timur': ['Kota Balikpapan', 'Kota Samarinda'],
  [ABROAD]: ['Remote', 'Overseas'],
};

/** Loosely matches "DKI Jakarta" with "Daerah Khusus Ibukota Jakarta", "Kota X" with "X", etc. */
export function sameRegion(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/^(daerah khusus ibukota|d\.k\.i\.)\s+/, 'dki ')
      .replace(/^(daerah istimewa|d\.i\.)\s+/, 'di ')
      .replace(/^(kota|kab\.?|kabupaten|adm\.?)\s+/, '')
      .replace(/\s+/g, ' ');
  return Boolean(a && b) && norm(a) === norm(b);
}

const byName = (a: Region, b: Region) => a.name.localeCompare(b.name);

async function loadProvinces(): Promise<Region[]> {
  try {
    const res = await fetch(`${SOURCE}/provinsi.json`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { id: string; nama: string }[];
    return [...data.map((p) => ({ id: p.id, name: p.nama })).sort(byName), { id: 'abroad', name: ABROAD }];
  } catch {
    return Object.keys(FALLBACK).map((name) => ({ id: `fallback:${name}`, name }));
  }
}

async function loadCities([, province]: [string, Region]): Promise<string[]> {
  const fallback = Object.entries(FALLBACK).find(([name]) => sameRegion(name, province.name))?.[1] ?? [];
  if (province.id === 'abroad' || province.id.startsWith('fallback:')) return fallback;
  try {
    const res = await fetch(`${SOURCE}/kabupaten/${encodeURIComponent(province.id)}.json`);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { nama: string }[];
    return data.map((c) => c.nama).sort((a, b) => a.localeCompare(b));
  } catch {
    return fallback;
  }
}

const STATIC = { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false } as const;

export function useRegions(province: string) {
  const { data: provinces = [], isLoading } = useSWR('regions:provinces', loadProvinces, STATIC);
  const selected = provinces.find((p) => sameRegion(p.name, province));
  const { data: cities = [] } = useSWR(selected ? (['regions:cities', selected] as [string, Region]) : null, loadCities, STATIC);

  return { provinces: provinces.map((p) => p.name), cities, loading: isLoading };
}
