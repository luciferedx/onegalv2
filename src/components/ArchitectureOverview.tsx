import React from 'react';
import { ArrowRight, Download } from 'lucide-react';

interface ArchitectureOverviewProps {
  onOpenSourceFile: (path: string) => void;
  onExportZip: () => void;
}

const PILLARS = [
  {
    index: '01',
    title: 'Pure Monochrome AMOLED & Glassmorphism',
    summary:
      'True pitch-black #000000 canvas paired with #161618 grouped settings cards, #1C1C1E frosted-glass overlays (84%–88% opacity + 0.75dp specular hairline border), and crisp #FFFFFF active accents with zero blue clutter.',
    specs: [
      'OneUiColors & Modifier.oneUiGlass() across FloatingNavPill, Menu sheet, & Viewer toolbars',
      'Full Samsung One UI 8.0 Gallery Settings screen with monochrome toggles & zero AI/cloud',
      'Adaptive monochrome vector icon + system/AMOLED/light edge-to-edge bar sync',
    ],
    file: 'app/src/main/java/com/onegal/gallery/ui/theme/Theme.kt',
  },
  {
    index: '02',
    title: 'Persistent Empty Albums (DataStore + Physical Folder)',
    summary:
      'Solves Android MediaStore hiding 0-item folders by creating physical directories (File.mkdirs() / DocumentFile.createDirectory() without .nomedia) AND persisting a JSON local album registry in Jetpack DataStore.',
    specs: [
      'Create Album dialog available from Albums "+", Menu sheet, and Copy/Move picker',
      '0-item albums appear immediately with clean placeholder cover and "0" badge',
      'Merge Albums combines identically-named Internal & External USB-C/NVMe folders live',
    ],
    file: 'app/src/main/java/com/onegal/gallery/data/repository/OnegalPreferencesRepository.kt',
  },
  {
    index: '03',
    title: '120Hz Zero-Recomposition Grids & Spring Physics',
    summary:
      'Every LazyVerticalGrid slot uses deterministic keys, contentTypes, hoisted Coil 3 Size requests, draw-phase graphicsLayer collapse, and critically damped One UI springs (dampingRatio = 0.85f).',
    specs: [
      'animateItem() spring placement transitions across 2, 3, 4, and 5 columns with haptic ticks',
      'Toggleable square-cropped vs original aspect ratio tiles + RAW / 8K / 4K / GIF badges',
      'HorizontalPager beyondViewportPageCount = 2 + velocity-aware swipe-down dismiss',
    ],
    file: 'app/src/main/java/com/onegal/gallery/ui/components/MediaGrid.kt',
  },
  {
    index: '04',
    title: 'Complete Local Settings, SAF USB-C & Media3',
    summary:
      'Grouped-card Gallery Settings controls Display, Essential/Hidden/Merged Albums, EXIF privacy, 30-day Recycle bin + Empty Trash, and live Coil 3 disk cache inspection — 100% offline.',
    specs: [
      'Direct SAF DocumentsContract USB-C / NVMe indexing with Safely Eject shortcut',
      'Media3 ExoPlayer 1.5.1 with auto-play, mute, 0.5x–2.0x speed, and PNG frame capture',
      'Compose BOM 2026.04.01 · Coil 3.1.0 · DataStore 1.1.2 · compileSdk 35 · minSdk 31',
    ],
    file: 'app/src/main/java/com/onegal/gallery/ui/screens/SettingsScreen.kt',
  },
];

export const ArchitectureOverview: React.FC<ArchitectureOverviewProps> = ({
  onOpenSourceFile,
  onExportZip,
}) => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Onegal v2 Architecture for Galaxy S25 Ultra
        </h1>
        <p className="mt-3 text-base text-[#63636A] dark:text-[#8E8E93] leading-relaxed">
          Every Kotlin file, DataStore persistence layer, Gradle script, manifest entry, and
          adaptive icon is implemented end-to-end with zero placeholder stubs, zero AI, and zero
          cloud dependencies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PILLARS.map((pillar) => (
          <article
            key={pillar.index}
            className="rounded-[26px] border border-[#E5E5EA] dark:border-white/[0.12] bg-white dark:bg-[#161618] p-6 flex flex-col justify-between gap-5"
          >
            <div>
              <p className="text-xs font-mono text-[#63636A] dark:text-[#A1A1AA] font-semibold">
                {pillar.index}. Architecture
              </p>
              <h2 className="mt-2 font-display text-xl font-bold tracking-tight">
                {pillar.title}
              </h2>
              <p className="mt-2.5 text-sm text-[#63636A] dark:text-[#8E8E93] leading-relaxed">
                {pillar.summary}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-[#0A0A0C] dark:text-[#D1D1D6]">
                {pillar.specs.map((spec) => (
                  <li key={spec} className="leading-relaxed">
                    · {spec}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onOpenSourceFile(pillar.file)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0C] dark:text-white hover:underline self-start"
            >
              <span>Inspect {pillar.file.split('/').pop()}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </article>
        ))}
      </div>

      {/* Local Build Instructions */}
      <section className="rounded-[26px] border border-[#E5E5EA] dark:border-white/[0.12] bg-white dark:bg-[#161618] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Build &amp; install locally via Gradle
          </h2>
          <p className="text-sm text-[#63636A] dark:text-[#8E8E93]">
            Unzip the exported Onegal v2 project on your workstation (JDK 17 + Android SDK 35) and
            build or deploy straight to your Galaxy S25 Ultra over USB-C:
          </p>
          <pre className="rounded-2xl bg-[#0B0B0D] border border-white/[0.12] p-4 text-xs font-mono text-[#E5E5EA] overflow-x-auto">
{`unzip onegal-android-project.zip && cd Onegal
chmod +x gradlew
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk`}
          </pre>
        </div>

        <button
          type="button"
          onClick={onExportZip}
          className="h-11 px-5 rounded-xl bg-[#111114] hover:bg-[#27272A] text-white dark:bg-white dark:hover:bg-[#E5E5EA] dark:text-black text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Android ZIP</span>
        </button>
      </section>
    </div>
  );
};
