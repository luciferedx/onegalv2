import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Edit3,
  EyeOff,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Grid2x2,
  HardDrive,
  Heart,
  Image as ImageIcon,
  Layers,
  Menu,
  MoreVertical,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Smartphone,
  Trash2,
  Usb,
  Video,
  X,
} from 'lucide-react';
import {
  buildAlbums,
  clampColumns,
  computeAllAlbums,
  computeVisibleAlbums,
  copyOrMoveMediaItems,
  createEmptyAlbumRecord,
  CustomAlbumEntry,
  DEFAULT_GALLERY_SETTINGS,
  ExternalDriveConfig,
  filterAndSortMedia,
  formatDuration,
  formatFileSize,
  GalleryAlbum,
  GalleryMediaItem,
  GallerySettingsState,
  GallerySortOrder,
  GalleryTab,
  getFastScrollBadge,
  getFormatBadge,
  groupMediaByDate,
  permanentlyDeleteItems,
  renameMediaItem,
  restoreMediaItems,
  SpecialCollection,
  StorageSource,
  ThemeMode,
  toggleFavoriteItems,
  trashMediaItems,
} from '../utils/galleryLogic';
import { FullScreenMediaViewer } from './FullScreenMediaViewer';
import { OnegalSettingsScreen } from './OnegalSettingsScreen';

interface OnegalDevicePreviewProps {
  items: GalleryMediaItem[];
  onItemsChange: React.Dispatch<React.SetStateAction<GalleryMediaItem[]>>;
  externalDrive: ExternalDriveConfig;
  onToggleExternalDrive: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  picturesColumns: number;
  onPicturesColumnsChange: (cols: number) => void;
  fullBleedMobile?: boolean;
}

const SORT_LABELS: Record<GallerySortOrder, string> = {
  date_desc: 'Newest first',
  date_asc: 'Oldest first',
  name_asc: 'Name (A–Z)',
  size_desc: 'Largest first',
};

export const OnegalDevicePreview: React.FC<OnegalDevicePreviewProps> = ({
  items,
  onItemsChange,
  externalDrive,
  onToggleExternalDrive,
  themeMode,
  onThemeChange,
  picturesColumns,
  onPicturesColumnsChange,
  fullBleedMobile = false,
}) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>('pictures');
  const [albumsColumns, setAlbumsColumns] = useState(3);
  const [sortOrder, setSortOrder] = useState<GallerySortOrder>('date_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openedAlbumId, setOpenedAlbumId] = useState<string | null>(null);
  const [openedCollection, setOpenedCollection] = useState<SpecialCollection | null>(null);

  // Version 2: Persistent empty album registry + complete One UI Settings state
  const [customAlbums, setCustomAlbums] = useState<CustomAlbumEntry[]>([]);
  const [settings, setSettings] = useState<GallerySettingsState>(DEFAULT_GALLERY_SETTINGS);
  const [thumbnailCacheBytes, setThumbnailCacheBytes] = useState<number>(186_420_000);

  // Multi-select
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sheets & dialogs
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [createAlbumName, setCreateAlbumName] = useState('');
  const [createAlbumSource, setCreateAlbumSource] = useState<StorageSource>('internal');
  const [createForPendingCopyMove, setCreateForPendingCopyMove] = useState(false);
  const [albumChecklistMode, setAlbumChecklistMode] = useState<'essential' | 'hide' | null>(null);
  const [renameTarget, setRenameTarget] = useState<GalleryMediaItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copyMoveMode, setCopyMoveMode] = useState<{ ids: Set<string>; isMove: boolean } | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  // Full-screen viewer
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Collapsible header + fast scroll thumb
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isFastScrubbing, setIsFastScrubbing] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);

  const isDark = themeMode === 'dark';

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const internalActive = useMemo(
    () => items.filter((i) => i.source === 'internal' && !i.isTrashed),
    [items]
  );
  const trashedItems = useMemo(
    () => items.filter((i) => i.source === 'internal' && i.isTrashed),
    [items]
  );
  const externalItems = useMemo(
    () => (externalDrive.mounted ? items.filter((i) => i.source === 'external' && !i.isTrashed) : []),
    [items, externalDrive.mounted]
  );

  const allAvailableAlbums = useMemo(
    () => computeAllAlbums(items, customAlbums, externalDrive.mounted, settings),
    [items, customAlbums, externalDrive.mounted, settings]
  );

  const visibleAlbums = useMemo(
    () => computeVisibleAlbums(allAvailableAlbums, settings, activeTab === 'albums' ? searchQuery : ''),
    [allAvailableAlbums, settings, activeTab, searchQuery]
  );

  const externalFolders = useMemo(() => {
    if (!externalDrive.mounted) return [];
    const mediaFolders = buildAlbums(items, 'external');
    const customExt = customAlbums
      .filter((c) => c.source === 'external')
      .filter((c) => !mediaFolders.some((f) => f.name.toLowerCase() === c.name.toLowerCase()))
      .map<GalleryAlbum>((c) => ({
        id: c.id,
        name: c.name,
        coverItem: null,
        itemCount: 0,
        totalSizeBytes: 0,
        source: 'external',
        storagePath: c.storagePath,
        isCustomEmpty: true,
        isMerged: false,
        mergedAlbumIds: [c.id],
      }));
    return [...customExt, ...mediaFolders];
  }, [items, customAlbums, externalDrive.mounted]);

  const openedAlbum: GalleryAlbum | null = useMemo(() => {
    if (!openedAlbumId) return null;
    return (
      allAvailableAlbums.find((a) => a.id === openedAlbumId) ??
      externalFolders.find((a) => a.id === openedAlbumId) ??
      null
    );
  }, [openedAlbumId, allAvailableAlbums, externalFolders]);

  const activeGridItems = useMemo(() => {
    let base: GalleryMediaItem[];
    if (openedAlbum) {
      if (openedAlbum.isMerged) {
        const mergedSet = new Set(openedAlbum.mergedAlbumIds ?? [openedAlbum.id]);
        base = [...internalActive, ...externalItems].filter(
          (i) =>
            mergedSet.has(i.albumId) ||
            i.albumName.toLowerCase() === openedAlbum.name.toLowerCase()
        );
      } else {
        base = (openedAlbum.source === 'external' ? externalItems : internalActive).filter(
          (i) => i.albumId === openedAlbum.id
        );
      }
    } else if (openedCollection) {
      if (openedCollection === 'favorites') base = internalActive.filter((i) => i.isFavorite);
      else if (openedCollection === 'videos') base = internalActive.filter((i) => i.type === 'video');
      else if (openedCollection === 'recent')
        base = [...internalActive].sort((a, b) => b.dateTakenMs - a.dateTakenMs).slice(0, 12);
      else base = trashedItems;
    } else {
      const hiddenSet = new Set(settings.hiddenAlbumIds);
      base = internalActive.filter((i) => !hiddenSet.has(i.albumId));
    }
    return filterAndSortMedia(base, searchQuery, sortOrder);
  }, [
    openedAlbum,
    openedCollection,
    externalItems,
    internalActive,
    trashedItems,
    settings.hiddenAlbumIds,
    searchQuery,
    sortOrder,
  ]);

  const dateSections = useMemo(() => groupMediaByDate(activeGridItems), [activeGridItems]);
  const fastScrollBadge = useMemo(
    () => getFastScrollBadge(dateSections, scrollRatio),
    [dateSections, scrollRatio]
  );

  const collapseFraction = Math.min(1, Math.max(0, scrollTop / 108));

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
    setScrollRatio(el.scrollTop / maxScroll);
  };

  const handleFastScrollMove = (clientY: number, trackEl: HTMLDivElement) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = trackEl.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
    setScrollRatio(ratio);
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollTop = ratio * maxScroll;
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    if (activeTab === 'albums' && !openedAlbum) {
      setAlbumsColumns((c) => clampColumns(e.deltaY > 0 ? c + 1 : c - 1, 2, 4));
    } else {
      onPicturesColumnsChange(
        clampColumns(e.deltaY > 0 ? picturesColumns + 1 : picturesColumns - 1, 2, 5)
      );
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setIsSelectionMode(false);
      return next;
    });
  };

  const enterSelectionWith = (id?: string) => {
    setIsSelectionMode(true);
    setSelectedIds(id ? new Set([id]) : new Set());
  };

  const clearSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === activeGridItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeGridItems.map((i) => i.id)));
    }
  };

  const handleTabSwitch = (tab: GalleryTab) => {
    if (tab === 'menu') {
      setIsMenuOpen(true);
      return;
    }
    setActiveTab(tab);
    setOpenedAlbumId(null);
    setOpenedCollection(null);
    clearSelection();
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const openCreateAlbumFlow = (forPendingCopyMove = false) => {
    setCreateAlbumName('');
    setCreateAlbumSource('internal');
    setCreateForPendingCopyMove(forPendingCopyMove);
    setShowCreateAlbumModal(true);
  };

  const confirmCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    const record = createEmptyAlbumRecord(createAlbumName, createAlbumSource);
    if (!record) return;
    setCustomAlbums((prev) => [record, ...prev]);

    if (createForPendingCopyMove && copyMoveMode) {
      const targetAlbum: GalleryAlbum = {
        id: record.id,
        name: record.name,
        coverItem: null,
        itemCount: 0,
        totalSizeBytes: 0,
        source: record.source,
        storagePath: record.storagePath,
        isCustomEmpty: true,
      };
      const count = copyMoveMode.ids.size;
      onItemsChange((prev) =>
        copyOrMoveMediaItems(prev, copyMoveMode.ids, targetAlbum, copyMoveMode.isMove)
      );
      triggerToast(
        copyMoveMode.isMove
          ? `Created "${record.name}" & moved ${count} item(s)`
          : `Created "${record.name}" & copied ${count} item(s)`
      );
      setCopyMoveMode(null);
      clearSelection();
    } else {
      triggerToast(`Created album "${record.name}" (0 items)`);
    }

    setShowCreateAlbumModal(false);
    setCreateForPendingCopyMove(false);
    setCreateAlbumName('');
  };

  const openRenameFor = (item: GalleryMediaItem) => {
    setRenameTarget(item);
    setRenameValue(item.displayName);
  };

  const confirmRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    onItemsChange((prev) => renameMediaItem(prev, renameTarget.id, renameValue));
    triggerToast(`Renamed to ${renameValue.trim()}`);
    setRenameTarget(null);
    clearSelection();
  };

  const applyCopyOrMove = (targetAlbum: GalleryAlbum) => {
    if (!copyMoveMode) return;
    const count = copyMoveMode.ids.size;
    onItemsChange((prev) =>
      copyOrMoveMediaItems(prev, copyMoveMode.ids, targetAlbum, copyMoveMode.isMove)
    );
    triggerToast(
      copyMoveMode.isMove
        ? `Moved ${count} item(s) to ${targetAlbum.name}`
        : `Copied ${count} item(s) to ${targetAlbum.name}`
    );
    setCopyMoveMode(null);
    clearSelection();
  };

  const handleDeleteIds = (ids: Set<string>, permanent = false) => {
    if (ids.size === 0) return;
    const usePermanent = permanent || !settings.trashRetention30Days;
    onItemsChange((prev) =>
      usePermanent ? permanentlyDeleteItems(prev, ids) : trashMediaItems(prev, ids)
    );
    triggerToast(
      usePermanent
        ? `Permanently deleted ${ids.size} item(s)`
        : `Moved ${ids.size} item(s) to Recycle bin`
    );
    clearSelection();
  };

  const handleEmptyTrash = () => {
    if (trashedItems.length === 0) return;
    const trashIds = new Set(trashedItems.map((i) => i.id));
    onItemsChange((prev) => permanentlyDeleteItems(prev, trashIds));
    triggerToast(`Emptied Recycle bin (${trashIds.size} item${trashIds.size === 1 ? '' : 's'})`);
  };

  const handleRestoreIds = (ids: Set<string>) => {
    if (ids.size === 0) return;
    onItemsChange((prev) => restoreMediaItems(prev, ids));
    triggerToast(`Restored ${ids.size} item(s) to Pictures`);
    clearSelection();
  };

  const handleFavoriteIds = (ids: Set<string>) => {
    if (ids.size === 0) return;
    onItemsChange((prev) => toggleFavoriteItems(prev, ids));
    triggerToast(`Updated Favorites (${ids.size} item${ids.size === 1 ? '' : 's'})`);
    clearSelection();
  };

  const handleShareIds = (ids: Set<string>) => {
    const names = items
      .filter((i) => ids.has(i.id))
      .map((i) => i.displayName)
      .slice(0, 3)
      .join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(names).catch(() => {});
    }
    triggerToast(`Ready to share ${ids.size} item(s): ${names}`);
  };

  const handleCaptureVideoFrame = (
    dataUrl: string,
    sourceItem: GalleryMediaItem,
    timestampMs: number
  ) => {
    const baseName = sourceItem.displayName.replace(/\.[^.]+$/, '');
    const frameItem: GalleryMediaItem = {
      id: `capture-${Date.now()}`,
      displayName: `${baseName}_frame_${formatDuration(timestampMs).replace(':', 'm')}s.png`,
      type: 'image',
      src: dataUrl,
      dateTakenMs: Date.now(),
      sizeBytes: 3_480_000,
      width: sourceItem.width,
      height: sourceItem.height,
      durationMs: 0,
      mimeType: 'image/png',
      albumId: 'onegal-captures',
      albumName: 'Onegal Captures',
      storagePath: '/storage/emulated/0/Pictures/Onegal Captures/',
      source: 'internal',
      isFavorite: false,
      isTrashed: false,
      exif: sourceItem.exif,
    };
    onItemsChange((prev) => [frameItem, ...prev]);
    triggerToast('Saved PNG frame to Pictures/Onegal Captures');
  };

  const toggleChecklistAlbum = (albumId: string) => {
    if (albumChecklistMode === 'essential') {
      setSettings((s) => {
        const exists = s.essentialAlbumIds.includes(albumId);
        return {
          ...s,
          essentialAlbumIds: exists
            ? s.essentialAlbumIds.filter((id) => id !== albumId)
            : [...s.essentialAlbumIds, albumId],
        };
      });
    } else if (albumChecklistMode === 'hide') {
      setSettings((s) => {
        const exists = s.hiddenAlbumIds.includes(albumId);
        return {
          ...s,
          hiddenAlbumIds: exists
            ? s.hiddenAlbumIds.filter((id) => id !== albumId)
            : [...s.hiddenAlbumIds, albumId],
        };
      });
    }
  };

  const headerTitle = openedAlbum
    ? openedAlbum.name
    : openedCollection === 'favorites'
      ? 'Favorites'
      : openedCollection === 'videos'
        ? 'Videos'
        : openedCollection === 'recent'
          ? 'Recent'
          : openedCollection === 'trash'
            ? 'Recycle bin'
            : activeTab === 'pictures'
              ? 'Pictures'
              : activeTab === 'albums'
                ? 'Albums'
                : 'External';

  const headerSubtitle = openedAlbum
    ? `${activeGridItems.length} items · ${openedAlbum.storagePath}`
    : openedCollection
      ? `${activeGridItems.length} items`
      : activeTab === 'pictures'
        ? `${activeGridItems.length} photos & videos`
        : activeTab === 'albums'
          ? `${visibleAlbums.length} local albums`
          : externalDrive.mounted
            ? `${externalDrive.label} · ${externalItems.length} items`
            : 'Plug in USB-C / NVMe drive';

  const isViewingMediaGrid = Boolean(openedAlbum || openedCollection || activeTab === 'pictures');

  const allDestinations = useMemo(() => {
    const map = new Map<string, GalleryAlbum>();
    for (const album of [...allAvailableAlbums, ...externalFolders]) {
      map.set(`${album.source}_${album.id}`, album);
    }
    return Array.from(map.values());
  }, [allAvailableAlbums, externalFolders]);

  // Pure Monochrome AMOLED Dark (#000000) & One UI Light (#F6F6F8) tokens — ZERO BLUE in Dark Mode
  const canvasCls = isDark ? 'bg-black text-white' : 'bg-[#F6F6F8] text-[#0A0A0C]';
  const cardCls = isDark
    ? 'bg-[#161618] border-white/[0.12] text-white'
    : 'bg-white border-[#E5E5EA] text-[#0A0A0C]';
  const glassCls = isDark
    ? 'bg-[#1C1C1E]/85 border-white/[0.14] text-white backdrop-blur-xl'
    : 'bg-white/92 border-[#E5E5EA] text-[#0A0A0C] backdrop-blur-xl';
  const mutedTextCls = isDark ? 'text-[#8E8E93]' : 'text-[#63636A]';
  const primaryBtnCls = isDark
    ? 'bg-white hover:bg-[#E5E5EA] text-black'
    : 'bg-[#111114] hover:bg-[#27272A] text-white';

  return (
    <div
      data-testid="onegal-device-preview"
      data-theme={themeMode}
      className={`relative flex flex-col overflow-hidden ${canvasCls} ${
        fullBleedMobile
          ? 'w-full h-[calc(100dvh-56px)]'
          : 'w-full max-w-[420px] h-[780px] rounded-[36px] border border-white/[0.14] shadow-2xl shadow-black/60'
      }`}
    >
      {/* Status bar for desktop S25 Ultra preview frame */}
      {!fullBleedMobile && (
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-medium tabular-nums shrink-0">
          <span>10:15</span>
          <div
            className="w-4 h-4 rounded-full bg-[#111114] border border-white/10"
            aria-hidden="true"
          />
          <span className={mutedTextCls}>120Hz · 5G</span>
        </div>
      )}

      {/* Sticky Top Action Bar / Multi-Select Bar */}
      <div
        className={`relative z-20 shrink-0 px-3 transition-colors ${
          isDark ? 'bg-black/95' : 'bg-[#F6F6F8]/95'
        } backdrop-blur-md`}
      >
        {isSelectionMode ? (
          <div className="h-14 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              aria-label="Toggle select all items"
              className="flex items-center gap-2 min-h-[44px] px-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              {selectedIds.size === activeGridItems.length && activeGridItems.length > 0 ? (
                <CheckCircle2
                  className={`w-5 h-5 ${isDark ? 'text-white' : 'text-[#111114]'}`}
                />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              <span className="text-sm font-semibold tabular-nums">
                {selectedIds.size === 0 ? 'Select items' : `${selectedIds.size} selected`}
              </span>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Cancel selection"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : isSearchOpen ? (
          <div className="h-14 flex items-center gap-2">
            <div
              className={`flex-1 h-10 flex items-center gap-2 px-3.5 rounded-[20px] border ${
                isDark ? 'bg-[#1C1C1E] border-white/[0.14]' : 'bg-white border-[#E5E5EA]'
              }`}
            >
              <Search className={`w-4 h-4 shrink-0 ${mutedTextCls}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search filename, album, EXIF..."
                aria-label="Search local gallery"
                autoFocus
                className="w-full bg-transparent text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              aria-label="Close search"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="h-14 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {(openedAlbum || openedCollection) && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenedAlbumId(null);
                    setOpenedCollection(null);
                  }}
                  aria-label="Back to gallery"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <span
                className={`text-lg font-bold tracking-tight truncate pl-1 transition-opacity duration-150 ${
                  collapseFraction > 0.45 || openedAlbum || openedCollection
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {headerTitle}
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              {/* Prominent '+' Create Album button on Albums tab matching Samsung One UI 8.0 reference */}
              {activeTab === 'albums' && !openedAlbum && !openedCollection && (
                <button
                  type="button"
                  onClick={() => openCreateAlbumFlow(false)}
                  aria-label="Create new album"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-[21px] h-[21px]" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search gallery"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <Search className="w-[19px] h-[19px]" />
              </button>

              {isViewingMediaGrid && (
                <button
                  type="button"
                  onClick={() => enterSelectionWith()}
                  aria-label="Enter multi-select mode"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <CheckCircle2 className="w-[19px] h-[19px]" />
                </button>
              )}

              {(isViewingMediaGrid || activeTab === 'albums') && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'albums' && !openedAlbum) {
                      setAlbumsColumns((c) => (c >= 4 ? 2 : c + 1));
                    } else {
                      const next = picturesColumns >= 5 ? 2 : picturesColumns + 1;
                      onPicturesColumnsChange(next);
                      triggerToast(`Grid density: ${next} columns`);
                    }
                  }}
                  aria-label={`Change grid density (${
                    activeTab === 'albums' && !openedAlbum ? albumsColumns : picturesColumns
                  } columns)`}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <Grid2x2 className="w-[19px] h-[19px]" />
                </button>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu((s) => !s)}
                  aria-label="More options and sort"
                  aria-expanded={showSortMenu}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  <MoreVertical className="w-[19px] h-[19px]" />
                </button>

                {showSortMenu && (
                  <div
                    role="menu"
                    className={`absolute right-0 mt-1 w-52 rounded-[22px] border p-1.5 shadow-2xl z-40 ${glassCls}`}
                  >
                    {(Object.keys(SORT_LABELS) as GallerySortOrder[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSortOrder(key);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-[14px] flex items-center justify-between transition-colors ${
                          sortOrder === key
                            ? isDark
                              ? 'bg-white/12 text-white font-semibold'
                              : 'bg-black/8 text-[#0A0A0C] font-semibold'
                            : isDark
                              ? 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                              : 'hover:bg-black/5'
                        }`}
                      >
                        <span>{SORT_LABELS[key]}</span>
                        {sortOrder === key && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                    <div
                      className={`my-1 border-t ${isDark ? 'border-white/[0.1]' : 'border-[#E5E5EA]'}`}
                    />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowSortMenu(false);
                        setIsSettingsOpen(true);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-[14px] flex items-center gap-2 transition-colors ${
                        isDark ? 'text-white hover:bg-white/5' : 'hover:bg-black/5'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Gallery settings</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Scrollable Viewport */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onWheel={handleWheelZoom}
          className="h-full overflow-y-auto no-scrollbar pb-28"
        >
          {/* One UI Signature Reachability Expanded Header */}
          {!isSelectionMode && !isSearchOpen && (
            <div
              className="flex flex-col items-center justify-center text-center px-6 pt-7 pb-8 transition-opacity duration-150"
              style={{
                opacity: Math.max(0, 1 - collapseFraction * 1.4),
                transform: `translateY(${(-collapseFraction * 14).toFixed(1)}px)`,
              }}
            >
              <h2 className="font-display text-[34px] font-bold tracking-tight leading-tight">
                {headerTitle}
              </h2>
              <p className={`text-xs mt-1.5 tabular-nums ${mutedTextCls}`}>{headerSubtitle}</p>
            </div>
          )}

          {/* VIEW 1: Media Grid (Pictures / Opened Album / Favorites / Videos / Recent / Trash) */}
          {isViewingMediaGrid && (
            <div className="px-1">
              {dateSections.length === 0 ? (
                <div className={`mx-4 mt-4 rounded-[26px] border p-8 text-center ${cardCls}`}>
                  <FolderOpen
                    className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-white/75' : 'text-[#111114]/75'}`}
                  />
                  <p className="font-semibold text-sm">
                    {openedCollection === 'trash'
                      ? 'Recycle bin is empty'
                      : openedAlbum?.isCustomEmpty
                        ? `"${openedAlbum.name}" has 0 items`
                        : searchQuery
                          ? `No matches for "${searchQuery}"`
                          : 'No photos or videos here'}
                  </p>
                  <p className={`text-xs mt-1.5 leading-relaxed ${mutedTextCls}`}>
                    {openedCollection === 'trash'
                      ? 'Deleted items stay here for 30 days before permanent removal.'
                      : openedAlbum?.isCustomEmpty
                        ? 'Copy or move photos from Pictures into this persistent album anytime.'
                        : 'Try clearing your filter or switching tabs.'}
                  </p>
                </div>
              ) : (
                dateSections.map((section) => (
                  <section key={section.key} className="mb-4">
                    <div className="flex items-baseline gap-2 px-3 py-2">
                      <h3 className="text-[13px] font-semibold tracking-tight">{section.title}</h3>
                      <span className={`text-xs tabular-nums ${mutedTextCls}`}>
                        · {section.items.length}
                      </span>
                    </div>

                    <div
                      data-testid="media-grid-section"
                      data-columns={picturesColumns}
                      data-aspect-mode={settings.originalAspectRatioGrid ? 'original' : 'square'}
                      className="grid gap-[2px] items-start"
                      style={{
                        gridTemplateColumns: `repeat(${picturesColumns}, minmax(0, 1fr))`,
                      }}
                    >
                      {section.items.map((item) => {
                        const flatIndex = activeGridItems.findIndex((i) => i.id === item.id);
                        const isSelected = selectedIds.has(item.id);
                        const badge = settings.showFormatBadges ? getFormatBadge(item) : null;
                        const clampedRatio = Math.max(
                          0.68,
                          Math.min(1.5, item.width / Math.max(1, item.height))
                        );

                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={`${item.type === 'video' ? 'Video' : 'Photo'} ${item.displayName}`}
                            onClick={() => {
                              if (isSelectionMode) {
                                toggleItemSelection(item.id);
                              } else {
                                setViewerIndex(flatIndex);
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              enterSelectionWith(item.id);
                            }}
                            onPointerDown={() => {
                              longPressTimerRef.current = window.setTimeout(() => {
                                enterSelectionWith(item.id);
                              }, 460);
                            }}
                            onPointerUp={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                              }
                            }}
                            onPointerLeave={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                              }
                            }}
                            style={{
                              aspectRatio: settings.originalAspectRatioGrid
                                ? `${clampedRatio.toFixed(3)}`
                                : '1 / 1',
                            }}
                            className={`relative w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-white transition-all duration-200 ${
                              picturesColumns <= 2 ? 'rounded-[12px]' : 'rounded-[4px]'
                            } ${isDark ? 'bg-[#161618]' : 'bg-[#E5E5EA]'}`}
                          >
                            <img
                              src={item.src}
                              alt={item.displayName}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className={`w-full h-full object-cover transition-transform duration-200 ${
                                isSelected ? 'scale-[0.86] rounded-[12px]' : 'hover:scale-[1.03]'
                              }`}
                            />

                            {/* File format badge (RAW, 8K, 4K, GIF) */}
                            {badge && (
                              <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-[5px] bg-black/72 border border-white/15 text-white text-[9px] font-mono font-semibold tracking-wider leading-none">
                                {badge}
                              </span>
                            )}

                            {item.type === 'video' && (
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 px-1.5 py-1 bg-gradient-to-t from-black/80 via-black/35 to-transparent text-white text-[10px] font-mono tabular-nums">
                                <Play className="w-2.5 h-2.5 fill-white" />
                                <span>{formatDuration(item.durationMs)}</span>
                              </div>
                            )}

                            {item.isFavorite && !isSelectionMode && (
                              <Heart className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 fill-white text-white drop-shadow" />
                            )}

                            {isSelectionMode && (
                              <span
                                className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? 'bg-white border-white text-black'
                                    : 'bg-black/45 border-white/80 text-transparent'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}

          {/* VIEW 2: Albums Grid (Matching Samsung One UI 8.0 Screenshot 2) */}
          {!isViewingMediaGrid && activeTab === 'albums' && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-3.5 px-0.5">
                <h3 className="font-display text-[17px] font-bold tracking-tight">All albums</h3>
                {settings.mergeAlbums && (
                  <span className={`text-[11px] font-medium ${mutedTextCls}`}>Merged view</span>
                )}
              </div>

              {visibleAlbums.length === 0 ? (
                <div className={`rounded-[26px] border p-8 text-center ${cardCls}`}>
                  <FolderPlus className={`w-8 h-8 mx-auto mb-3 ${mutedTextCls}`} />
                  <p className="text-sm font-semibold">No albums visible</p>
                  <p className={`text-xs mt-1 ${mutedTextCls}`}>
                    Create a new album with + or adjust hidden/essential album filters in Settings.
                  </p>
                </div>
              ) : (
                <div
                  data-testid="albums-grid"
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${albumsColumns}, minmax(0, 1fr))`,
                  }}
                >
                  {visibleAlbums.map((album) => (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => setOpenedAlbumId(album.id)}
                      className="text-left group focus-visible:outline-2 focus-visible:outline-white rounded-[20px]"
                    >
                      <div
                        className={`relative aspect-square w-full overflow-hidden rounded-[20px] border transition-colors ${
                          isDark
                            ? 'bg-[#161618] border-white/[0.12]'
                            : 'bg-[#E5E5EA] border-[#E5E5EA]'
                        }`}
                      >
                        {album.coverItem ? (
                          <img
                            src={album.coverItem.src}
                            alt={album.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                            <FolderPlus
                              className={`w-7 h-7 ${isDark ? 'text-white/50' : 'text-black/40'}`}
                            />
                            <span
                              className={`text-[10px] font-medium ${
                                isDark ? 'text-[#8E8E93]' : 'text-[#63636A]'
                              }`}
                            >
                              Empty
                            </span>
                          </div>
                        )}

                        {/* Camera badge matching One UI 8.0 reference screenshot 2 */}
                        {album.name.toLowerCase() === 'camera' && (
                          <span className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-black/65 border border-white/15 text-white flex items-center justify-center">
                            <Camera className="w-3 h-3" />
                          </span>
                        )}

                        {/* Merged badge when Internal + External same-name albums are unified */}
                        {album.isMerged && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/68 border border-white/15 text-white flex items-center justify-center">
                            <Layers className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="mt-2 px-0.5 text-[13px] font-semibold truncate">{album.name}</p>
                      <p className={`px-0.5 text-[11px] tabular-nums ${mutedTextCls}`}>
                        {album.itemCount}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: Plug-and-Play External USB-C / NVMe Drive Tab */}
          {!isViewingMediaGrid && activeTab === 'external' && (
            <div className="px-4 space-y-5">
              {externalDrive.mounted ? (
                <>
                  <div className={`rounded-[26px] border p-4 space-y-3.5 ${cardCls}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-white/12 text-white' : 'bg-black/8 text-[#0A0A0C]'
                          }`}
                        >
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{externalDrive.label}</p>
                          <p className={`text-xs truncate ${mutedTextCls}`}>
                            {externalDrive.deviceModel}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          triggerToast(`Rescanned SAF tree in ${externalDrive.scanTimeMs} ms`)
                        }
                        aria-label="Rescan external drive"
                        className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center hover:bg-white/10"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className={`text-xs tabular-nums ${mutedTextCls}`}>
                      {externalItems.length} files · {externalFolders.length} folders ·{' '}
                      {formatFileSize(externalItems.reduce((a, b) => a + b.sizeBytes, 0))} · Direct
                      SAF index ({externalDrive.scanTimeMs} ms)
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onToggleExternalDrive();
                          triggerToast('Opened Android Storage Settings — Drive safely ejected');
                        }}
                        className={`flex-1 h-10 rounded-[16px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${primaryBtnCls}`}
                      >
                        <Usb className="w-4 h-4" />
                        <span>Safely Eject</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-xs font-semibold px-1 mb-2.5 ${mutedTextCls}`}>
                      Folders on {externalDrive.label}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {externalFolders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => setOpenedAlbumId(folder.id)}
                          className="text-left group focus-visible:outline-2 focus-visible:outline-white rounded-[20px]"
                        >
                          <div
                            className={`relative aspect-square w-full overflow-hidden rounded-[20px] border ${
                              isDark
                                ? 'bg-[#161618] border-white/[0.12]'
                                : 'bg-[#E5E5EA] border-[#E5E5EA]'
                            }`}
                          >
                            {folder.coverItem ? (
                              <img
                                src={folder.coverItem.src}
                                alt={folder.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FolderPlus className={`w-6 h-6 ${mutedTextCls}`} />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/65 border border-white/15 text-white flex items-center justify-center">
                              <FolderOpen className="w-3 h-3" />
                            </div>
                          </div>
                          <p className="mt-2 px-0.5 text-[13px] font-semibold truncate">
                            {folder.name}
                          </p>
                          <p className={`px-0.5 text-[11px] tabular-nums ${mutedTextCls}`}>
                            {folder.itemCount}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className={`rounded-[26px] border p-7 text-center space-y-3 ${cardCls}`}>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                      isDark ? 'bg-white/10 text-white' : 'bg-black/8 text-[#0A0A0C]'
                    }`}
                  >
                    <Usb className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold">No External USB-C Drive Mounted</h3>
                  <p className={`text-xs leading-relaxed ${mutedTextCls}`}>
                    Plug in a USB-C SSD or NVMe enclosure. Onegal registers USB_DEVICE_ATTACHED and
                    indexes folders directly via DocumentsContract with zero MediaStore lag.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleExternalDrive();
                      triggerToast('Mounted Samsung T9 2TB NVMe via SAF in 14 ms');
                    }}
                    className={`mt-2 h-11 px-5 rounded-[18px] text-xs font-semibold transition-colors ${primaryBtnCls}`}
                  >
                    Mount External Drive
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Draggable One UI Frosted-Glass Fast-Scroll Date Thumb */}
        {isViewingMediaGrid && dateSections.length > 1 && (
          <div
            role="slider"
            aria-label="Fast scroll timeline"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(scrollRatio * 100)}
            tabIndex={0}
            onPointerDown={(e) => {
              setIsFastScrubbing(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              handleFastScrollMove(e.clientY, e.currentTarget);
            }}
            onPointerMove={(e) => {
              if (!isFastScrubbing) return;
              handleFastScrollMove(e.clientY, e.currentTarget);
            }}
            onPointerUp={() => setIsFastScrubbing(false)}
            className="absolute right-1.5 top-24 bottom-24 w-7 z-20 cursor-ns-resize select-none"
          >
            <div
              className="absolute right-0 flex items-center gap-2 transition-transform duration-75"
              style={{
                top: `${Math.round(scrollRatio * 84)}%`,
              }}
            >
              {(isFastScrubbing || scrollTop > 20) && fastScrollBadge && (
                <span
                  className={`px-2.5 py-1 rounded-[14px] text-[11px] font-semibold whitespace-nowrap shadow-md transition-opacity border ${
                    isFastScrubbing ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  } ${glassCls}`}
                >
                  {fastScrollBadge}
                </span>
              )}
              <div
                className={`w-6 h-10 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-md transition-colors border ${
                  isFastScrubbing
                    ? isDark
                      ? 'bg-white border-white text-black'
                      : 'bg-[#111114] border-[#111114] text-white'
                    : glassCls
                }`}
              >
                <span className="w-2.5 h-[1.5px] bg-current rounded-full" />
                <span className="w-2.5 h-[1.5px] bg-current rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Frosted-Glass Pill Nav Bar OR Multi-Select Action Bar */}
      <div className="absolute bottom-3 left-0 right-0 z-30 px-4 pointer-events-none">
        {isSelectionMode ? (
          <div
            role="toolbar"
            aria-label="Multi-select file operations"
            className={`pointer-events-auto h-[62px] rounded-[28px] border px-2 flex items-center justify-around shadow-2xl ${glassCls}`}
          >
            {openedCollection === 'trash' ? (
              <>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => handleRestoreIds(selectedIds)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1.5 disabled:opacity-35"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Restore</span>
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => handleDeleteIds(selectedIds, true)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-[#FF453A] disabled:opacity-35"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Delete forever</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => handleShareIds(selectedIds)}
                  className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 disabled:opacity-35 hover:opacity-80"
                >
                  <Share2 className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-medium">Share</span>
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setCopyMoveMode({ ids: new Set(selectedIds), isMove: false })}
                  className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 disabled:opacity-35 hover:opacity-80"
                >
                  <Copy className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-medium">Copy</span>
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => setCopyMoveMode({ ids: new Set(selectedIds), isMove: true })}
                  className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 disabled:opacity-35 hover:opacity-80"
                >
                  <FolderInput className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-medium">Move</span>
                </button>
                {selectedIds.size === 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = items.find((i) => selectedIds.has(i.id));
                      if (target) openRenameFor(target);
                    }}
                    className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 hover:opacity-80"
                  >
                    <Edit3 className="w-[18px] h-[18px]" />
                    <span className="text-[10px] font-medium">Rename</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={selectedIds.size === 0}
                    onClick={() => handleFavoriteIds(selectedIds)}
                    className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 disabled:opacity-35 hover:opacity-80"
                  >
                    <Heart className="w-[18px] h-[18px]" />
                    <span className="text-[10px] font-medium">Favorite</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={() => handleDeleteIds(selectedIds, false)}
                  className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 text-[#FF453A] disabled:opacity-35"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-medium">Delete</span>
                </button>
              </>
            )}
          </div>
        ) : (
          !openedAlbum &&
          !openedCollection && (
            <nav
              aria-label="Onegal bottom navigation"
              className={`pointer-events-auto h-[62px] rounded-[28px] border px-2 grid grid-cols-4 items-center shadow-2xl ${glassCls}`}
            >
              {(
                [
                  { id: 'pictures', label: 'Pictures', Icon: ImageIcon },
                  { id: 'albums', label: 'Albums', Icon: FolderOpen },
                  { id: 'external', label: 'External', Icon: Usb },
                  { id: 'menu', label: 'Menu', Icon: Menu },
                ] as const
              ).map(({ id, label, Icon }) => {
                const isActive = activeTab === id && id !== 'menu';
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleTabSwitch(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-[20px] transition-colors ${
                      isActive
                        ? isDark
                          ? 'text-white'
                          : 'text-[#0A0A0C]'
                        : isDark
                          ? 'text-[#8E8E93] hover:text-white'
                          : 'text-[#63636A] hover:text-[#0A0A0C]'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-[19px] h-[19px]" />
                      {id === 'external' && externalDrive.mounted && (
                        <span
                          className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full ${
                            isDark ? 'bg-white' : 'bg-[#111114]'
                          }`}
                          aria-label="External drive connected"
                        />
                      )}
                    </div>
                    <span className={`text-[10.5px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {label}
                    </span>
                    {isActive && (
                      <span
                        className={`w-4 h-[2px] rounded-full ${
                          isDark ? 'bg-white' : 'bg-[#0A0A0C]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )
        )}
      </div>

      {/* Floating Samsung One UI 8.0 Menu Sheet (Matching Reference Screenshot 3) */}
      {isMenuOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-end p-3"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            data-testid="onegal-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Onegal menu"
            className={`w-full rounded-[28px] border p-5 shadow-2xl space-y-5 ${glassCls}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top 4 Circular Quick Actions: Videos, Favorites, Recent, External */}
            <div className="grid grid-cols-4 gap-2 text-center">
              {(
                [
                  {
                    label: 'Videos',
                    Icon: Video,
                    count: internalActive.filter((i) => i.type === 'video').length,
                    onClick: () => {
                      setIsMenuOpen(false);
                      setOpenedCollection('videos');
                    },
                  },
                  {
                    label: 'Favorites',
                    Icon: Heart,
                    count: internalActive.filter((i) => i.isFavorite).length,
                    onClick: () => {
                      setIsMenuOpen(false);
                      setOpenedCollection('favorites');
                    },
                  },
                  {
                    label: 'Recent',
                    Icon: Clock,
                    count: 0,
                    onClick: () => {
                      setIsMenuOpen(false);
                      setOpenedCollection('recent');
                    },
                  },
                  {
                    label: 'External',
                    Icon: Usb,
                    count: externalDrive.mounted ? externalFolders.length : 0,
                    onClick: () => {
                      setIsMenuOpen(false);
                      handleTabSwitch('external');
                    },
                  },
                ] as const
              ).map(({ label, Icon, count, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`relative w-[52px] h-[52px] rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isDark ? 'bg-[#2C2C2E] text-white' : 'bg-[#E9E9EE] text-[#0A0A0C]'
                    }`}
                  >
                    <Icon className="w-[22px] h-[22px]" />
                    {count > 0 && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums ${
                          isDark ? 'bg-white text-black' : 'bg-[#111114] text-white'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-[11.5px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* 2x2 Rounded Capsule Actions: Create album, Hide albums, Recycle bin, Settings */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openCreateAlbumFlow(false);
                }}
                className={`h-[48px] px-3.5 rounded-[24px] flex items-center gap-2.5 text-[13px] font-medium transition-colors ${
                  isDark
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3D] text-white'
                    : 'bg-[#E9E9EE] hover:bg-[#DDDDE3] text-[#0A0A0C]'
                }`}
              >
                <FolderPlus className="w-4 h-4 shrink-0" />
                <span className="truncate">Create album</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setAlbumChecklistMode('hide');
                }}
                className={`h-[48px] px-3.5 rounded-[24px] flex items-center gap-2.5 text-[13px] font-medium transition-colors ${
                  isDark
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3D] text-white'
                    : 'bg-[#E9E9EE] hover:bg-[#DDDDE3] text-[#0A0A0C]'
                }`}
              >
                <EyeOff className="w-4 h-4 shrink-0" />
                <span className="truncate">Hide albums</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setOpenedCollection('trash');
                }}
                className={`h-[48px] px-3.5 rounded-[24px] flex items-center gap-2.5 text-[13px] font-medium transition-colors ${
                  isDark
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3D] text-white'
                    : 'bg-[#E9E9EE] hover:bg-[#DDDDE3] text-[#0A0A0C]'
                }`}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {trashedItems.length > 0 ? `Recycle bin (${trashedItems.length})` : 'Recycle bin'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className={`h-[48px] px-3.5 rounded-[24px] flex items-center gap-2.5 text-[13px] font-medium transition-colors ${
                  isDark
                    ? 'bg-[#2C2C2E] hover:bg-[#3A3A3D] text-white'
                    : 'bg-[#E9E9EE] hover:bg-[#DDDDE3] text-[#0A0A0C]'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span className="truncate">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen One UI 8.0 Gallery Settings Screen */}
      {isSettingsOpen && (
        <OnegalSettingsScreen
          settings={settings}
          themeMode={themeMode}
          trashedCount={trashedItems.length}
          thumbnailCacheBytes={thumbnailCacheBytes}
          onUpdateSettings={setSettings}
          onThemeChange={onThemeChange}
          onOpenEssentialAlbums={() => setAlbumChecklistMode('essential')}
          onOpenHideAlbums={() => setAlbumChecklistMode('hide')}
          onEmptyTrash={handleEmptyTrash}
          onClearThumbnailCache={() => {
            setThumbnailCacheBytes(0);
            triggerToast('Thumbnail cache cleared (0 B)');
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Create New Album Dialog (Persistent 0-Item Album) */}
      {showCreateAlbumModal && (
        <div
          className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCreateAlbumModal(false)}
        >
          <form
            onSubmit={confirmCreateAlbum}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Create new album"
            className={`w-full rounded-[26px] border p-5 space-y-4 shadow-2xl ${cardCls}`}
          >
            <h3 className="font-display text-lg font-bold">Create album</h3>

            <div className="space-y-1.5">
              <label
                htmlFor="onegal-album-name"
                className={`text-xs font-medium ${mutedTextCls}`}
              >
                Album name
              </label>
              <input
                id="onegal-album-name"
                type="text"
                value={createAlbumName}
                onChange={(e) => setCreateAlbumName(e.target.value)}
                placeholder="e.g. Portraits_2026"
                autoFocus
                className={`w-full h-11 px-3.5 rounded-2xl border text-sm focus:outline-none ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.16] text-white focus:border-white'
                    : 'bg-[#F6F6F8] border-[#E5E5EA] text-[#0A0A0C] focus:border-[#111114]'
                }`}
              />
            </div>

            <div className="space-y-2">
              <p className={`text-xs font-medium ${mutedTextCls}`}>Storage location</p>
              <button
                type="button"
                onClick={() => setCreateAlbumSource('internal')}
                className={`w-full p-3 rounded-2xl border flex items-center gap-3 text-left transition-colors ${
                  createAlbumSource === 'internal'
                    ? isDark
                      ? 'bg-[#2C2C2E] border-white text-white'
                      : 'bg-[#E9E9EE] border-[#111114]'
                    : isDark
                      ? 'bg-[#1C1C1E] border-white/[0.1]'
                      : 'bg-[#F6F6F8] border-[#E5E5EA]'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">Internal storage</p>
                  <p className={`text-[11px] font-mono truncate ${mutedTextCls}`}>
                    Pictures/{createAlbumName.trim() || '<AlbumName>'}
                  </p>
                </div>
                {createAlbumSource === 'internal' && <Check className="w-4 h-4 shrink-0" />}
              </button>

              {externalDrive.mounted && (
                <button
                  type="button"
                  onClick={() => setCreateAlbumSource('external')}
                  className={`w-full p-3 rounded-2xl border flex items-center gap-3 text-left transition-colors ${
                    createAlbumSource === 'external'
                      ? isDark
                        ? 'bg-[#2C2C2E] border-white text-white'
                        : 'bg-[#E9E9EE] border-[#111114]'
                      : isDark
                        ? 'bg-[#1C1C1E] border-white/[0.1]'
                        : 'bg-[#F6F6F8] border-[#E5E5EA]'
                  }`}
                >
                  <Usb className="w-4 h-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{externalDrive.label}</p>
                    <p className={`text-[11px] font-mono truncate ${mutedTextCls}`}>
                      USB-C NVMe:/{createAlbumName.trim() || '<AlbumName>'}
                    </p>
                  </div>
                  {createAlbumSource === 'external' && <Check className="w-4 h-4 shrink-0" />}
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCreateAlbumModal(false);
                  setCreateForPendingCopyMove(false);
                }}
                className={`h-10 px-4 rounded-xl text-xs font-medium ${mutedTextCls}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!createAlbumName.trim()}
                className={`h-10 px-5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors ${primaryBtnCls}`}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Essential Albums / Hide Albums Checklist Dialog */}
      {albumChecklistMode && (
        <div
          className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setAlbumChecklistMode(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              albumChecklistMode === 'essential' ? 'Select essential albums' : 'Hide albums'
            }
            className={`w-full max-h-[76%] flex flex-col rounded-[26px] border p-5 shadow-2xl ${cardCls}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold">
              {albumChecklistMode === 'essential' ? 'Select essential albums' : 'Hide albums'}
            </h3>
            <p className={`text-xs mt-1 mb-3 ${mutedTextCls}`}>
              {albumChecklistMode === 'essential'
                ? 'Checked albums stay visible when Essential albums mode is enabled.'
                : 'Checked folders are hidden from Pictures & Albums without deleting files.'}
            </p>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
              {allAvailableAlbums.map((album) => {
                const checked =
                  albumChecklistMode === 'essential'
                    ? settings.essentialAlbumIds.includes(album.id)
                    : settings.hiddenAlbumIds.includes(album.id);
                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => toggleChecklistAlbum(album.id)}
                    className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 text-left transition-colors ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${isDark ? 'text-white' : 'text-[#111114]'}`}
                      />
                    ) : (
                      <Circle className={`w-5 h-5 shrink-0 ${mutedTextCls}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{album.name}</p>
                      <p className={`text-[11px] tabular-nums ${mutedTextCls}`}>
                        {album.itemCount} items · {album.source === 'external' ? 'USB-C' : 'Internal'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setAlbumChecklistMode(null)}
                className={`h-10 px-5 rounded-xl text-xs font-semibold ${primaryBtnCls}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename File Dialog */}
      {renameTarget && (
        <div
          className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setRenameTarget(null)}
        >
          <form
            onSubmit={confirmRename}
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-[26px] border p-5 space-y-4 shadow-2xl ${cardCls}`}
          >
            <h3 className="font-display text-lg font-bold">Rename file</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              aria-label="New file name"
              autoFocus
              className={`w-full h-11 px-3.5 rounded-2xl border text-sm font-mono focus:outline-none ${
                isDark
                  ? 'bg-[#1C1C1E] border-white/[0.16] text-white focus:border-white'
                  : 'bg-[#F6F6F8] border-[#E5E5EA] text-[#0A0A0C] focus:border-[#111114]'
              }`}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className={`h-10 px-4 rounded-xl text-xs font-medium ${mutedTextCls}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`h-10 px-5 rounded-xl text-xs font-semibold ${primaryBtnCls}`}
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Copy / Move Destination Picker Sheet (Includes "+ Create new album") */}
      {copyMoveMode && (
        <div
          className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end p-3"
          onClick={() => setCopyMoveMode(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={copyMoveMode.isMove ? 'Move items to album' : 'Copy items to album'}
            className={`w-full max-h-[74%] flex flex-col rounded-[28px] border p-5 shadow-2xl ${glassCls}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold">
                {copyMoveMode.isMove ? 'Move' : 'Copy'} {copyMoveMode.ids.size} item(s) to
              </h3>
              <button
                type="button"
                onClick={() => setCopyMoveMode(null)}
                aria-label="Close destination picker"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent "+ Create new album" action inside Copy/Move sheet */}
            <button
              type="button"
              onClick={() => openCreateAlbumFlow(true)}
              className={`w-full mb-3 px-3.5 py-3 rounded-2xl border flex items-center gap-2.5 text-sm font-semibold transition-colors ${
                isDark
                  ? 'bg-[#2C2C2E] border-white/[0.14] text-white hover:bg-[#3A3A3D]'
                  : 'bg-[#E9E9EE] border-[#E5E5EA] text-[#0A0A0C] hover:bg-[#DDDDE3]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create new album</span>
            </button>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
              {allDestinations.map((dest) => (
                <button
                  key={`${dest.source}_${dest.id}`}
                  type="button"
                  onClick={() => applyCopyOrMove(dest)}
                  className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-3 text-left transition-colors ${
                    isDark ? 'hover:bg-white/6' : 'hover:bg-black/5'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-white/10 text-white' : 'bg-black/6 text-[#0A0A0C]'
                    }`}
                  >
                    {dest.source === 'external' ? (
                      <Usb className="w-4 h-4" />
                    ) : (
                      <FolderOpen className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{dest.name}</p>
                    <p className={`text-[11px] truncate ${mutedTextCls}`}>
                      {dest.itemCount} items · {dest.storagePath}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Media Viewer */}
      {viewerIndex !== null && activeGridItems[viewerIndex] && (
        <FullScreenMediaViewer
          items={activeGridItems}
          initialIndex={viewerIndex}
          autoPlayVideos={settings.autoPlayVideos}
          fullScreenScrolling={settings.fullScreenScrolling}
          showFullExifLocation={settings.showFullExifLocation}
          onClose={() => setViewerIndex(null)}
          onFavorite={(item) => handleFavoriteIds(new Set([item.id]))}
          onShare={(item) => handleShareIds(new Set([item.id]))}
          onCopy={(item) => setCopyMoveMode({ ids: new Set([item.id]), isMove: false })}
          onRename={(item) => openRenameFor(item)}
          onDelete={(item) => {
            handleDeleteIds(new Set([item.id]), openedCollection === 'trash');
            setViewerIndex(null);
          }}
          onCaptureFrame={handleCaptureVideoFrame}
        />
      )}

      {/* Subtle Floating Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border text-xs font-medium whitespace-nowrap shadow-xl max-w-[90%] truncate ${
            isMenuOpen || copyMoveMode ? 'top-16' : 'bottom-22'
          } ${
            isDark
              ? 'bg-[#1C1C1E]/92 border-white/[0.16] text-white backdrop-blur-xl'
              : 'bg-[#111114] border-black/10 text-white'
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
};
