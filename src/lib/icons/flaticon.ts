/**
 * Flaticon icon search and download.
 * Uses CloakBrowser (Python) to bypass Akamai, then downloads from public CDN.
 */

import { execSync } from 'child_process';

export interface FlaticonIcon {
  id: string;
  name: string;
  /** 512×512 PNG URL on Flaticon CDN */
  cdnUrl: string;
  /** 128×128 thumbnail URL */
  thumbnailUrl: string;
}

const FLATICON_CDN = 'https://cdn-icons-png.flaticon.com';

/**
 * Search Flaticon using CloakBrowser (Python) to bypass Akamai.
 */
export async function searchFlaticon(query: string): Promise<FlaticonIcon[]> {
  try {
    const scriptPath = `${process.cwd()}/scripts/flaticon-search.py`;
    const output = execSync(
      `/usr/bin/python3 ${scriptPath} ${escapeShell(query)} 2>/dev/null`,
      { timeout: 30000, maxBuffer: 1024 * 1024 }
    ).toString();

    const icons: FlaticonIcon[] = JSON.parse(output);
    if (icons.length > 0) return icons;
  } catch (err) {
    console.warn('CloakBrowser search failed, using fallback:', (err as Error).message);
  }

  return getFallbackIcons(query);
}

function escapeShell(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

/**
 * Fallback: curated map of common icon names → Flaticon IDs.
 */
const CURATED_ICONS: Record<string, { id: string; name: string }[]> = {
  cloud: [
    { id: '3222791', name: 'Cloud' },
    { id: '2929984', name: 'Cloud Outline' },
    { id: '1163624', name: 'Cloud Computing' },
    { id: '6800631', name: 'Cloud Service' },
    { id: '9421117', name: 'Cloud Storage' },
  ],
  server: [
    { id: '2318786', name: 'Server' },
    { id: '6239384', name: 'Server Rack' },
    { id: '4530518', name: 'Database Server' },
    { id: '2772122', name: 'Cloud Server' },
  ],
  network: [
    { id: '8122680', name: 'Global Network' },
    { id: '2906094', name: 'Network' },
    { id: '5639899', name: 'Network Connection' },
  ],
  security: [
    { id: '4663237', name: 'Shield' },
    { id: '2951220', name: 'Security Shield' },
    { id: '5644240', name: 'Shield Check' },
    { id: '3485784', name: 'Cyber Security' },
  ],
  shield: [
    { id: '4663237', name: 'Shield' },
    { id: '2951220', name: 'Security Shield' },
    { id: '5644240', name: 'Shield Check' },
  ],
  user: [
    { id: '2919790', name: 'User' },
    { id: '6596121', name: 'User Profile' },
    { id: '4417097', name: 'User Group' },
  ],
  settings: [
    { id: '4644000', name: 'Settings' },
    { id: '2091520', name: 'Gear' },
    { id: '3163491', name: 'Settings Cog' },
  ],
  star: [
    { id: '1828884', name: 'Star' },
    { id: '616430', name: 'Star Outline' },
    { id: '2103505', name: 'Star Rating' },
  ],
  check: [
    { id: '190411', name: 'Check' },
    { id: '5612344', name: 'Check Circle' },
    { id: '3917032', name: 'Check Mark' },
  ],
  globe: [
    { id: '2531997', name: 'Globe' },
    { id: '1626218', name: 'World' },
    { id: '8122680', name: 'Global Network' },
  ],
  arrow: [
    { id: '271226', name: 'Arrow Right' },
    { id: '271228', name: 'Arrow Up' },
    { id: '2989988', name: 'Arrow Down' },
  ],
  lock: [
    { id: '3068959', name: 'Lock' },
    { id: '667383', name: 'Padlock' },
    { id: '2225188', name: 'Secure Lock' },
  ],
  mail: [
    { id: '542639', name: 'Email' },
    { id: '561127', name: 'Mail' },
    { id: '732204', name: 'Envelope' },
  ],
  phone: [
    { id: '3406344', name: 'Phone' },
    { id: '724664', name: 'Smartphone' },
    { id: '5612444', name: 'Call' },
  ],
  chart: [
    { id: '2284916', name: 'Bar Chart' },
    { id: '542648', name: 'Pie Chart' },
    { id: '2949997', name: 'Line Chart' },
  ],
  download: [
    { id: '3586009', name: 'Download' },
    { id: '724933', name: 'Download Arrow' },
    { id: '2981027', name: 'Download File' },
  ],
  upload: [
    { id: '2981031', name: 'Upload' },
    { id: '724937', name: 'Upload Arrow' },
    { id: '2981029', name: 'Upload File' },
  ],
};

function getFallbackIcons(query: string): FlaticonIcon[] {
  const q = query.toLowerCase().trim();

  // Direct match
  if (CURATED_ICONS[q]) {
    return CURATED_ICONS[q].map((ic) => ({
      id: ic.id,
      name: ic.name,
      cdnUrl: `${FLATICON_CDN}/512/${ic.id.slice(0, 4)}/${ic.id}.png`,
      thumbnailUrl: `${FLATICON_CDN}/128/${ic.id.slice(0, 4)}/${ic.id}.png`,
    }));
  }

  // Partial match across all curated icons
  const all = Object.values(CURATED_ICONS).flat();
  const matched = all.filter(
    (ic) => ic.name.toLowerCase().includes(q) || ic.id === q
  );

  if (matched.length > 0) {
    return matched.slice(0, 15).map((ic) => ({
      id: ic.id,
      name: ic.name,
      cdnUrl: `${FLATICON_CDN}/512/${ic.id.slice(0, 4)}/${ic.id}.png`,
      thumbnailUrl: `${FLATICON_CDN}/128/${ic.id.slice(0, 4)}/${ic.id}.png`,
    }));
  }

  return all.slice(0, 10).map((ic) => ({
    id: ic.id,
    name: ic.name,
    cdnUrl: `${FLATICON_CDN}/512/${ic.id.slice(0, 4)}/${ic.id}.png`,
    thumbnailUrl: `${FLATICON_CDN}/128/${ic.id.slice(0, 4)}/${ic.id}.png`,
  }));
}
