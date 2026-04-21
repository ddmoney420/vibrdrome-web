const SKIP_KEYS = ['vibrdrome_servers', 'vibrdrome_active_server'];

interface SettingsExport {
  version: 1;
  exportedAt: string;
  settings: Record<string, string>;
}

export function exportSettings(): void {
  const settings: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vibrdrome_') && !SKIP_KEYS.includes(key)) {
      settings[key] = localStorage.getItem(key)!;
    }
  }

  const data: SettingsExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vibrdrome-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSettings(file: File): Promise<{ imported: number; skipped: string[] }> {
  const text = await file.text();
  const data: SettingsExport = JSON.parse(text);

  if (data.version !== 1 || !data.settings) {
    throw new Error('Invalid settings file');
  }

  let imported = 0;
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(data.settings)) {
    if (!key.startsWith('vibrdrome_')) {
      skipped.push(key);
      continue;
    }
    if (SKIP_KEYS.includes(key)) {
      skipped.push(key);
      continue;
    }
    localStorage.setItem(key, value);
    imported++;
  }

  return { imported, skipped };
}
