import JSZip from 'jszip';

export interface AndroidProjectFile {
  path: string;
  name: string;
  category: 'Gradle & Config' | 'Manifest & Resources' | 'Kotlin Source';
  language: 'kotlin' | 'xml' | 'properties' | 'shell';
  content: string;
  lineCount: number;
}

const rawAndroidModules = import.meta.glob<string>(
  [
    '/settings.gradle.kts',
    '/build.gradle.kts',
    '/gradle.properties',
    '/gradlew',
    '/gradlew.bat',
    '/gradle/wrapper/gradle-wrapper.properties',
    '/app/build.gradle.kts',
    '/app/proguard-rules.pro',
    '/app/src/main/AndroidManifest.xml',
    '/app/src/main/res/**/*.xml',
    '/app/src/main/java/**/*.kt',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
);

function detectCategory(filePath: string): AndroidProjectFile['category'] {
  if (filePath.endsWith('.kt')) return 'Kotlin Source';
  if (filePath.includes('AndroidManifest.xml') || filePath.includes('/res/')) {
    return 'Manifest & Resources';
  }
  return 'Gradle & Config';
}

function detectLanguage(filePath: string): AndroidProjectFile['language'] {
  if (filePath.endsWith('.kt') || filePath.endsWith('.kts')) return 'kotlin';
  if (filePath.endsWith('.xml')) return 'xml';
  if (filePath.endsWith('.properties') || filePath.endsWith('.pro')) return 'properties';
  return 'shell';
}

export function getAndroidProjectFiles(): AndroidProjectFile[] {
  return Object.entries(rawAndroidModules)
    .map(([rawPath, content]) => {
      const cleanPath = rawPath.replace(/^\//, '');
      const name = cleanPath.split('/').pop() ?? cleanPath;
      return {
        path: cleanPath,
        name,
        category: detectCategory(cleanPath),
        language: detectLanguage(cleanPath),
        content,
        lineCount: content.split('\n').length,
      };
    })
    .sort((a, b) => {
      const order = { 'Kotlin Source': 0, 'Gradle & Config': 1, 'Manifest & Resources': 2 };
      const diff = order[a.category] - order[b.category];
      return diff !== 0 ? diff : a.path.localeCompare(b.path);
    });
}

export async function exportAndroidProjectZip(): Promise<{ fileCount: number; filename: string }> {
  const files = getAndroidProjectFiles();
  const zip = new JSZip();
  const rootFolder = zip.folder('Onegal');

  if (!rootFolder) {
    throw new Error('Unable to initialize ZIP root folder');
  }

  for (const file of files) {
    const isExecutable = file.path === 'gradlew';
    rootFolder.file(file.path, file.content, {
      unixPermissions: isExecutable ? '755' : '644',
    });
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    platform: 'UNIX',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const filename = 'onegal-android-project.zip';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { fileCount: files.length, filename };
}
