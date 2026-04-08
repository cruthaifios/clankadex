declare namespace Electron {
  interface ShowOpenDialogReturnValue {
    filePaths?: string[];
    cancelled?: boolean;
  }
}

declare global {
  interface Window {
    showOpenDialog(options: any): Promise<Electron.ShowOpenDialogReturnValue>;
  }
}

export {};