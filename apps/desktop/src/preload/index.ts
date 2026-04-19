import { contextBridge, ipcRenderer } from "electron";

import type {
  ThemePreferenceMode,
  ThemeUpdateResult,
  WindowSona,
} from "@sona/domain/contracts/window-sona";

const CHANNELS = {
  getBootstrapState: "sona:shell:get-bootstrap-state",
  getThemePreference: "sona:settings:get-theme-preference",
  setThemePreference: "sona:settings:set-theme-preference",
  themeChanged: "sona:settings:theme-changed",
} as const;

interface PreloadBridge {
  exposeInMainWorld: (name: string, api: WindowSona) => void;
}

interface PreloadIpc {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (
    channel: string,
    listener: (
      event: Electron.IpcRendererEvent,
      update: ThemeUpdateResult,
    ) => void,
  ) => void;
  removeListener: (
    channel: string,
    listener: (
      event: Electron.IpcRendererEvent,
      update: ThemeUpdateResult,
    ) => void,
  ) => void;
}

function isThemePreferenceMode(value: unknown): value is ThemePreferenceMode {
  return value === "system" || value === "dark" || value === "light";
}

export function createWindowSonaApi(
  preloadIpc: PreloadIpc = ipcRenderer,
): WindowSona {
  return {
    shell: {
      getBootstrapState() {
        return preloadIpc.invoke(CHANNELS.getBootstrapState) as Promise<
          ReturnType<WindowSona["shell"]["getBootstrapState"]> extends Promise<
            infer T
          >
            ? T
            : never
        >;
      },
    },
    settings: {
      getThemePreference() {
        return preloadIpc.invoke(
          CHANNELS.getThemePreference,
        ) as Promise<ThemePreferenceMode>;
      },
      setThemePreference(mode: ThemePreferenceMode) {
        if (!isThemePreferenceMode(mode)) {
          return Promise.reject(new Error("Invalid theme preference mode."));
        }

        return preloadIpc.invoke(
          CHANNELS.setThemePreference,
          mode,
        ) as Promise<ThemeUpdateResult>;
      },
      subscribeThemeChanges(listener: (update: ThemeUpdateResult) => void) {
        const handler = (
          _event: Electron.IpcRendererEvent,
          update: ThemeUpdateResult,
        ) => {
          listener(update);
        };

        preloadIpc.on(CHANNELS.themeChanged, handler);

        return () => {
          preloadIpc.removeListener(CHANNELS.themeChanged, handler);
        };
      },
    },
  };
}

export function exposeWindowSona(
  bridge: PreloadBridge = contextBridge,
  preloadIpc: PreloadIpc = ipcRenderer,
) {
  const api = createWindowSonaApi(preloadIpc);
  bridge.exposeInMainWorld("sona", api);
  return api;
}

const electronProcessType = (process as NodeJS.Process & { type?: string })
  .type;

if (electronProcessType === "renderer") {
  exposeWindowSona();
}
