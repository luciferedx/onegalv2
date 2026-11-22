import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAlbums,
  clampColumns,
  computeAllAlbums,
  computeVisibleAlbums,
  copyOrMoveMediaItems,
  createEmptyAlbumRecord,
  createSeedLibrary,
  DEFAULT_GALLERY_SETTINGS,
  filterAndSortMedia,
  formatDuration,
  formatFileSize,
  getFastScrollBadge,
  getFormatBadge,
  groupMediaByDate,
  permanentlyDeleteItems,
  renameMediaItem,
  restoreMediaItems,
  SEED_REFERENCE_TIME,
  toggleFavoriteItems,
  trashMediaItems,
} from './galleryLogic';

test('clampColumns enforces One UI pinch-to-zoom bounds 2..5', () => {
  assert.equal(clampColumns(1), 2);
  assert.equal(clampColumns(2), 2);
  assert.equal(clampColumns(4), 4);
  assert.equal(clampColumns(8), 5);
});

test('filterAndSortMedia filters locally by name, folder, and camera EXIF', () => {
  const all = createSeedLibrary();
  const internal = all.filter((i) => i.source === 'internal' && !i.isTrashed);
  const byAlbum = filterAndSortMedia(internal, 'dolomites', 'date_desc');
  assert.equal(byAlbum.length, 2);

  const byExternalFolder = filterAndSortMedia(all, 'kyoto', 'date_desc');
  assert.equal(byExternalFolder.length, 2);

  const bySize = filterAndSortMedia(internal, '', 'size_desc');
  assert.equal(bySize[0].id, 'vid-coast-surf');

  const byNameAsc = filterAndSortMedia(internal, '', 'name_asc');
  assert.ok(byNameAsc[0].displayName <= byNameAsc[1].displayName);
});

test('groupMediaByDate produces Today, Yesterday, and month badges for fast scroll', () => {
  const internal = createSeedLibrary().filter((i) => i.source === 'internal' && !i.isTrashed);
  const sorted = filterAndSortMedia(internal, '', 'date_desc');
  const groups = groupMediaByDate(sorted, SEED_REFERENCE_TIME);

  assert.equal(groups[0].title, 'Today');
  assert.equal(groups[1].title, 'Yesterday');
  assert.equal(getFastScrollBadge(groups, 0), 'Nov 2026');
  assert.equal(getFastScrollBadge(groups, 0.99), 'Sep 2026');
});

test('buildAlbums places Camera first for internal storage and indexes external SAF folders', () => {
  const items = createSeedLibrary();
  const internalAlbums = buildAlbums(items, 'internal');
  assert.equal(internalAlbums[0].name, 'Camera');

  const externalFolders = buildAlbums(items, 'external');
  assert.equal(externalFolders.length, 4);
  assert.ok(externalFolders.some((f) => f.name === 'RAW_S25U_DNG'));
  assert.ok(externalFolders.some((f) => f.name === '8K_Log_Footage'));
  assert.ok(externalFolders.some((f) => f.name === 'Dolomites'));
});

test('persistent empty albums remain visible with 0 items and receive copied media', () => {
  const items = createSeedLibrary();
  const emptyRecord = createEmptyAlbumRecord('Portraits 2026', 'internal');
  assert.ok(emptyRecord);
  assert.equal(emptyRecord.name, 'Portraits 2026');
  assert.equal(emptyRecord.storagePath, '/storage/emulated/0/Pictures/Portraits 2026/');

  const allAlbums = computeAllAlbums(items, [emptyRecord], true, DEFAULT_GALLERY_SETTINGS);
  const created = allAlbums.find((a) => a.name === 'Portraits 2026');
  assert.ok(created);
  assert.equal(created.itemCount, 0);
  assert.equal(created.coverItem, null);
  assert.equal(created.isCustomEmpty, true);

  // Toggling showEmptyAlbums off hides 0-item album
  const hiddenEmpty = computeAllAlbums(items, [emptyRecord], true, {
    ...DEFAULT_GALLERY_SETTINGS,
    showEmptyAlbums: false,
  });
  assert.equal(hiddenEmpty.find((a) => a.name === 'Portraits 2026'), undefined);

  // Copying media into the 0-item album transitions it into a populated album with 1 item
  const afterCopy = copyOrMoveMediaItems(items, new Set(['img-seoul-night']), created, false);
  const albumsAfterCopy = computeAllAlbums(afterCopy, [emptyRecord], true, DEFAULT_GALLERY_SETTINGS);
  const populated = albumsAfterCopy.find((a) => a.name === 'Portraits 2026');
  assert.ok(populated);
  assert.equal(populated.itemCount, 1);
  assert.equal(populated.isCustomEmpty, false);
});

test('mergeAlbums combines identically-named Internal and External folders cleanly', () => {
  const items = createSeedLibrary();
  const unmerged = computeAllAlbums(items, [], true, {
    ...DEFAULT_GALLERY_SETTINGS,
    mergeAlbums: false,
  });
  const unmergedDolomites = unmerged.find((a) => a.name === 'Dolomites');
  assert.equal(unmergedDolomites?.itemCount, 2);
  assert.equal(unmergedDolomites?.isMerged, false);

  const merged = computeAllAlbums(items, [], true, {
    ...DEFAULT_GALLERY_SETTINGS,
    mergeAlbums: true,
  });
  const mergedDolomites = merged.find((a) => a.name === 'Dolomites');
  assert.equal(mergedDolomites?.itemCount, 3);
  assert.equal(mergedDolomites?.isMerged, true);
});

test('hideAlbums and selectEssentialAlbums filter visible Albums accurately', () => {
  const items = createSeedLibrary();
  const all = computeAllAlbums(items, [], true, DEFAULT_GALLERY_SETTINGS);

  const withHidden = computeVisibleAlbums(all, {
    ...DEFAULT_GALLERY_SETTINGS,
    hiddenAlbumIds: ['wallpapers'],
  });
  assert.equal(withHidden.some((a) => a.id === 'wallpapers'), false);

  const withEssential = computeVisibleAlbums(all, {
    ...DEFAULT_GALLERY_SETTINGS,
    essentialAlbumsEnabled: true,
    essentialAlbumIds: ['camera'],
  });
  assert.equal(withEssential.length, 1);
  assert.equal(withEssential[0].id, 'camera');
});

test('getFormatBadge detects RAW, 8K, 4K, and GIF badges accurately', () => {
  const items = createSeedLibrary();
  assert.equal(getFormatBadge(items.find((i) => i.id === 'img-atrium-geometry')!), 'RAW');
  assert.equal(getFormatBadge(items.find((i) => i.id === 'vid-coast-surf')!), '8K');
  assert.equal(getFormatBadge(items.find((i) => i.id === 'vid-kyoto-rain')!), '4K');
  assert.equal(getFormatBadge(items.find((i) => i.id === 'img-kyoto-lanterns')!), 'GIF');
  assert.equal(getFormatBadge(items.find((i) => i.id === 'img-seoul-night')!), null);
});

test('file operations: favorite, rename, copy/move, trash, restore, permanent delete', () => {
  const initial = createSeedLibrary();
  const targetId = 'img-espresso-morning';

  const favorited = toggleFavoriteItems(initial, new Set([targetId]));
  assert.equal(favorited.find((i) => i.id === targetId)?.isFavorite, true);

  const renamed = renameMediaItem(favorited, targetId, 'Morning_Espresso_S25U.jpg');
  assert.equal(renamed.find((i) => i.id === targetId)?.displayName, 'Morning_Espresso_S25U.jpg');

  const copied = copyOrMoveMediaItems(
    renamed,
    new Set([targetId]),
    {
      id: 'ext-kyoto-trip',
      name: 'Kyoto_Trip',
      source: 'external',
      storagePath: 'USB-C NVMe:/Samsung_T9_2TB/Kyoto_Trip/',
    },
    false
  );
  assert.equal(copied.length, renamed.length + 1);

  const moved = copyOrMoveMediaItems(
    renamed,
    new Set([targetId]),
    {
      id: 'travel',
      name: 'Dolomites',
      source: 'internal',
      storagePath: '/storage/emulated/0/Pictures/Dolomites/',
    },
    true
  );
  assert.equal(moved.length, renamed.length);
  assert.equal(moved.find((i) => i.id === targetId)?.albumName, 'Dolomites');

  const trashed = trashMediaItems(moved, new Set([targetId]));
  assert.equal(trashed.find((i) => i.id === targetId)?.isTrashed, true);

  const restored = restoreMediaItems(trashed, new Set([targetId]));
  assert.equal(restored.find((i) => i.id === targetId)?.isTrashed, false);

  const purged = permanentlyDeleteItems(restored, new Set([targetId]));
  assert.equal(purged.find((i) => i.id === targetId), undefined);
});

test('formatFileSize and formatDuration format accurately', () => {
  assert.equal(formatFileSize(14_820_410), '14.1 MB');
  assert.equal(formatFileSize(1_420_000_000), '1.32 GB');
  assert.equal(formatDuration(95_000), '1:35');
  assert.equal(formatDuration(42_000), '0:42');
});
