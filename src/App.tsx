import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, HardDrive, Moon, Sun, Usb } from 'lucide-react';
import {
  createSeedLibrary,
  ExternalDriveConfig,
  GalleryMediaItem,
  INITIAL_EXTERNAL_DRIVE,
  ThemeMode,
} from './utils/galleryLogic';
import { exportAndroidProjectZip, getAndroidProjectFiles } from './utils/androidProjectBundle';
import { OnegalDevicePreview } from './components/OnegalDevicePreview';
import { AndroidSourceExplorer } from './components/AndroidSourceExplorer';
import { ArchitectureOverview } from './components/ArchitectureOverview';

type WorkspaceSection = 'preview' | 'source' | 'architecture';

const KEY_FILES = [
  {
    label: 'SettingsScreen.kt',
    desc: 'Full One UI 8.0 grouped-card Gallery settings (zero AI/cloud)',
    path: 'app/src/main/java/com/onegal/gallery/ui/screens/SettingsScreen.kt',
  },
  {
    label: 'OnegalPreferencesRepository.kt',
    desc: 'DataStore settings & persistent 0-item empty album registry',
    path: 'app/src/main/java/com/onegal/gallery/data/repository/OnegalPreferencesRepository.kt',
  },
  {
    label: 'Theme.kt',
    desc: 'Monochrome AMOLED palette, oneUiGlass() & 120Hz spring specs',
    path: 'app/src/main/java/com/onegal/gallery/ui/theme/Theme.kt',
  },
  {
    label: 'MediaGrid.kt',
    desc: 'Zero-recomposition 120Hz grid, aspect ratio & format badges',
    path: 'app/src/main/java/com/onegal/gallery/ui/components/MediaGrid.kt',
  },
  {
    label: 'FullScreenViewer.kt',
    desc: 'Glassmorphic viewer, 10x zoom, Media3 player & PNG capture',
    path: 'app/src/main/java/com/onegal/gallery/ui/screens/FullScreenViewer.kt',
  },
];

export default function App() {
  const [section, setSection] = useState<WorkspaceSection>('preview');
  const [focusedSourcePath, setFocusedSourcePath] = useState<string | undefined>(undefined);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [items, setItems] = useState<GalleryMediaItem[]>(() => createSeedLibrary());
  const [externalDrive, setExternalDrive] = useState<ExternalDriveConfig>(INITIAL_EXTERNAL_DRIVE);
  const [picturesColumns, setPicturesColumns] = useState(4);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const projectFiles = useMemo(() => getAndroidProjectFiles(), []);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const result = await exportAndroidProjectZip();
      setExportFeedback(`Downloaded ${result.filename} (${result.fileCount} files)`);
      window.setTimeout(() => setExportFeedback(null), 3200);
    } finally {
      setIsExporting(false);
    }
  };

  const openSourceFile = (filePath: string) => {
    setFocusedSourcePath(filePath);
    setSection('source');
  };

  const toggleExternalDrive = () => {
    setExternalDrive((prev) => ({ ...prev, mounted: !prev.mounted }));
  };

  return (
    <div className="min-h-dvh bg-[#F6F6F8] dark:bg-black text-[#0A0A0C] dark:text-white transition-colors duration-200">
      {/* Strict 3-Zone Monochrome Top Bar Contract */}
      <header className="sticky top-0 z-40 h-14 border-b border-[#E5E5EA] dark:border-white/[0.1] bg-[#F6F6F8]/90 dark:bg-black/90 backdrop-blur-md">
        <div className="max-w-[1360px] h-full mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => setSection('preview')}
            className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#0A0A0C] dark:text-white whitespace-nowrap shrink-0"
          >
            Onegal
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav aria-label="Primary navigation" className="flex items-center gap-3.5 sm:gap-7">
            {(
              [
                { id: 'preview', label: 'Preview', mobileLabel: 'Preview' },
                { id: 'source', label: 'Android Source', mobileLabel: 'Source' },
                { id: 'architecture', label: 'Architecture', mobileLabel: 'Specs' },
              ] as const
            ).map((nav) => {
              const active = section === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setSection(nav.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'border-[#111114] dark:border-white text-[#0A0A0C] dark:text-white'
                      : 'border-transparent text-[#63636A] dark:text-[#8E8E93] hover:text-[#0A0A0C] dark:hover:text-white'
                  }`}
                >
                  <span className="sm:hidden">{nav.mobileLabel}</span>
                  <span className="hidden sm:inline">{nav.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary monochrome CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExporting}
              className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl bg-[#111114] hover:bg-[#27272A] text-white dark:bg-white dark:hover:bg-[#E5E5EA] dark:text-black text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isExporting ? 'Exporting...' : 'Export Android ZIP'}
              </span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>
      </header>

      {exportFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-[#1C1C1E]/92 backdrop-blur-xl border border-white/[0.14] text-white text-xs font-medium shadow-2xl"
        >
          {exportFeedback}
        </div>
      )}

      <main>
        {section === 'preview' && (
          <>
            {/* Mobile (< lg): Edge-to-edge full-bleed Onegal One UI 8.0 experience */}
            <div className="lg:hidden">
              <OnegalDevicePreview
                items={items}
                onItemsChange={setItems}
                externalDrive={externalDrive}
                onToggleExternalDrive={toggleExternalDrive}
                themeMode={themeMode}
                onThemeChange={setThemeMode}
                picturesColumns={picturesColumns}
                onPicturesColumnsChange={setPicturesColumns}
                fullBleedMobile
              />
            </div>

            {/* Desktop (>= lg): Balanced 1440px studio workspace with live S25 Ultra interactive Onegal preview */}
            <div className="hidden lg:grid max-w-[1360px] mx-auto px-8 py-6 grid-cols-12 gap-10 items-start">
              {/* Dominant Focal Anchor: Live Interactive Onegal App */}
              <div className="col-span-5 flex justify-center">
                <OnegalDevicePreview
                  items={items}
                  onItemsChange={setItems}
                  externalDrive={externalDrive}
                  onToggleExternalDrive={toggleExternalDrive}
                  themeMode={themeMode}
                  onThemeChange={setThemeMode}
                  picturesColumns={picturesColumns}
                  onPicturesColumnsChange={setPicturesColumns}
                />
              </div>

              {/* Right Editorial & Hardware Control Companion */}
              <div className="col-span-7 pt-1 space-y-5">
                <div className="space-y-2.5">
                  <p className="text-xs font-mono text-[#63636A] dark:text-[#8E8E93]">
                    com.onegal.gallery · v2.0.0 · Kotlin &amp; Jetpack Compose · One UI 8.0
                  </p>
                  <h1 className="font-display text-4xl font-bold tracking-tight leading-[1.1] max-w-xl">
                    Monochrome 120Hz Android Gallery for Galaxy S25 Ultra
                  </h1>
                  <p className="text-[14.5px] leading-relaxed text-[#63636A] dark:text-[#8E8E93] max-w-2xl">
                    Pitch-black AMOLED glassmorphism, persistent 0-item empty albums, full One UI
                    8.0 Gallery Settings, Coil 3 hardware bitmaps, Media3 playback, and direct SAF
                    USB-C / NVMe drive indexing. 100% local — zero AI, zero cloud.
                  </p>
                </div>

                {/* Interactive Hardware & Ergonomics Controls driving the live preview */}
                <section
                  aria-label="Live hardware simulation controls"
                  className="rounded-[26px] border border-[#E5E5EA] dark:border-white/[0.12] bg-white dark:bg-[#161618] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold">
                      Interactive S25 Ultra Hardware Controls
                    </h2>
                    <span className="text-xs text-[#63636A] dark:text-[#8E8E93] tabular-nums">
                      compileSdk 35 · minSdk 31 · {projectFiles.length} Gradle/Kotlin files
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Theme Toggle */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#63636A] dark:text-[#8E8E93]">
                        Display Theme
                      </p>
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F6F6F8] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => setThemeMode('dark')}
                          className={`flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                            themeMode === 'dark'
                              ? 'bg-white text-black'
                              : 'text-[#63636A] dark:text-[#8E8E93] hover:text-[#0A0A0C] dark:hover:text-white'
                          }`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          <span>AMOLED</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeMode('light')}
                          className={`flex-1 h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                            themeMode === 'light'
                              ? 'bg-[#111114] text-white'
                              : 'text-[#63636A] dark:text-[#8E8E93] hover:text-[#0A0A0C] dark:hover:text-white'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span>Light</span>
                        </button>
                      </div>
                    </div>

                    {/* Pinch-to-Zoom Grid Density */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#63636A] dark:text-[#8E8E93]">
                        Grid Density (2–5 Cols)
                      </p>
                      <div
                        className="flex items-center gap-1 p-1 rounded-xl bg-[#F6F6F8] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/[0.08]"
                        role="group"
                        aria-label="Pictures grid column density"
                      >
                        {[2, 3, 4, 5].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setPicturesColumns(col)}
                            className={`flex-1 h-8 rounded-lg text-xs font-mono tabular-nums font-semibold transition-colors ${
                              picturesColumns === col
                                ? 'bg-[#111114] text-white dark:bg-white dark:text-black'
                                : 'text-[#63636A] dark:text-[#8E8E93] hover:text-[#0A0A0C] dark:hover:text-white'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* USB-C NVMe Plug-and-Play Trigger */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#63636A] dark:text-[#8E8E93]">
                        USB-C NVMe Port
                      </p>
                      <button
                        type="button"
                        onClick={toggleExternalDrive}
                        className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-colors whitespace-nowrap ${
                          externalDrive.mounted
                            ? 'bg-[#111114] text-white border-[#111114] dark:bg-white dark:text-black dark:border-white hover:opacity-90'
                            : 'bg-[#F6F6F8] dark:bg-[#1C1C1E] border-[#E5E5EA] dark:border-white/[0.14] hover:border-white'
                        }`}
                      >
                        {externalDrive.mounted ? (
                          <>
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>Eject T9 2TB</span>
                          </>
                        ) : (
                          <>
                            <Usb className="w-3.5 h-3.5" />
                            <span>Plug In T9 2TB</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Native Stack & Key Kotlin Implementation Jump List */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold">
                      Inspect Native Kotlin v2 Implementations
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('source')}
                      className="text-xs font-semibold text-[#0A0A0C] dark:text-white hover:underline flex items-center gap-1"
                    >
                      <span>Browse all {projectFiles.length} files</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-[#E5E5EA] dark:divide-white/[0.08] rounded-[24px] border border-[#E5E5EA] dark:border-white/[0.12] bg-white dark:bg-[#161618] overflow-hidden">
                    {KEY_FILES.map((file) => (
                      <button
                        key={file.path}
                        type="button"
                        onClick={() => openSourceFile(file.path)}
                        className="w-full px-5 py-3 flex items-center justify-between gap-4 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-mono font-semibold truncate">{file.label}</p>
                          <p className="text-xs text-[#63636A] dark:text-[#8E8E93] mt-0.5 truncate">
                            {file.desc}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#63636A] dark:text-[#8E8E93] shrink-0" />
                      </button>
                    ))}
                  </div>
                </section>

                {/* Clean Dependency Summary Line (Zero Pills) */}
                <div className="pt-1 text-xs text-[#63636A] dark:text-[#8E8E93] flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono">
                  <span>Compose BOM 2026.04.01</span>
                  <span aria-hidden="true">·</span>
                  <span>DataStore 1.1.2</span>
                  <span aria-hidden="true">·</span>
                  <span>Coil 3.1.0</span>
                  <span aria-hidden="true">·</span>
                  <span>Media3 ExoPlayer 1.5.1</span>
                  <span aria-hidden="true">·</span>
                  <span>ExifInterface 1.3.7</span>
                </div>
              </div>
            </div>
          </>
        )}

        {section === 'source' && <AndroidSourceExplorer initialFilePath={focusedSourcePath} />}

        {section === 'architecture' && (
          <ArchitectureOverview
            onOpenSourceFile={openSourceFile}
            onExportZip={handleExportZip}
          />
        )}
      </main>
    </div>
  );
}
