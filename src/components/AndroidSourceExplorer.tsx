import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, FileText, Folder, Search } from 'lucide-react';
import {
  AndroidProjectFile,
  exportAndroidProjectZip,
  getAndroidProjectFiles,
} from '../utils/androidProjectBundle';

interface AndroidSourceExplorerProps {
  initialFilePath?: string;
}

export const AndroidSourceExplorer: React.FC<AndroidSourceExplorerProps> = ({
  initialFilePath,
}) => {
  const files = useMemo(() => getAndroidProjectFiles(), []);
  const [selectedPath, setSelectedPath] = useState<string>(() => {
    if (initialFilePath && files.some((f) => f.path === initialFilePath)) {
      return initialFilePath;
    }
    return (
      files.find((f) => f.path.endsWith('MainActivity.kt'))?.path ??
      files[0]?.path ??
      ''
    );
  });
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
    );
  }, [files, filter]);

  const grouped = useMemo(() => {
    const map = new Map<AndroidProjectFile['category'], AndroidProjectFile[]>();
    for (const f of filteredFiles) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return Array.from(map.entries());
  }, [filteredFiles]);

  const activeFile = files.find((f) => f.path === selectedPath) ?? files[0];
  const totalLines = useMemo(() => files.reduce((sum, f) => sum + f.lineCount, 0), [files]);

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadZip = async () => {
    setExportStatus('Building ZIP...');
    try {
      const res = await exportAndroidProjectZip();
      setExportStatus(`Exported ${res.fileCount} files (${res.filename})`);
      window.setTimeout(() => setExportStatus(null), 3500);
    } catch {
      setExportStatus('Export failed');
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/[0.12]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Native Android Gradle &amp; Kotlin Source (v2.0.0)
          </h1>
          <p className="mt-1.5 text-sm text-[#63636A] dark:text-[#8E8E93] tabular-nums">
            {files.length} complete project files · {totalLines.toLocaleString()} lines ·
            com.onegal.gallery · compileSdk 35 · minSdk 31 · zero stub functions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {exportStatus && (
            <span className="text-xs font-medium text-[#0A0A0C] dark:text-white">
              {exportStatus}
            </span>
          )}
          <button
            type="button"
            onClick={handleDownloadZip}
            className="h-10 px-4 rounded-xl bg-[#111114] hover:bg-[#27272A] text-white dark:bg-white dark:hover:bg-[#E5E5EA] dark:text-black text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Project ZIP</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* File Tree Sidebar */}
        <aside className="lg:col-span-4 xl:col-span-3 rounded-[24px] border border-[#E5E5EA] dark:border-white/[0.12] bg-white dark:bg-[#161618] flex flex-col overflow-hidden max-h-[720px]">
          <div className="p-3 border-b border-[#E5E5EA] dark:border-white/[0.1]">
            <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[#F6F6F8] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-white/[0.12]">
              <Search className="w-3.5 h-3.5 text-[#63636A] dark:text-[#8E8E93]" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter project files..."
                aria-label="Filter Android source files"
                className="w-full bg-transparent text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto onegal-scroll p-2 space-y-4">
            {grouped.map(([category, catFiles]) => (
              <div key={category}>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#63636A] dark:text-[#8E8E93]">
                  <Folder className="w-3.5 h-3.5" />
                  <span>{category}</span>
                  <span className="ml-auto tabular-nums">{catFiles.length}</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {catFiles.map((file) => {
                    const isSelected = activeFile?.path === file.path;
                    return (
                      <li key={file.path}>
                        <button
                          type="button"
                          onClick={() => setSelectedPath(file.path)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-black/8 dark:bg-white/14 text-[#0A0A0C] dark:text-white font-semibold'
                              : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#0A0A0C] dark:text-[#D1D1D6]'
                          }`}
                        >
                          {file.language === 'kotlin' ? (
                            <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          )}
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="text-[11px] opacity-60 tabular-nums shrink-0">
                            {file.lineCount}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Source Code Pane */}
        <div className="lg:col-span-8 xl:col-span-9 rounded-[24px] border border-[#E5E5EA] dark:border-white/[0.12] bg-[#0B0B0D] text-[#F5F5F7] flex flex-col overflow-hidden max-h-[720px]">
          {activeFile && (
            <>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.1] bg-[#161618]">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-white truncate">{activeFile.path}</p>
                  <p className="text-[11px] text-[#8E8E93] tabular-nums mt-0.5">
                    {activeFile.lineCount} lines · {activeFile.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/[0.14] text-xs font-medium text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy file'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto onegal-scroll p-4">
                <pre className="text-[12.5px] leading-6 font-mono text-[#E5E5EA]">
                  <code>
                    {activeFile.content.split('\n').map((line, i) => (
                      <div key={i} className="table-row">
                        <span className="table-cell pr-4 text-right select-none text-[#5A5A64] tabular-nums w-10">
                          {i + 1}
                        </span>
                        <span className="table-cell whitespace-pre">{line || ' '}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
