import React from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eraser,
  Trash2,
} from 'lucide-react';
import {
  formatFileSize,
  GallerySettingsState,
  ThemeMode,
} from '../utils/galleryLogic';

interface OnegalSettingsScreenProps {
  settings: GallerySettingsState;
  themeMode: ThemeMode;
  trashedCount: number;
  thumbnailCacheBytes: number;
  onUpdateSettings: (updater: (prev: GallerySettingsState) => GallerySettingsState) => void;
  onThemeChange: (mode: ThemeMode) => void;
  onOpenEssentialAlbums: () => void;
  onOpenHideAlbums: () => void;
  onEmptyTrash: () => void;
  onClearThumbnailCache: () => void;
  onClose: () => void;
}

/**
 * Full-screen Samsung One UI 8.0 Gallery Settings page (v2):
 * - Pitch-black AMOLED (#000000) canvas, #161618 grouped cards (26px radius) with specular hairline border
 * - Pure monochrome white switches & active highlights in Dark Mode (zero blue)
 * - Zero AI & zero Cloud sync controls
 */
export const OnegalSettingsScreen: React.FC<OnegalSettingsScreenProps> = ({
  settings,
  themeMode,
  trashedCount,
  thumbnailCacheBytes,
  onUpdateSettings,
  onThemeChange,
  onOpenEssentialAlbums,
  onOpenHideAlbums,
  onEmptyTrash,
  onClearThumbnailCache,
  onClose,
}) => {
  const isDark = themeMode === 'dark';

  const canvasCls = isDark ? 'bg-black text-white' : 'bg-[#F6F6F8] text-[#0A0A0C]';
  const cardCls = isDark
    ? 'bg-[#161618] border-white/[0.12]'
    : 'bg-white border-[#E5E5EA]';
  const dividerCls = isDark ? 'border-white/[0.08]' : 'border-[#E5E5EA]';
  const mutedCls = isDark ? 'text-[#8E8E93]' : 'text-[#63636A]';

  const MonochromeSwitch: React.FC<{
    checked: boolean;
    label: string;
    onChange: (next: boolean) => void;
  }> = ({ checked, label, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative w-[44px] h-[25px] rounded-full transition-colors duration-200 shrink-0 ${
        checked
          ? isDark
            ? 'bg-white'
            : 'bg-[#111114]'
          : isDark
            ? 'bg-[#3A3A3D]'
            : 'bg-[#D1D1D6]'
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-[19px] h-[19px] rounded-full transition-transform duration-200 ${
          checked
            ? isDark
              ? 'translate-x-[19px] bg-black'
              : 'translate-x-[19px] bg-white'
            : isDark
              ? 'translate-x-0 bg-[#B4B4BA]'
              : 'translate-x-0 bg-white'
        }`}
      />
    </button>
  );

  return (
    <div
      data-testid="onegal-settings-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery settings"
      className={`absolute inset-0 z-40 flex flex-col overflow-hidden ${canvasCls}`}
    >
      {/* Top Bar: "< Gallery settings" */}
      <div className="shrink-0 h-14 px-2 flex items-center gap-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back from Gallery settings"
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-[19px] font-bold tracking-tight">Gallery settings</h2>
      </div>

      {/* Scrollable One UI Grouped Settings Cards */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-10 space-y-3">
        {/* Section 1: View & Display */}
        <p className={`px-3 pt-2 text-[12px] font-semibold ${mutedCls}`}>View &amp; Display</p>
        <div className={`rounded-[26px] border overflow-hidden ${cardCls}`}>
          <div
            onClick={() =>
              onUpdateSettings((s) => ({ ...s, fullScreenScrolling: !s.fullScreenScrolling }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Full screen scrolling</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Extend photos &amp; videos edge-to-edge behind status bars in viewer.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.fullScreenScrolling}
              label="Full screen scrolling"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, fullScreenScrolling: next }))}
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <div
            onClick={() =>
              onUpdateSettings((s) => ({ ...s, autoPlayVideos: !s.autoPlayVideos }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Auto play motion photos &amp; videos</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Automatically start silent playback while browsing clips.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.autoPlayVideos}
              label="Auto play motion photos and videos"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, autoPlayVideos: next }))}
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <div
            onClick={() =>
              onUpdateSettings((s) => ({
                ...s,
                originalAspectRatioGrid: !s.originalAspectRatioGrid,
              }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Original aspect ratio grid</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                {settings.originalAspectRatioGrid
                  ? 'Showing uncropped photo proportions in Pictures grid.'
                  : 'Showing uniform square-cropped thumbnails in Pictures grid.'}
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.originalAspectRatioGrid}
              label="Original aspect ratio grid"
              onChange={(next) =>
                onUpdateSettings((s) => ({ ...s, originalAspectRatioGrid: next }))
              }
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <div
            onClick={() =>
              onUpdateSettings((s) => ({ ...s, showFormatBadges: !s.showFormatBadges }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Show file format badges</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Display RAW, 8K, 4K, and GIF format tags on thumbnails.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.showFormatBadges}
              label="Show file format badges"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, showFormatBadges: next }))}
            />
          </div>
        </div>

        {/* Section 2: Albums & Organization */}
        <p className={`px-3 pt-2 text-[12px] font-semibold ${mutedCls}`}>
          Albums &amp; Organization
        </p>
        <div className={`rounded-[26px] border overflow-hidden ${cardCls}`}>
          <div
            onClick={onOpenEssentialAlbums}
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Select essential albums</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                {settings.essentialAlbumsEnabled
                  ? `${settings.essentialAlbumIds.length} album(s) pinned to Albums tab. Tap to edit.`
                  : 'Show only the albums you select on the Albums tab instead of showing them all.'}
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.essentialAlbumsEnabled}
              label="Select essential albums"
              onChange={(next) => {
                onUpdateSettings((s) => ({ ...s, essentialAlbumsEnabled: next }));
                if (next && settings.essentialAlbumIds.length === 0) {
                  onOpenEssentialAlbums();
                }
              }}
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <div
            onClick={() => onUpdateSettings((s) => ({ ...s, mergeAlbums: !s.mergeAlbums }))}
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Merge albums</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Albums with the same name across Internal &amp; External drives will be shown as a
                single album.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.mergeAlbums}
              label="Merge albums"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, mergeAlbums: next }))}
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <button
            type="button"
            onClick={onOpenHideAlbums}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Hide albums</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                {settings.hiddenAlbumIds.length > 0
                  ? `${settings.hiddenAlbumIds.length} album(s) hidden without deleting files`
                  : 'Hide specific folders without deleting files'}
              </p>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${mutedCls}`} />
          </button>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <div
            onClick={() =>
              onUpdateSettings((s) => ({ ...s, showEmptyAlbums: !s.showEmptyAlbums }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Show empty albums</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Keep newly created 0-item albums visible in the Albums tab.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.showEmptyAlbums}
              label="Show empty albums"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, showEmptyAlbums: next }))}
            />
          </div>
        </div>

        {/* Section 3: Privacy, Details & Storage */}
        <p className={`px-3 pt-2 text-[12px] font-semibold ${mutedCls}`}>
          Privacy, Details &amp; Storage
        </p>
        <div className={`rounded-[26px] border overflow-hidden ${cardCls}`}>
          <div
            onClick={() =>
              onUpdateSettings((s) => ({ ...s, showFullExifLocation: !s.showFullExifLocation }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Show full location &amp; EXIF</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Display camera exposure metadata and GPS coordinates in Details.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.showFullExifLocation}
              label="Show full location and EXIF"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, showFullExifLocation: next }))}
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <div
            onClick={() =>
              onUpdateSettings((s) => ({ ...s, trashRetention30Days: !s.trashRetention30Days }))
            }
            className="px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Recycle bin (30-day retention)</p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                Keep deleted local media for 30 days before permanent removal.
              </p>
            </div>
            <MonochromeSwitch
              checked={settings.trashRetention30Days}
              label="Recycle bin 30 day retention"
              onChange={(next) => onUpdateSettings((s) => ({ ...s, trashRetention30Days: next }))}
            />
          </div>

          <div className={`mx-4 border-t ${dividerCls}`} />

          <button
            type="button"
            disabled={trashedCount === 0}
            onClick={onEmptyTrash}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left disabled:opacity-45"
          >
            <div className="min-w-0">
              <p
                className={`text-[14px] font-medium ${
                  trashedCount > 0 ? 'text-[#FF453A]' : ''
                }`}
              >
                Empty Recycle bin
              </p>
              <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>
                {trashedCount > 0
                  ? `${trashedCount} item(s) waiting for permanent deletion`
                  : 'Recycle bin is empty'}
              </p>
            </div>
            <Trash2
              className={`w-4 h-4 shrink-0 ${
                trashedCount > 0 ? 'text-[#FF453A]' : mutedCls
              }`}
            />
          </button>
        </div>

        {/* Section 4: Theme Mode */}
        <p className={`px-3 pt-2 text-[12px] font-semibold ${mutedCls}`}>Theme Mode</p>
        <div className={`rounded-[26px] border overflow-hidden ${cardCls}`}>
          {(
            [
              {
                id: 'dark',
                label: 'Pitch-Black AMOLED Dark',
                desc: 'Pure #000000 canvas with monochrome white accents',
              },
              {
                id: 'light',
                label: 'One UI Light',
                desc: 'Soft #F6F6F8 canvas with crisp high-contrast ink',
              },
            ] as const
          ).map((opt, idx) => (
            <React.Fragment key={opt.id}>
              {idx > 0 && <div className={`mx-4 border-t ${dividerCls}`} />}
              <button
                type="button"
                onClick={() => onThemeChange(opt.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{opt.label}</p>
                  <p className={`text-[12px] leading-snug mt-0.5 ${mutedCls}`}>{opt.desc}</p>
                </div>
                {themeMode === opt.id && (
                  <Check
                    className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-[#111114]'}`}
                  />
                )}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Section 5: About Onegal */}
        <p className={`px-3 pt-2 text-[12px] font-semibold ${mutedCls}`}>About Onegal</p>
        <div className={`rounded-[26px] border overflow-hidden ${cardCls}`}>
          <div className="px-4 py-3.5">
            <p className="text-[14px] font-medium">Version</p>
            <p className={`text-[12px] mt-0.5 ${mutedCls}`}>
              Onegal 2.0.0 · 100% Local · Zero AI · Zero Cloud
            </p>
          </div>
          <div className={`mx-4 border-t ${dividerCls}`} />
          <div className="px-4 py-3.5">
            <p className="text-[14px] font-medium">Permissions</p>
            <p className={`text-[12px] mt-0.5 ${mutedCls}`}>
              Local Photos, Videos, SAF USB-C Tree &amp; EXIF Location granted
            </p>
          </div>
          <div className={`mx-4 border-t ${dividerCls}`} />
          <button
            type="button"
            onClick={onClearThumbnailCache}
            className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Clear Thumbnail Cache</p>
              <p className={`text-[12px] mt-0.5 tabular-nums ${mutedCls}`}>
                Local Coil 3 disk cache: {formatFileSize(thumbnailCacheBytes)}
              </p>
            </div>
            <Eraser className={`w-4 h-4 shrink-0 ${isDark ? 'text-white' : 'text-[#111114]'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
