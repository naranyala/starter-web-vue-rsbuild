<template>
  <div class="app">
    <Sidebar
      :windows="activeWindows"
      @home="hideAllWindows"
      @toggle="toggleWindow"
      @close="closeWindow"
      @closeAll="closeAllWindows"
    />

    <div class="main-container">
      <Header title="System Dashboard" />

      <main class="main-content">
        <SearchBar v-model="searchQuery" @update:modelValue="filterFeatures" />

        <FeatureList :features="filteredFeatures" />
      </main>
    </div>
  </div>
  
  <!-- WebSocket Status Bar -->
  <WebSocketStatusBar />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import WebSocketStatusBar from '../features/websocket-health/WebSocketStatusBar.vue';
import { FeatureList, Header, SearchBar, Sidebar } from '../shared/components';

const Logger = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
};

declare global {
  interface Window {
    WinBox: any;
  }
}

interface WindowInfo {
  id: string;
  title: string;
  minimized: boolean;
  maximized?: boolean;
  winboxInstance: any;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

const activeWindows = ref<WindowInfo[]>([]);
const dbUsers = ref<User[]>([]);
const dbStats = ref({ users: 0, tables: [] as string[] });
const isLoadingUsers = ref(false);
const systemInfo = ref<any>(null);
const isLoadingSystemInfo = ref(false);

const searchQuery = ref('');

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

const generateSystemInfoHTML = () => {
  const now = new Date();
  const backendInfo = systemInfo.value;

  // Backend system info (from Rust)
  const osInfo = backendInfo?.os || {};
  const memInfo = backendInfo?.memory || {};
  const cpuInfo = backendInfo?.cpu || {};
  const diskInfo = backendInfo?.disk || [];

  return `
    <div style="padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; max-height: 100%; overflow-y: auto;">
      <h2 style="margin-bottom: 20px; color: #4f46e5;">💻 System Information</h2>
      
      ${
        isLoadingSystemInfo.value
          ? `
        <div style="text-align: center; padding: 40px;">
          <div style="color: #94a3b8;">Loading system info from backend...</div>
        </div>
      `
          : ''
      }
      
      ${
        backendInfo
          ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">🖥️ Backend System (Rust)</h3>
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 15px; border-radius: 8px; border: 1px solid #4f46e5;">
          
          <div style="margin-bottom: 15px;">
            <h4 style="color: #64748b; font-size: 0.8rem; margin-bottom: 8px;">Operating System</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Platform</span>
                <div style="font-weight: 500;">${osInfo.platform || 'N/A'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Architecture</span>
                <div style="font-weight: 500;">${osInfo.arch || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <h4 style="color: #64748b; font-size: 0.8rem; margin-bottom: 8px;">Memory</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Total</span>
                <div style="font-weight: 500; color: #10b981;">${formatBytes(memInfo.total || 0)}</div>
              </div>
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Available</span>
                <div style="font-weight: 500; color: #3b82f6;">${formatBytes(memInfo.available || 0)}</div>
              </div>
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Used</span>
                <div style="font-weight: 500; color: #f59e0b;">${formatBytes(memInfo.used || 0)}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <h4 style="color: #64748b; font-size: 0.8rem; margin-bottom: 8px;">CPU</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Model</span>
                <div style="font-weight: 500; font-size: 0.85rem;">${cpuInfo.model || 'N/A'}</div>
              </div>
              <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                <span style="color: #64748b; font-size: 0.75rem;">Cores</span>
                <div style="font-weight: 500;">${cpuInfo.cores || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <h4 style="color: #64748b; font-size: 0.8rem; margin-bottom: 8px;">Disk</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${
                diskInfo.length > 0
                  ? diskInfo
                      .map(
                        (disk: any) => `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: 500;">${disk.mount_point || disk.device || 'Unknown'}</span>
                    <span style="color: #94a3b8;">${disk.usage_percent?.toFixed(1) || 0}%</span>
                  </div>
                  <div style="background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                    <div style="background: ${disk.usage_percent > 90 ? '#ef4444' : disk.usage_percent > 70 ? '#f59e0b' : '#10b981'}; height: 100%; width: ${disk.usage_percent || 0}%;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.75rem; color: #64748b;">
                    <span>${formatBytes(disk.used || 0)} used</span>
                    <span>${formatBytes(disk.available || 0)} available</span>
                  </div>
                </div>
              `
                      )
                      .join('')
                  : '<div style="color: #64748b;">No disk info available</div>'
              }
            </div>
          </div>

          <div>
            <h4 style="color: #64748b; font-size: 0.8rem; margin-bottom: 8px;">Runtime</h4>
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
              <span style="color: #64748b; font-size: 0.75rem;">Uptime</span>
              <div style="font-weight: 500;">${backendInfo.uptime || 'N/A'}</div>
            </div>
          </div>

        </div>
      </div>
      `
          : ''
      }
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">🌐 Frontend (Browser)</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div>
              <span style="color: #64748b; font-size: 0.8rem;">Platform:</span>
              <span>${navigator.platform}</span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 0.8rem;">Language:</span>
              <span>${navigator.language}</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 0.8rem;">Online:</span>
            <span style="color: ${navigator.onLine ? '#10b981' : '#ef4444'}">${navigator.onLine ? '🟢 Yes' : '🔴 No'}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <span style="color: #64748b; font-size: 0.8rem;">Cores:</span>
              <span>${navigator.hardwareConcurrency || 'Unknown'}</span>
            </div>
            <div>
              <span style="color: #64748b; font-size: 0.8rem;">Memory:</span>
              <span>${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 10px;">⏰ Current Time</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b;">Local Time:</span>
            <span>${now.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Timezone:</span>
            <span>${Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

const generateSQLiteHTML = (): string => {
  const users =
    dbUsers.value.length > 0
      ? dbUsers.value
      : [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
          {
            id: 3,
            name: 'Bob Johnson',
            email: 'bob@example.com',
            role: 'User',
            status: 'Inactive',
          },
          {
            id: 4,
            name: 'Alice Brown',
            email: 'alice@example.com',
            role: 'Editor',
            status: 'Active',
          },
          {
            id: 5,
            name: 'Charlie Wilson',
            email: 'charlie@example.com',
            role: 'User',
            status: 'Pending',
          },
        ];

  const rows = users
    .map(
      (row: any) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 10px; color: #e2e8f0;">${row.id}</td>
      <td style="padding: 10px; color: #e2e8f0;">${row.name}</td>
      <td style="padding: 10px; color: #94a3b8;">${row.email}</td>
      <td style="padding: 10px;"><span style="background: ${row.role === 'Admin' ? '#dc2626' : row.role === 'Editor' ? '#f59e0b' : '#3b82f6'}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${row.role}</span></td>
      <td style="padding: 10px;"><span style="color: ${row.status === 'Active' ? '#10b981' : row.status === 'Inactive' ? '#ef4444' : '#f59e0b'}">● ${row.status}</span></td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="padding: 20px; color: white; font-family: 'Segoe UI', sans-serif; height: 100%; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5;">🗄️ SQLite Database Viewer</h2>
        <span style="background: #10b981; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem;">Live Data</span>
      </div>

      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <input type="text" id="db-search" placeholder="Search records..." style="flex: 1; padding: 8px 12px; background: rgba(0,0,0,0.3); border: 1px solid #334155; border-radius: 6px; color: white; font-size: 0.9rem;">
          <button onclick="searchUsers()" style="padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">Search</button>
          <button onclick="refreshUsers()" style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">↻</button>
        </div>

        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #94a3b8;">
          <span>📊 Table: <strong style="color: white;">users</strong></span>
          <span>📋 Records: <strong style="color: white;">${users.length}</strong></span>
          <span>💾 Source: <strong style="color: white;">Rust SQLite</strong></span>
        </div>
      </div>

      <div style="flex: 1; overflow: auto; background: rgba(0,0,0,0.2); border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: rgba(255,255,255,0.1); position: sticky; top: 0;">
            <tr>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">ID</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Name</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Email</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Role</th>
              <th style="padding: 12px 10px; text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.85rem;">Status</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            ${rows}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #64748b; font-size: 0.8rem;">Showing ${users.length} record${users.length !== 1 ? 's' : ''}</span>
        <div style="display: flex; gap: 5px;">
          <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Previous</button>
          <button style="padding: 5px 12px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" disabled>Next</button>
        </div>
      </div>
    </div>
  `;
};

const openSystemInfoWindow = async () => {
  isLoadingSystemInfo.value = true;
  systemInfo.value = null;

  // Open window first with loading state
  openWindow('System Information', generateSystemInfoHTML(), '💻');

  // Fetch system info from backend
  try {
    const webui = (window as any).webui;
    if (webui) {
      Logger.info('Fetching system info from backend...');
      const result = await webui.call('getSystemInfo', {});
      Logger.info('System info received:', result);
      systemInfo.value = result;
      isLoadingSystemInfo.value = false;

      // Re-generate HTML with the new data
      // Find and update the window content
      const windows = document.querySelectorAll('.winbox');
      if (windows.length > 0) {
        const lastWindow = windows[windows.length - 1];
        const contentDiv = lastWindow.querySelector('[id^="win-"]') || lastWindow;
        if (contentDiv) {
          contentDiv.innerHTML = generateSystemInfoHTML();
        }
      }
    } else {
      Logger.warn('WebUI not available for system info');
      isLoadingSystemInfo.value = false;
    }
  } catch (error) {
    Logger.error('Failed to fetch system info:', error);
    isLoadingSystemInfo.value = false;
  }
};

const openSQLiteWindow = () => {
  isLoadingUsers.value = true;
  Logger.info('Opening SQLite window, fetching users from backend...');

  if ((window as any).getUsers) {
    Logger.info('Calling Rust backend get_users function');
    (window as any).getUsers();
  } else {
    Logger.warn('Rust backend get_users not available');
    isLoadingUsers.value = false;
  }

  if ((window as any).getDbStats) {
    (window as any).getDbStats();
  }

  openWindow('SQLite Database', generateSQLiteHTML(), '🗄️');
};

const openFileManagerWindow = () => {
  openWindow(
    'File Manager',
    `
    <article class="winbox-content">
      <header class="content-header">
        <h2>📁 File Manager</h2>
        <p class="content-subtitle">Browse and manage your files</p>
      </header>
      <div class="content-body">
        <div class="file-grid">
          <div class="file-item">
            <div class="file-icon">📂</div>
            <span class="file-name">Documents</span>
          </div>
          <div class="file-item">
            <div class="file-icon">📂</div>
            <span class="file-name">Downloads</span>
          </div>
          <div class="file-item">
            <div class="file-icon">📂</div>
            <span class="file-name">Pictures</span>
          </div>
          <div class="file-item">
            <div class="file-icon">📂</div>
            <span class="file-name">Music</span>
          </div>
          <div class="file-item">
            <div class="file-icon">📄</div>
            <span class="file-name">README.md</span>
          </div>
          <div class="file-item">
            <div class="file-icon">📄</div>
            <span class="file-name">config.json</span>
          </div>
        </div>
      </div>
    </article>
    `,
    '📁'
  );
};

const openSettingsWindow = () => {
  openWindow(
    'Settings',
    `
    <article class="winbox-content">
      <header class="content-header">
        <h2>⚙️ Settings</h2>
        <p class="content-subtitle">Configure your application</p>
      </header>
      <div class="content-body">
        <div class="settings-section">
          <h3>General</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" checked />
              <span>Enable notifications</span>
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" checked />
              <span>Auto-save preferences</span>
            </label>
          </div>
          <div class="setting-item">
            <label>
              <span>Theme</span>
              <select>
                <option>Dark</option>
                <option>Light</option>
                <option>System</option>
              </select>
            </label>
          </div>
        </div>
        <div class="settings-section">
          <h3>Performance</h3>
          <div class="setting-item">
            <label>
              <span>Animation speed</span>
              <input type="range" min="0" max="100" value="75" />
            </label>
          </div>
        </div>
      </div>
    </article>
    `,
    '⚙️'
  );
};

const openClipboardWindow = () => {
  openWindow(
    'Clipboard',
    `
    <article class="winbox-content">
      <header class="content-header">
        <h2>📋 Clipboard Manager</h2>
        <p class="content-subtitle">Recent clipboard items</p>
      </header>
      <div class="content-body">
        <div class="clipboard-list">
          <div class="clipboard-item">
            <span class="clipboard-preview">Hello, World!</span>
            <span class="clipboard-time">2 min ago</span>
          </div>
          <div class="clipboard-item">
            <span class="clipboard-preview">https://example.com/page</span>
            <span class="clipboard-time">5 min ago</span>
          </div>
          <div class="clipboard-item">
            <span class="clipboard-preview">{"key": "value"}</span>
            <span class="clipboard-time">1 hour ago</span>
          </div>
        </div>
      </div>
    </article>
    `,
    '📋'
  );
};

const openDialogsWindow = () => {
  openWindow(
    'Dialogs',
    `
    <article class="winbox-content">
      <header class="content-header">
        <h2>💬 System Dialogs</h2>
        <p class="content-subtitle">Native dialog demonstrations</p>
      </header>
      <div class="content-body">
        <div class="button-grid">
          <button class="demo-btn" onclick="alert('Hello!')">Show Alert</button>
          <button class="demo-btn" onclick="confirm('Are you sure?')">Show Confirm</button>
          <button class="demo-btn" onclick="prompt('Enter your name')">Show Prompt</button>
        </div>
        <div class="dialog-info">
          <p>These dialogs use the native system dialogs via WebUI.</p>
        </div>
      </div>
    </article>
    `,
    '💬'
  );
};

const openProcessWindow = () => {
  openWindow(
    'Process Manager',
    `
    <article class="winbox-content">
      <header class="content-header">
        <h2>⚙️ Process Manager</h2>
        <p class="content-subtitle">Monitor and manage system processes</p>
      </header>
      <div class="content-body">
        <table class="process-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Name</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1234</td>
              <td>chrome.exe</td>
              <td>12.5%</td>
              <td>512 MB</td>
              <td><span class="status-badge running">Running</span></td>
            </tr>
            <tr>
              <td>5678</td>
              <td>node.exe</td>
              <td>3.2%</td>
              <td>128 MB</td>
              <td><span class="status-badge running">Running</span></td>
            </tr>
            <tr>
              <td>9012</td>
              <td>explorer.exe</td>
              <td>1.1%</td>
              <td>64 MB</td>
              <td><span class="status-badge idle">Idle</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
    `,
    '⚙️'
  );
};

const openUpdaterWindow = () => {
  openWindow(
    'Updater',
    `
    <article class="winbox-content">
      <header class="content-header">
        <h2>🔄 Software Updater</h2>
        <p class="content-subtitle">Check for and install updates</p>
      </header>
      <div class="content-body">
        <div class="update-status">
          <div class="status-icon">✅</div>
          <div class="status-text">
            <h4>You're up to date!</h4>
            <p>Version 1.0.0 - Latest release</p>
          </div>
        </div>
        <div class="update-actions">
          <button class="btn-primary">Check for Updates</button>
          <button class="btn-secondary">View Changelog</button>
        </div>
      </div>
    </article>
    `,
    '🔄'
  );
};

const allFeatures = ref([
  {
    id: 'system-info',
    title: 'System Information',
    description:
      'View detailed system information including OS, memory, CPU, and runtime statistics.',
    icon: '💻',
    tags: ['Hardware', 'Stats'],
    action: openSystemInfoWindow,
  },
  {
    id: 'sqlite-db',
    title: 'SQLite Database',
    description:
      'Interactive database viewer with sample data. Connects to backend SQLite integration.',
    icon: '🗄️',
    tags: ['Database', 'Mockup'],
    action: openSQLiteWindow,
  },
  {
    id: 'file-manager',
    title: 'File Manager',
    description:
      'Browse and manage files with a visual interface. Demonstrates file system integration.',
    icon: '📁',
    tags: ['Files', 'Manager'],
    action: openFileManagerWindow,
  },
  {
    id: 'settings',
    title: 'Settings',
    description:
      'Application configuration and preferences. Manage app settings with live preview.',
    icon: '⚙️',
    tags: ['Config', 'Preferences'],
    action: openSettingsWindow,
  },
  {
    id: 'clipboard',
    title: 'Clipboard',
    description:
      'Access and manipulate system clipboard contents. Cross-platform clipboard operations.',
    icon: '📋',
    tags: ['System', 'Utilities'],
    action: openClipboardWindow,
  },
  {
    id: 'dialogs',
    title: 'Dialogs',
    description: 'Native system dialogs for file picking, alerts, and user interactions.',
    icon: '💬',
    tags: ['UI', 'Interaction'],
    action: openDialogsWindow,
  },
  {
    id: 'process-manager',
    title: 'Process Manager',
    description: 'Monitor and manage system processes with detailed information and controls.',
    icon: '⚙️',
    tags: ['System', 'Monitoring'],
    action: openProcessWindow,
  },
  {
    id: 'updater',
    title: 'Updater',
    description:
      'Check for updates and manage application versioning with automatic update checks.',
    icon: '🔄',
    tags: ['Updates', 'Maintenance'],
    action: openUpdaterWindow,
  },
]);

const filteredFeatures = ref([...allFeatures.value]);

const fuzzySearch = (text: string, query: string): boolean => {
  if (!query.trim()) return true;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length;
};

const filterFeatures = () => {
  if (!searchQuery.value.trim()) {
    filteredFeatures.value = [...allFeatures.value];
    return;
  }

  filteredFeatures.value = allFeatures.value.filter((feature) => {
    return (
      fuzzySearch(feature.title, searchQuery.value) ||
      fuzzySearch(feature.description, searchQuery.value) ||
      feature.tags.some((tag) => fuzzySearch(tag, searchQuery.value))
    );
  });
};

(window as any).refreshUsers = () => {
  Logger.info('Refreshing users from database');
  isLoadingUsers.value = true;
  if ((window as any).getUsers) {
    (window as any).getUsers();
  }
};

(window as any).searchUsers = () => {
  const searchInput = document.getElementById('db-search') as HTMLInputElement;
  const searchTerm = searchInput?.value.toLowerCase() || '';
  Logger.info('Searching users', { term: searchTerm });

  const tableBody = document.getElementById('users-table-body');
  if (tableBody) {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach((row: any) => {
      const text = row.textContent?.toLowerCase() || '';
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  }
};

const updateSQLiteTable = () => {
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody || dbUsers.value.length === 0) return;

  const rows = dbUsers.value
    .map(
      (row: User) => `
    <tr style="border-bottom: 1px solid #334155;">
      <td style="padding: 10px; color: #e2e8f0;">${row.id}</td>
      <td style="padding: 10px; color: #e2e8f0;">${row.name}</td>
      <td style="padding: 10px; color: #94a3b8;">${row.email}</td>
      <td style="padding: 10px;"><span style="background: ${row.role === 'Admin' ? '#dc2626' : row.role === 'Editor' ? '#f59e0b' : '#3b82f6'}; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${row.role}</span></td>
      <td style="padding: 10px;"><span style="color: ${row.status === 'Active' ? '#10b981' : row.status === 'Inactive' ? '#ef4444' : '#f59e0b'}">● ${row.status}</span></td>
    </tr>
  `
    )
    .join('');

  tableBody.innerHTML = rows;
};

const openWindow = (title: string, content: string, icon: string) => {
  if (!window.WinBox) {
    Logger.error('WinBox is not loaded yet. Please try again in a moment.');
    return;
  }

  const existingWindow = activeWindows.value.find((w) => w.title === title);
  if (existingWindow) {
    if (existingWindow.minimized) {
      existingWindow.winboxInstance.restore();
      existingWindow.minimized = false;
    }
    existingWindow.winboxInstance.focus();
    return;
  }

  Logger.info('Opening window', { windowTitle: title });

  const windowId = 'win-' + Date.now();
  let winboxInstance: any;

  winboxInstance = new window.WinBox({
    title: title,
    background: '#1e293b',
    border: 4,
    width: 'calc(100% - 200px)',
    height: '100%',
    x: '200px',
    y: '0',
    minwidth: '300px',
    minheight: '300px',
    max: true,
    min: true,
    mount: document.createElement('div'),
    oncreate: function () {
      this.body.innerHTML = content;
    },
    onfocus: () => {
      // Send window focus event to Rust backend
      if (window.windowFocus) {
        window.windowFocus({
          window_id: windowId,
          window_title: title,
        });
      }
      Logger.info('Window focused', { windowId, title });
    },
    onblur: () => {
      // Send window blur event to Rust backend (optional)
      Logger.info('Window blurred', { windowId, title });
    },
    onminimize: () => {
      const windowInfo = activeWindows.value.find((w) => w.id === windowId);
      if (windowInfo) {
        windowInfo.minimized = true;
      }

      // Send window minimize event to Rust backend
      if (window.windowMinimize) {
        window.windowMinimize({
          window_id: windowId,
          window_title: title,
        });
      }
      Logger.info('Window minimized', { windowId, title });
    },
    onrestore: () => {
      const windowInfo = activeWindows.value.find((w) => w.id === windowId);
      if (windowInfo) {
        windowInfo.minimized = false;
        windowInfo.maximized = false;
      }

      // Send window restore event to Rust backend
      if (window.windowRestore) {
        window.windowRestore({
          window_id: windowId,
          window_title: title,
        });
      }
      Logger.info('Window restored', { windowId, title });
    },
    onmaximize: function () {
      const availableWidth = window.innerWidth - 200;
      const availableHeight = window.innerHeight;

      this.resize(availableWidth, availableHeight);
      this.move(200, 0);

      const windowInfo = activeWindows.value.find((w) => w.id === windowId);
      if (windowInfo) {
        windowInfo.maximized = true;
      }

      // Send window maximize event to Rust backend
      if (window.windowMaximize) {
        window.windowMaximize({
          window_id: windowId,
          window_title: title,
        });
      }
      Logger.info('Window maximized', { windowId, title });
    },
    onclose: () => {
      const index = activeWindows.value.findIndex((w) => w.id === windowId);
      if (index > -1) {
        activeWindows.value.splice(index, 1);
      }

      // Send window close event to Rust backend
      if (window.windowClose) {
        window.windowClose({
          window_id: windowId,
          window_title: title,
        });
      }
      Logger.info('Window closed', { windowId, title });
    },
  });

  const windowInfo = {
    id: windowId,
    title: title,
    minimized: false,
    maximized: false,
    winboxInstance: winboxInstance,
  };
  activeWindows.value.push(windowInfo);
};

const toggleWindow = (windowInfo: WindowInfo) => {
  if (windowInfo.minimized) {
    windowInfo.winboxInstance.restore();
    windowInfo.minimized = false;
  } else if (windowInfo.maximized) {
    windowInfo.winboxInstance.restore();
    windowInfo.maximized = false;
  } else {
    windowInfo.winboxInstance.minimize();
    windowInfo.minimized = true;
  }
};

const closeWindow = (windowInfo: WindowInfo) => {
  windowInfo.winboxInstance.close();
  const index = activeWindows.value.findIndex((w) => w.id === windowInfo.id);
  if (index > -1) {
    activeWindows.value.splice(index, 1);
  }
};

const closeAllWindows = () => {
  activeWindows.value.forEach((windowInfo) => {
    windowInfo.winboxInstance.close();
  });
  activeWindows.value = [];
};

const hideAllWindows = () => {
  activeWindows.value.forEach((windowInfo) => {
    if (!windowInfo.minimized) {
      windowInfo.winboxInstance.minimize();
      windowInfo.minimized = true;
      windowInfo.maximized = false;
    }
  });
  Logger.info('All windows minimized - showing main view');
};

const handleWindowResize = () => {
  activeWindows.value.forEach((windowInfo) => {
    if (windowInfo.maximized && !windowInfo.minimized) {
      const availableWidth = window.innerWidth - 200;
      const availableHeight = window.innerHeight;

      windowInfo.winboxInstance.resize(availableWidth, availableHeight);
      windowInfo.winboxInstance.move(200, 0);
    }
  });
};

onMounted(() => {
  Logger.info('Application initialized');

  window.addEventListener('db_response', ((event: CustomEvent) => {
    const response = event.detail;
    if (response.success) {
      dbUsers.value = response.data || [];
      Logger.info('Users loaded from database', { count: dbUsers.value.length });
      updateSQLiteTable();
    } else {
      Logger.error('Failed to load users', { error: response.error });
    }
    isLoadingUsers.value = false;
  }) as EventListener);

  window.addEventListener('stats_response', ((event: CustomEvent) => {
    const response = event.detail;
    if (response.success) {
      dbStats.value = response.stats;
      Logger.info('Database stats loaded', response.stats);
    }
  }) as EventListener);

  window.addEventListener('resize', handleWindowResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  color: #333;
  font-size: 14px;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  min-height: 0;
}

.wb-dock,
.wb-taskbar,
.winbox-dock,
.winbox-taskbar,
.winbox-dock-container,
.wb-dock-container,
.winbox.minimized ~ .wb-dock,
.winbox.min ~ .wb-dock,
.winbox.minimized ~ .wb-taskbar,
.winbox.min ~ .wb-taskbar {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  height: 0 !important;
  width: 0 !important;
  position: absolute !important;
  bottom: -9999px !important;
}

.winbox.min,
.winbox.minimized {
  opacity: 0 !important;
  pointer-events: none !important;
  top: -9999px !important;
  left: -9999px !important;
}

@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    max-height: 150px;
  }

  .window-list {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .window-item {
    min-width: 150px;
    margin-bottom: 0;
  }

  .feature-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .feature-icon {
    align-self: flex-start;
  }

  .search-container {
    padding: 0.75rem;
  }

  .search-input {
    font-size: 0.9rem;
  }
}

/* ==========================================================================
   WINBOX CONTENT STYLES
   Styles for content inside WinBox windows
   ========================================================================== */

.winbox-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: var(--color-text-primary);
  font-family: var(--font-family-base);
}

.winbox-content .content-header {
  padding: var(--space-4) var(--space-6);
  background: linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));
  border-bottom: 1px solid var(--color-border-secondary);
}

.winbox-content .content-header h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.winbox-content .content-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

.winbox-content .content-body {
  flex: 1;
  padding: var(--space-4) var(--space-6);
  overflow-y: auto;
  background: var(--color-bg-primary);
}

/* File Grid */
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-4);
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-duration-fast) var(--transition-timing-default);
}

.file-item:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.file-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-2);
}

.file-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: center;
  word-break: break-word;
  max-width: 100%;
}

/* Settings */
.settings-section {
  margin-bottom: var(--space-6);
}

.settings-section h3 {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-secondary);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.setting-item input[type="checkbox"] {
  width: auto;
  accent-color: var(--color-accent);
}

.setting-item select {
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.setting-item input[type="range"] {
  width: 150px;
  accent-color: var(--color-accent);
}

/* Clipboard */
.clipboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.clipboard-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
}

.clipboard-preview {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clipboard-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Dialog Buttons */
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.demo-btn {
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-duration-fast) var(--transition-timing-default);
}

.demo-btn:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.dialog-info {
  padding: var(--space-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-secondary);
}

.dialog-info p {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* Process Table */
.process-table {
  width: 100%;
  border-collapse: collapse;
}

.process-table th,
.process-table td {
  padding: var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border-secondary);
}

.process-table th {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  background: var(--color-bg-tertiary);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
}

.process-table td {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.process-table tr:hover {
  background: var(--color-bg-muted);
}

.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
}

.status-badge.running {
  background: rgba(16, 185, 129, 0.2);
  color: var(--color-success);
}

.status-badge.idle {
  background: rgba(148, 163, 184, 0.2);
  color: var(--color-text-tertiary);
}

/* Updater */
.update-status {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.status-icon {
  font-size: 3rem;
}

.status-text h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.status-text p {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin: 0;
}

.update-actions {
  display: flex;
  gap: var(--space-3);
}

.update-actions .btn-primary {
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-duration-fast) var(--transition-timing-default);
}

.update-actions .btn-primary:hover {
  background: var(--color-accent-hover);
}

.update-actions .btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-duration-fast) var(--transition-timing-default);
}

.update-actions .btn-secondary:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-primary);
}

/* Scrollbar for WinBox content */
.winbox-content .content-body::-webkit-scrollbar {
  width: 8px;
}

.winbox-content .content-body::-webkit-scrollbar-track {
  background: transparent;
}

.winbox-content .content-body::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar-thumb);
  border-radius: var(--radius-full);
}

.winbox-content .content-body::-webkit-scrollbar-thumb:hover {
  background: var(--color-scrollbar-thumb-hover);
}
</style>
