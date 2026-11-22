export type MediaType = 'image' | 'video';
export type StorageSource = 'internal' | 'external';
export type GalleryTab = 'pictures' | 'albums' | 'external' | 'menu';
export type SpecialCollection = 'favorites' | 'videos' | 'recent' | 'trash';
export type GallerySortOrder = 'date_desc' | 'date_asc' | 'name_asc' | 'size_desc';
export type ThemeMode = 'dark' | 'light';

export interface MediaExif {
  cameraModel: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
  focalLength: string;
  gps?: string;
}

export interface GalleryMediaItem {
  id: string;
  displayName: string;
  type: MediaType;
  src: string;
  dateTakenMs: number;
  sizeBytes: number;
  width: number;
  height: number;
  durationMs: number;
  mimeType: string;
  albumId: string;
  albumName: string;
  storagePath: string;
  source: StorageSource;
  isFavorite: boolean;
  isTrashed: boolean;
  exif?: MediaExif;
  videoPalette?: [string, string, string];
}

export interface CustomAlbumEntry {
  id: string;
  name: string;
  source: StorageSource;
  storagePath: string;
  createdAtMs: number;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  coverItem: GalleryMediaItem | null;
  itemCount: number;
  totalSizeBytes: number;
  source: StorageSource;
  storagePath: string;
  isMerged?: boolean;
  mergedAlbumIds?: string[];
  isCustomEmpty?: boolean;
}

export interface GallerySettingsState {
  fullScreenScrolling: boolean;
  autoPlayVideos: boolean;
  originalAspectRatioGrid: boolean;
  showFormatBadges: boolean;
  essentialAlbumsEnabled: boolean;
  essentialAlbumIds: string[];
  mergeAlbums: boolean;
  hiddenAlbumIds: string[];
  showEmptyAlbums: boolean;
  showFullExifLocation: boolean;
  trashRetention30Days: boolean;
}

export const DEFAULT_GALLERY_SETTINGS: GallerySettingsState = {
  fullScreenScrolling: true,
  autoPlayVideos: true,
  originalAspectRatioGrid: false,
  showFormatBadges: true,
  essentialAlbumsEnabled: false,
  essentialAlbumIds: [],
  mergeAlbums: false,
  hiddenAlbumIds: [],
  showEmptyAlbums: true,
  showFullExifLocation: true,
  trashRetention30Days: true,
};

export interface DateSectionGroup {
  key: string;
  title: string;
  monthBadge: string;
  items: GalleryMediaItem[];
}

export interface ExternalDriveConfig {
  id: string;
  label: string;
  deviceModel: string;
  mounted: boolean;
  scanTimeMs: number;
  capacityLabel: string;
}

export const PHOTO_ASSETS = {
  kyoto: '/src/assets/images/photo_kyoto_dusk_1795192190970.jpg',
  alpine: '/src/assets/images/photo_alpine_ridge_1795192182660.jpg',
  concrete: '/src/assets/images/photo_brutalist_concrete_1795192187467.jpg',
  coast: '/src/assets/images/photo_pacific_coast_1795192186768.jpg',
  espresso: '/src/assets/images/photo_artisan_espresso_1795192184699.jpg',
  seoul: '/src/assets/images/photo_seoul_skyline_1795192183468.jpg',
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
export const SEED_REFERENCE_TIME = Date.UTC(2026, 10, 20, 16, 0, 0); // Nov 20, 2026

export function createSeedLibrary(): GalleryMediaItem[] {
  const ref = SEED_REFERENCE_TIME;
  return [
    {
      id: 'img-seoul-night',
      displayName: '20261120_194218_S25U.jpg',
      type: 'image',
      src: PHOTO_ASSETS.seoul,
      dateTakenMs: ref - 2 * 60 * 60 * 1000,
      sizeBytes: 14_820_410,
      width: 4000,
      height: 2252,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'camera',
      albumName: 'Camera',
      storagePath: '/storage/emulated/0/DCIM/Camera/',
      source: 'internal',
      isFavorite: true,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP',
        aperture: 'f/1.7',
        shutter: '1/15s',
        iso: 'ISO 640',
        focalLength: '6.3 mm',
        gps: '37.55120, 126.98822',
      },
    },
    {
      id: 'vid-kyoto-rain',
      displayName: '20261120_181004_4K60.mp4',
      type: 'video',
      src: PHOTO_ASSETS.kyoto,
      dateTakenMs: ref - 4 * 60 * 60 * 1000,
      sizeBytes: 164_520_900,
      width: 3840,
      height: 2160,
      durationMs: 42_000,
      mimeType: 'video/mp4',
      albumId: 'camera',
      albumName: 'Camera',
      storagePath: '/storage/emulated/0/DCIM/Camera/',
      source: 'internal',
      isFavorite: true,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide · HEVC 10-bit',
        aperture: 'f/1.7',
        shutter: '1/120s',
        iso: 'ISO 400',
        focalLength: '6.3 mm',
        gps: '35.00366, 135.77855',
      },
      videoPalette: ['#0E1C2F', '#29486B', '#F59E0B'],
    },
    {
      id: 'img-espresso-morning',
      displayName: '20261120_091422.jpg',
      type: 'image',
      src: PHOTO_ASSETS.espresso,
      dateTakenMs: ref - 7 * 60 * 60 * 1000,
      sizeBytes: 9_420_880,
      width: 3000,
      height: 4000,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'camera',
      albumName: 'Camera',
      storagePath: '/storage/emulated/0/DCIM/Camera/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '69mm 3x Telephoto',
        aperture: 'f/2.4',
        shutter: '1/125s',
        iso: 'ISO 160',
        focalLength: '7.9 mm',
      },
    },
    {
      id: 'img-coast-morning-today',
      displayName: '20261120_073510.jpg',
      type: 'image',
      src: PHOTO_ASSETS.coast,
      dateTakenMs: ref - 8 * 60 * 60 * 1000,
      sizeBytes: 13_180_420,
      width: 4000,
      height: 3000,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'camera',
      albumName: 'Camera',
      storagePath: '/storage/emulated/0/DCIM/Camera/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP',
        aperture: 'f/1.7',
        shutter: '1/250s',
        iso: 'ISO 100',
        focalLength: '6.3 mm',
      },
    },
    {
      id: 'img-atrium-geometry',
      displayName: '20261119_154012_PRO.dng',
      type: 'image',
      src: PHOTO_ASSETS.concrete,
      dateTakenMs: ref - 1 * DAY_MS - 3 * 60 * 60 * 1000,
      sizeBytes: 38_140_220,
      width: 4000,
      height: 4000,
      durationMs: 0,
      mimeType: 'image/x-adobe-dng',
      albumId: 'expert-raw',
      albumName: 'Expert RAW',
      storagePath: '/storage/emulated/0/DCIM/Expert RAW/',
      source: 'internal',
      isFavorite: true,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '13mm Ultra-Wide 50MP',
        aperture: 'f/1.9',
        shutter: '1/640s',
        iso: 'ISO 50',
        focalLength: '2.2 mm',
      },
    },
    {
      id: 'img-alpine-dawn',
      displayName: '20261119_064855_5X.jpg',
      type: 'image',
      src: PHOTO_ASSETS.alpine,
      dateTakenMs: ref - 1 * DAY_MS - 5 * 60 * 60 * 1000,
      sizeBytes: 18_710_340,
      width: 3060,
      height: 4080,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'travel',
      albumName: 'Dolomites',
      storagePath: '/storage/emulated/0/Pictures/Dolomites/',
      source: 'internal',
      isFavorite: true,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '115mm 5x Periscope 50MP',
        aperture: 'f/3.4',
        shutter: '1/800s',
        iso: 'ISO 64',
        focalLength: '18.6 mm',
        gps: '46.61868, 12.30276',
      },
    },
    {
      id: 'img-seoul-dusk-yest',
      displayName: '20261119_201244.jpg',
      type: 'image',
      src: PHOTO_ASSETS.seoul,
      dateTakenMs: ref - 1 * DAY_MS - 1 * 60 * 60 * 1000,
      sizeBytes: 15_110_200,
      width: 4000,
      height: 2252,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'camera',
      albumName: 'Camera',
      storagePath: '/storage/emulated/0/DCIM/Camera/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP',
        aperture: 'f/1.7',
        shutter: '1/30s',
        iso: 'ISO 500',
        focalLength: '6.3 mm',
      },
    },
    {
      id: 'img-espresso-yest',
      displayName: '20261119_104501_PRO.dng',
      type: 'image',
      src: PHOTO_ASSETS.espresso,
      dateTakenMs: ref - 1 * DAY_MS - 7 * 60 * 60 * 1000,
      sizeBytes: 34_890_000,
      width: 3000,
      height: 4000,
      durationMs: 0,
      mimeType: 'image/x-adobe-dng',
      albumId: 'expert-raw',
      albumName: 'Expert RAW',
      storagePath: '/storage/emulated/0/DCIM/Expert RAW/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '69mm 3x Telephoto',
        aperture: 'f/2.4',
        shutter: '1/160s',
        iso: 'ISO 100',
        focalLength: '7.9 mm',
      },
    },
    {
      id: 'vid-coast-surf',
      displayName: '20261028_174410_8K30.mp4',
      type: 'video',
      src: PHOTO_ASSETS.coast,
      dateTakenMs: ref - 23 * DAY_MS,
      sizeBytes: 312_480_000,
      width: 7680,
      height: 4320,
      durationMs: 68_000,
      mimeType: 'video/mp4',
      albumId: 'travel',
      albumName: 'Dolomites',
      storagePath: '/storage/emulated/0/Pictures/Dolomites/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide · 8K30 Log',
        aperture: 'f/1.7',
        shutter: '1/60s',
        iso: 'ISO 125',
        focalLength: '6.3 mm',
      },
      videoPalette: ['#1E2A38', '#4A6178', '#9BB3C7'],
    },
    {
      id: 'img-kyoto-lanterns',
      displayName: '20261028_191208.gif',
      type: 'image',
      src: PHOTO_ASSETS.kyoto,
      dateTakenMs: ref - 23 * DAY_MS - 3_600_000,
      sizeBytes: 11_205_900,
      width: 4000,
      height: 3000,
      durationMs: 0,
      mimeType: 'image/gif',
      albumId: 'camera',
      albumName: 'Camera',
      storagePath: '/storage/emulated/0/DCIM/Camera/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP',
        aperture: 'f/1.7',
        shutter: '1/30s',
        iso: 'ISO 500',
        focalLength: '6.3 mm',
      },
    },
    {
      id: 'img-coast-stacks',
      displayName: '20260914_193310.jpg',
      type: 'image',
      src: PHOTO_ASSETS.coast,
      dateTakenMs: ref - 67 * DAY_MS,
      sizeBytes: 12_890_000,
      width: 4000,
      height: 3000,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'wallpapers',
      albumName: 'Wallpapers',
      storagePath: '/storage/emulated/0/Pictures/Wallpapers/',
      source: 'internal',
      isFavorite: true,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide · ND Long Exp',
        aperture: 'f/1.7',
        shutter: '2.0s',
        iso: 'ISO 50',
        focalLength: '6.3 mm',
      },
    },
    {
      id: 'img-seoul-edit',
      displayName: '20260914_211044_HDR.jpg',
      type: 'image',
      src: PHOTO_ASSETS.seoul,
      dateTakenMs: ref - 67 * DAY_MS - 7_200_000,
      sizeBytes: 16_040_120,
      width: 4000,
      height: 2252,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'wallpapers',
      albumName: 'Wallpapers',
      storagePath: '/storage/emulated/0/Pictures/Wallpapers/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP',
        aperture: 'f/1.7',
        shutter: '1/20s',
        iso: 'ISO 800',
        focalLength: '6.3 mm',
      },
    },
    {
      id: 'img-concrete-study-trash',
      displayName: '20260802_112000_draft.jpg',
      type: 'image',
      src: PHOTO_ASSETS.concrete,
      dateTakenMs: ref - 110 * DAY_MS,
      sizeBytes: 6_340_110,
      width: 3000,
      height: 3000,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'expert-raw',
      albumName: 'Expert RAW',
      storagePath: '/storage/emulated/0/DCIM/Expert RAW/',
      source: 'internal',
      isFavorite: false,
      isTrashed: true,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '13mm Ultra-Wide',
        aperture: 'f/1.9',
        shutter: '1/500s',
        iso: 'ISO 50',
        focalLength: '2.2 mm',
      },
    },
    // Plug-and-play External USB-C NVMe Drive (SAF DocumentsContract indexed)
    {
      id: 'ext-dng-alpine',
      displayName: 'S25U_Dolomites_200MP.dng',
      type: 'image',
      src: PHOTO_ASSETS.alpine,
      dateTakenMs: ref - 3 * DAY_MS,
      sizeBytes: 84_210_560,
      width: 12240,
      height: 16320,
      durationMs: 0,
      mimeType: 'image/x-adobe-dng',
      albumId: 'ext-dolomites',
      albumName: 'Dolomites',
      storagePath: 'USB-C NVMe:/Samsung_T9_2TB/Dolomites/',
      source: 'external',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP RAW',
        aperture: 'f/1.7',
        shutter: '1/1000s',
        iso: 'ISO 50',
        focalLength: '6.3 mm',
        gps: '46.61868, 12.30276',
      },
    },
    {
      id: 'ext-dng-concrete',
      displayName: 'Museum_Atrium_16bit.dng',
      type: 'image',
      src: PHOTO_ASSETS.concrete,
      dateTakenMs: ref - 3 * DAY_MS - 4_000_000,
      sizeBytes: 76_490_000,
      width: 8160,
      height: 8160,
      durationMs: 0,
      mimeType: 'image/x-adobe-dng',
      albumId: 'ext-raw-dng',
      albumName: 'RAW_S25U_DNG',
      storagePath: 'USB-C NVMe:/Samsung_T9_2TB/RAW_S25U_DNG/',
      source: 'external',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '13mm Ultra-Wide 50MP',
        aperture: 'f/1.9',
        shutter: '1/400s',
        iso: 'ISO 64',
        focalLength: '2.2 mm',
      },
    },
    {
      id: 'ext-vid-seoul-log',
      displayName: 'Seoul_Rain_8K30_GalaxyLog.mp4',
      type: 'video',
      src: PHOTO_ASSETS.seoul,
      dateTakenMs: ref - 5 * DAY_MS,
      sizeBytes: 1_420_000_000,
      width: 7680,
      height: 4320,
      durationMs: 95_000,
      mimeType: 'video/mp4',
      albumId: 'ext-8k-log',
      albumName: '8K_Log_Footage',
      storagePath: 'USB-C NVMe:/Samsung_T9_2TB/8K_Log_Footage/',
      source: 'external',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide · Direct USB-C SSD Recording',
        aperture: 'f/1.7',
        shutter: '1/60s',
        iso: 'ISO 800',
        focalLength: '6.3 mm',
      },
      videoPalette: ['#080C17', '#1D3354', '#A1A1AA'],
    },
    {
      id: 'ext-kyoto-street',
      displayName: 'Gion_Lanterns_BlueHour.jpg',
      type: 'image',
      src: PHOTO_ASSETS.kyoto,
      dateTakenMs: ref - 12 * DAY_MS,
      sizeBytes: 15_320_000,
      width: 4000,
      height: 3000,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'ext-kyoto-trip',
      albumName: 'Kyoto_Trip',
      storagePath: 'USB-C NVMe:/Samsung_T9_2TB/Kyoto_Trip/',
      source: 'external',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '23mm Wide 200MP',
        aperture: 'f/1.7',
        shutter: '1/25s',
        iso: 'ISO 640',
        focalLength: '6.3 mm',
      },
    },
    {
      id: 'ext-kyoto-cafe',
      displayName: 'Kissa_Espresso_35mm.jpg',
      type: 'image',
      src: PHOTO_ASSETS.espresso,
      dateTakenMs: ref - 12 * DAY_MS - 5_000_000,
      sizeBytes: 10_410_200,
      width: 3000,
      height: 4000,
      durationMs: 0,
      mimeType: 'image/jpeg',
      albumId: 'ext-kyoto-trip',
      albumName: 'Kyoto_Trip',
      storagePath: 'USB-C NVMe:/Samsung_T9_2TB/Kyoto_Trip/',
      source: 'external',
      isFavorite: false,
      isTrashed: false,
      exif: {
        cameraModel: 'Samsung Galaxy S25 Ultra',
        lens: '69mm 3x Telephoto',
        aperture: 'f/2.4',
        shutter: '1/100s',
        iso: 'ISO 200',
        focalLength: '7.9 mm',
      },
    },
  ];
}

export const INITIAL_EXTERNAL_DRIVE: ExternalDriveConfig = {
  id: 'usb-t9-nvme',
  label: 'Samsung T9 2TB NVMe',
  deviceModel: 'USB 3.2 Gen 2x2 · SAF Direct Tree',
  mounted: true,
  scanTimeMs: 14,
  capacityLabel: '2 TB NVMe SSD',
};

export function clampColumns(columns: number, min = 2, max = 5): number {
  return Math.max(min, Math.min(max, Math.round(columns)));
}

export function getFormatBadge(item: GalleryMediaItem): 'RAW' | '8K' | '4K' | 'GIF' | null {
  const lower = item.displayName.toLowerCase();
  const mime = item.mimeType.toLowerCase();
  if (lower.endsWith('.dng') || mime.includes('dng') || mime.includes('raw')) return 'RAW';
  if (lower.endsWith('.gif') || mime === 'image/gif') return 'GIF';
  if (item.type === 'video' && (item.width >= 7000 || item.height >= 4000)) return '8K';
  if (item.type === 'video' && (item.width >= 3800 || item.height >= 2100)) return '4K';
  return null;
}

export function createEmptyAlbumRecord(
  name: string,
  source: StorageSource,
  externalDriveLabel = 'Samsung_T9_2TB'
): CustomAlbumEntry | null {
  const cleaned = name.trim().replace(/[\\/]/g, '');
  if (!cleaned) return null;
  const slug = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: `custom-${source}-${slug || 'album'}-${Date.now()}`,
    name: cleaned,
    source,
    storagePath:
      source === 'external'
        ? `USB-C NVMe:/${externalDriveLabel}/${cleaned}/`
        : `/storage/emulated/0/Pictures/${cleaned}/`,
    createdAtMs: Date.now(),
  };
}

export function filterAndSortMedia(
  items: GalleryMediaItem[],
  query: string,
  sortOrder: GallerySortOrder
): GalleryMediaItem[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (item) =>
          item.displayName.toLowerCase().includes(q) ||
          item.albumName.toLowerCase().includes(q) ||
          item.storagePath.toLowerCase().includes(q) ||
          item.mimeType.toLowerCase().includes(q) ||
          (item.exif?.cameraModel.toLowerCase().includes(q) ?? false)
      )
    : items;

  const copy = [...filtered];
  switch (sortOrder) {
    case 'date_desc':
      return copy.sort((a, b) => b.dateTakenMs - a.dateTakenMs);
    case 'date_asc':
      return copy.sort((a, b) => a.dateTakenMs - b.dateTakenMs);
    case 'name_asc':
      return copy.sort((a, b) => a.displayName.localeCompare(b.displayName));
    case 'size_desc':
      return copy.sort((a, b) => b.sizeBytes - a.sizeBytes);
  }
}

export function groupMediaByDate(
  items: GalleryMediaItem[],
  referenceEpochMs = SEED_REFERENCE_TIME
): DateSectionGroup[] {
  if (items.length === 0) return [];

  const toDayKey = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  const todayKey = toDayKey(referenceEpochMs);
  const yesterdayKey = toDayKey(referenceEpochMs - DAY_MS);

  const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const titleFmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const map = new Map<string, GalleryMediaItem[]>();
  for (const item of items) {
    const key = toDayKey(item.dateTakenMs);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return Array.from(map.entries()).map(([key, groupItems]) => {
    const sampleDate = new Date(groupItems[0].dateTakenMs);
    const title =
      key === todayKey ? 'Today' : key === yesterdayKey ? 'Yesterday' : titleFmt.format(sampleDate);
    return {
      key,
      title,
      monthBadge: monthFmt.format(sampleDate),
      items: groupItems,
    };
  });
}

export function buildAlbums(items: GalleryMediaItem[], source: StorageSource): GalleryAlbum[] {
  const scoped = items.filter((i) => i.source === source && !i.isTrashed);
  const map = new Map<string, GalleryMediaItem[]>();
  for (const item of scoped) {
    const arr = map.get(item.albumId);
    if (arr) arr.push(item);
    else map.set(item.albumId, [item]);
  }

  return Array.from(map.entries())
    .map(([albumId, bucketItems]) => {
      const sorted = [...bucketItems].sort((a, b) => b.dateTakenMs - a.dateTakenMs);
      const cover = sorted[0];
      return {
        id: albumId,
        name: cover.albumName,
        coverItem: cover,
        itemCount: sorted.length,
        totalSizeBytes: sorted.reduce((acc, cur) => acc + cur.sizeBytes, 0),
        source,
        storagePath: cover.storagePath,
        mergedAlbumIds: [albumId],
        isMerged: false,
        isCustomEmpty: false,
      };
    })
    .sort((a, b) => {
      if (a.name === 'Camera') return -1;
      if (b.name === 'Camera') return 1;
      return (b.coverItem?.dateTakenMs ?? 0) - (a.coverItem?.dateTakenMs ?? 0);
    });
}

/**
 * Computes all available albums including persistent 0-item empty albums and optional
 * Internal + External same-name album merging.
 */
export function computeAllAlbums(
  items: GalleryMediaItem[],
  customAlbums: CustomAlbumEntry[],
  externalMounted: boolean,
  settings: GallerySettingsState
): GalleryAlbum[] {
  const internalAlbums = buildAlbums(items, 'internal');
  const externalAlbums = externalMounted ? buildAlbums(items, 'external') : [];
  const baseList: GalleryAlbum[] = [...internalAlbums];

  if (settings.showEmptyAlbums) {
    for (const custom of customAlbums) {
      if (custom.source === 'external' && !externalMounted) continue;
      const existsInMedia = [...internalAlbums, ...externalAlbums].some(
        (a) => a.name.toLowerCase() === custom.name.toLowerCase() && a.source === custom.source
      );
      if (!existsInMedia) {
        baseList.push({
          id: custom.id,
          name: custom.name,
          coverItem: null,
          itemCount: 0,
          totalSizeBytes: 0,
          source: custom.source,
          storagePath: custom.storagePath,
          isCustomEmpty: true,
          isMerged: false,
          mergedAlbumIds: [custom.id],
        });
      }
    }
  }

  const sortAlbums = (list: GalleryAlbum[]) =>
    list.sort((a, b) => {
      if (a.name.toLowerCase() === 'camera') return -1;
      if (b.name.toLowerCase() === 'camera') return 1;
      if (a.isCustomEmpty && !b.isCustomEmpty) return -1;
      if (!a.isCustomEmpty && b.isCustomEmpty) return 1;
      return (b.coverItem?.dateTakenMs ?? Number.MAX_SAFE_INTEGER) - (a.coverItem?.dateTakenMs ?? Number.MAX_SAFE_INTEGER);
    });

  if (!settings.mergeAlbums) {
    return sortAlbums(baseList);
  }

  // Merge identically-named folders across Internal Storage & External USB-C/NVMe Drive
  const combined = [...baseList, ...externalAlbums];
  const byName = new Map<string, GalleryAlbum[]>();
  for (const album of combined) {
    const key = album.name.trim().toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(album);
    byName.set(key, list);
  }

  const merged: GalleryAlbum[] = Array.from(byName.values()).map((group) => {
    if (group.length === 1) return group[0];
    const primary = group.find((a) => a.source === 'internal') ?? group[0];
    const covers = group
      .map((a) => a.coverItem)
      .filter((c): c is GalleryMediaItem => c !== null)
      .sort((a, b) => b.dateTakenMs - a.dateTakenMs);
    const mergedIds = Array.from(new Set(group.flatMap((a) => a.mergedAlbumIds ?? [a.id])));
    return {
      ...primary,
      coverItem: covers[0] ?? null,
      itemCount: group.reduce((acc, a) => acc + a.itemCount, 0),
      totalSizeBytes: group.reduce((acc, a) => acc + a.totalSizeBytes, 0),
      isMerged: true,
      mergedAlbumIds: mergedIds,
      isCustomEmpty: group.every((a) => a.isCustomEmpty),
    };
  });

  return sortAlbums(merged);
}

/**
 * Applies Hide Albums, Select Essential Albums, and live search filtering for the Albums tab.
 */
export function computeVisibleAlbums(
  allAlbums: GalleryAlbum[],
  settings: GallerySettingsState,
  searchQuery = ''
): GalleryAlbum[] {
  const hiddenSet = new Set(settings.hiddenAlbumIds);
  const essentialSet = new Set(settings.essentialAlbumIds);

  const notHidden = allAlbums.filter((album) => {
    if (hiddenSet.has(album.id)) return false;
    if (album.mergedAlbumIds?.some((id) => hiddenSet.has(id))) return false;
    return true;
  });

  const essentialFiltered =
    settings.essentialAlbumsEnabled && essentialSet.size > 0
      ? notHidden.filter((album) => essentialSet.has(album.id) || album.isCustomEmpty)
      : notHidden;

  const q = searchQuery.trim().toLowerCase();
  if (!q) return essentialFiltered;
  return essentialFiltered.filter((a) => a.name.toLowerCase().includes(q));
}

export function toggleFavoriteItems(
  items: GalleryMediaItem[],
  selectedIds: Set<string>
): GalleryMediaItem[] {
  const targets = items.filter((i) => selectedIds.has(i.id));
  if (targets.length === 0) return items;
  const shouldFavorite = targets.some((i) => !i.isFavorite);
  return items.map((item) =>
    selectedIds.has(item.id) ? { ...item, isFavorite: shouldFavorite } : item
  );
}

export function renameMediaItem(
  items: GalleryMediaItem[],
  id: string,
  newName: string
): GalleryMediaItem[] {
  const cleaned = newName.trim();
  if (!cleaned) return items;
  return items.map((item) => (item.id === id ? { ...item, displayName: cleaned } : item));
}

export function copyOrMoveMediaItems(
  items: GalleryMediaItem[],
  selectedIds: Set<string>,
  targetAlbum: Pick<GalleryAlbum, 'id' | 'name' | 'source' | 'storagePath'>,
  isMove: boolean
): GalleryMediaItem[] {
  const targets = items.filter((i) => selectedIds.has(i.id));
  if (targets.length === 0) return items;

  if (isMove) {
    return items.map((item) =>
      selectedIds.has(item.id)
        ? {
            ...item,
            albumId: targetAlbum.id,
            albumName: targetAlbum.name,
            source: targetAlbum.source,
            storagePath: targetAlbum.storagePath,
          }
        : item
    );
  }

  const copies: GalleryMediaItem[] = targets.map((item, idx) => ({
    ...item,
    id: `${item.id}-copy-${Date.now()}-${idx}`,
    albumId: targetAlbum.id,
    albumName: targetAlbum.name,
    source: targetAlbum.source,
    storagePath: targetAlbum.storagePath,
    dateTakenMs: item.dateTakenMs + 1,
  }));
  return [...copies, ...items];
}

export function trashMediaItems(
  items: GalleryMediaItem[],
  selectedIds: Set<string>
): GalleryMediaItem[] {
  return items
    .filter((item) => !(selectedIds.has(item.id) && item.source === 'external'))
    .map((item) => (selectedIds.has(item.id) ? { ...item, isTrashed: true } : item));
}

export function restoreMediaItems(
  items: GalleryMediaItem[],
  selectedIds: Set<string>
): GalleryMediaItem[] {
  return items.map((item) => (selectedIds.has(item.id) ? { ...item, isTrashed: false } : item));
}

export function permanentlyDeleteItems(
  items: GalleryMediaItem[],
  selectedIds: Set<string>
): GalleryMediaItem[] {
  return items.filter((item) => !selectedIds.has(item.id));
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`;
  if (bytes >= kb) return `${Math.round(bytes / kb)} KB`;
  return `${bytes} B`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function getFastScrollBadge(groups: DateSectionGroup[], ratio: number): string {
  if (groups.length === 0) return '';
  const clamped = Math.max(0, Math.min(1, ratio));
  const idx = Math.min(groups.length - 1, Math.floor(clamped * groups.length));
  return groups[idx].monthBadge;
}
