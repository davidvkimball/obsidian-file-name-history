import { Plugin, TAbstractFile, TFile } from 'obsidian';
import { AliasFilenameHistorySettings, DEFAULT_SETTINGS } from './settings';
import { AliasFilenameHistorySettingTab } from './ui/settings-tab';
import { AliasProcessor } from './utils/alias-processor';
import { getBasename, getImmediateParentName } from './utils/path-utils';

export default class AliasFilenameHistoryPlugin extends Plugin {
  settings: AliasFilenameHistorySettings;
  private debounceMap: Map<string, { queue: Set<string>; timeoutId: number; currentPath: string }> = new Map();
  private aliasProcessor: AliasProcessor;

  async onload() {
    await this.loadSettings();
    this.aliasProcessor = new AliasProcessor(this.app, this.settings);
    this.addSettingTab(new AliasFilenameHistorySettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
        this.handleRename(file, oldPath);
      })
    );
  }

  onunload() {
    // Clear any pending timeouts
    for (const entry of this.debounceMap.values()) {
      if (entry.timeoutId !== 0) {
        window.clearTimeout(entry.timeoutId);
      }
    }
    this.debounceMap.clear();
  }

  async loadSettings() {
    const loadedData = (await this.loadData()) as Partial<AliasFilenameHistorySettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private isPathInFolder(path: string, folder: string): boolean {
    // Handle vault root variable
    if (folder.includes('{vault}') || folder.includes('{root}')) {
      const resolvedFolder = folder.replace(/\{vault\}|\{root\}/g, '');
      // If the folder is just the variable, it means include only vault root files
      if (resolvedFolder === '' || resolvedFolder === '/') {
        // Include only files directly in the vault root (no subfolders)
        const isVaultRoot = !path.includes('/');
        return isVaultRoot;
      }
      // Otherwise, replace the variable and check normally
      return path.startsWith(resolvedFolder + '/') || path === resolvedFolder;
    }
    
    // Normal folder matching
    return path.startsWith(folder + '/') || path === folder;
  }

  private isPathExcluded(path: string, excludePattern: string): boolean {
    // Handle vault root variable
    if (excludePattern.includes('{vault}') || excludePattern.includes('{root}')) {
      const resolvedPattern = excludePattern.replace(/\{vault\}|\{root\}/g, '');
      if (resolvedPattern === '' || resolvedPattern === '/') {
        // Exclude only files directly in the vault root (no subfolders)
        return !path.includes('/');
      }
      excludePattern = resolvedPattern;
    }

    // Handle wildcards
    if (excludePattern.endsWith('/**')) {
      // Recursive exclusion: docs/** matches docs and all subfolders
      const baseFolder = excludePattern.slice(0, -3);
      return path.startsWith(baseFolder + '/') || path === baseFolder;
    } else if (excludePattern.endsWith('/*')) {
      // Direct children only: docs/* matches docs/subfolder but not docs/subfolder/nested
      // Should exclude files in subfolders, but NOT files directly in the base folder
      const baseFolder = excludePattern.slice(0, -2);
      if (!path.startsWith(baseFolder + '/')) {
        return path === baseFolder;
      }
      const pathAfterBase = path.slice(baseFolder.length + 1);
      // Exclude if path is in a subfolder (has at least one slash)
      // Don't exclude files directly in the base folder (no slash)
      return pathAfterBase.includes('/');
    }
    
    // Normal folder matching
    return path.startsWith(excludePattern + '/') || path === excludePattern;
  }

  private handleRename(newFile: TAbstractFile, oldPath: string) {
    if (!(newFile instanceof TFile)) return;
    if (!this.settings.fileExtensions.includes(newFile.extension)) return;

    const oldBasename = getBasename(oldPath);
    const newBasename = newFile.basename;
    const oldImmediateParentName = getImmediateParentName(oldPath);
    const newImmediateParentName = getImmediateParentName(newFile.path);

    const isNameChange = this.settings.caseSensitive
      ? oldBasename !== newBasename
      : oldBasename.toLowerCase() !== newBasename.toLowerCase();
    const isFolderChange = oldImmediateParentName !== newImmediateParentName && !isNameChange;

    if (!isNameChange && !isFolderChange) {
      return;
    }

    const path = newFile.path;
    
    // Apply filtering checks to both file name changes and folder renames
    // Priority: Property exclusion -> Include folders -> Exclude folders
    
    // 1. Check property-based exclusion first (highest priority)
    if (this.settings.excludePropertyName && this.settings.excludePropertyName.trim() !== '') {
      const cache = this.app.metadataCache.getFileCache(newFile);
      const frontmatter = cache?.frontmatter;
      if (frontmatter && frontmatter[this.settings.excludePropertyName] === true) {
        return; // Exclude this file
      }
    }
    
    // 2. Check include folders (if includeFolders is not empty, only include those)
    if (this.settings.includeFolders.length > 0) {
      if (!this.settings.includeFolders.some(f => this.isPathInFolder(path, f))) {
        return; // Not in any included folder
      }
    }
    
    // 3. Check exclude folders (with wildcard support)
    // Special case: if tracking folder renames for a specific file name, allow it even in excluded subfolders
    // unless using recursive exclusion (**) or the file is nested deeper than one level
    const isIndexFileForFolderRename = isFolderChange && 
      this.settings.trackFolderRenames && 
      this.settings.trackFolderRenames.trim() !== '' &&
      (this.settings.caseSensitive 
        ? newFile.basename === this.settings.trackFolderRenames
        : newFile.basename.toLowerCase() === this.settings.trackFolderRenames.toLowerCase());
    
    for (const excludePattern of this.settings.excludeFolders) {
      if (this.isPathExcluded(path, excludePattern)) {
        // If this is an index file for folder rename tracking, and the pattern is /* (not /**),
        // allow it through only if it's in a direct child folder (one level deep)
        if (isIndexFileForFolderRename && excludePattern.endsWith('/*') && !excludePattern.endsWith('/**')) {
          // Check if the file is in a direct child (only one level deep)
          const baseFolder = excludePattern.slice(0, -2);
          if (path.startsWith(baseFolder + '/')) {
            const pathAfterBase = path.slice(baseFolder.length + 1);
            const pathParts = pathAfterBase.split('/');
            // If there's only one path part before the filename, it's a direct child
            // pathParts will be like ['subfolder', 'filename.md'] - we want exactly 2 parts
            if (pathParts.length === 2) {
              continue; // Skip this exclusion - it's a direct child index file
            }
          }
        }
        return; // Excluded by folder pattern
      }
    }

    // Check ignore regexes
    const regexes: RegExp[] = [];
    for (const regexStr of this.settings.ignoreRegexes) {
      try {
        regexes.push(new RegExp(regexStr));
      } catch (e) {
        console.error(`Invalid ignore regex: ${regexStr}`, e);
      }
    }

    let toQueue: string | null = null;
    if (isNameChange) {
      if (regexes.some(re => re.test(oldBasename) || re.test(newBasename))) {
        return;
      }
      toQueue = oldBasename;
    } else if (isFolderChange && this.settings.trackFolderRenames && this.settings.trackFolderRenames.trim() !== '') {
      // Check if the current file name matches the specified name (without extension)
      const currentBasename = newFile.basename;
      const matchesFilename = this.settings.caseSensitive 
        ? currentBasename === this.settings.trackFolderRenames
        : currentBasename.toLowerCase() === this.settings.trackFolderRenames.toLowerCase();
      
      if (!matchesFilename) {
        return;
      }
      
      if (oldImmediateParentName === '' || newImmediateParentName === '') {
        return;
      }
      if (regexes.some(re => re.test(oldImmediateParentName) || re.test(newImmediateParentName))) {
        return;
      }
      toQueue = oldImmediateParentName;
    }

    if (!toQueue) return;

    // Check if there's already a pending timeout for this file
    // We need to check both the new path and the old path since the file was just renamed
    let existingEntry = this.debounceMap.get(newFile.path);
    if (!existingEntry) {
      // Check if there's a timeout for the old path (the file was just renamed from there)
      existingEntry = this.debounceMap.get(oldPath);
      if (existingEntry) {
        // Remove the old entry since we're updating it with the new path
        this.debounceMap.delete(oldPath);
      }
    }
    
    if (existingEntry) {
      // File was renamed again before timeout expired - cancel the previous timeout
      if (existingEntry.timeoutId !== 0) {
        window.clearTimeout(existingEntry.timeoutId);
      }
      
      // Use the original stable name from the previous timeout, not the temporary name
      toQueue = Array.from(existingEntry.queue)[0]; // Use the original stable name
    }

    // Create entry to track the timeout
    const entry = { 
      queue: new Set<string>([toQueue]), 
      timeoutId: 0, 
      currentPath: newFile.path 
    };

    // Set timeout to actually store the alias after the debounce period
    entry.timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          await this.aliasProcessor.processAliases(entry.currentPath, entry.queue);
        } catch (error) {
          console.error('Error processing aliases:', error);
        }
        this.debounceMap.delete(entry.currentPath);
      })();
    }, this.settings.timeoutSeconds * 1000);

    this.debounceMap.set(newFile.path, entry);
  }
}
