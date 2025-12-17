import { App, Plugin, PluginSettingTab } from 'obsidian';
import { AliasFilenameHistorySettings } from '../settings';
import { createSettingsGroup } from '../utils/settings-compat';

interface AliasFilenameHistoryPlugin extends Plugin {
  settings: AliasFilenameHistorySettings;
  saveSettings(): Promise<void>;
}

export class AliasFilenameHistorySettingTab extends PluginSettingTab {
  plugin: AliasFilenameHistoryPlugin;

  constructor(app: App, plugin: AliasFilenameHistoryPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Helper to save settings without returning a promise
    const saveSettings = (): void => {
      void this.plugin.saveSettings();
    };

    const generalGroup = createSettingsGroup(containerEl);

    // General behavior settings (grouped, no heading)
    generalGroup.addSetting((setting) => {
      setting
        .setName('Timeout seconds')
        .setDesc('Time in seconds the name must be stable before adding aliases.')
        .addSlider((slider) =>
          slider
            .setLimits(1, 20, 1)
            .setValue(this.plugin.settings.timeoutSeconds)
            .setDynamicTooltip()
            .onChange((value) => {
              this.plugin.settings.timeoutSeconds = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting) => {
      setting
        .setName('Case-sensitive uniqueness')
        // eslint-disable-next-line obsidianmd/ui/sentence-case
        .setDesc('If enabled, treat note and Note as different aliases.')
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.caseSensitive)
            .onChange((value) => {
              this.plugin.settings.caseSensitive = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting) => {
      setting
        .setName('Auto-create properties')
        .setDesc('Automatically create properties with aliases if missing.')
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.autoCreateFrontmatter)
            .onChange((value) => {
              this.plugin.settings.autoCreateFrontmatter = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting) => {
      setting
        .setName('File extensions')
        .setDesc('Comma-separated list of file extensions to track.')
        .addText((text) =>
          text
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            .setPlaceholder('md, txt')
            .setValue(this.plugin.settings.fileExtensions.join(','))
            .onChange((value) => {
              this.plugin.settings.fileExtensions = value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s);
              saveSettings();
            })
        );
    });

    const filteringGroup = createSettingsGroup(containerEl, 'Filtering');
    const foldersGroup = createSettingsGroup(containerEl, 'Folders');
    const advancedGroup = createSettingsGroup(containerEl, 'Advanced');

    // Filtering settings
    filteringGroup.addSetting((setting) => {
      setting
        .setName('Ignore regex patterns')
        .setDesc(
          'Comma-separated regex patterns for file names or immediate parent folder names to ignore (e.g., ^_ for underscore prefixes, ^untitled$ for untitled). Leave empty to disable.'
        )
        .addText((text) =>
          text
            .setPlaceholder('^_, ^untitled$, ^untitled \\d+$')
            .setValue(this.plugin.settings.ignoreRegexes.join(','))
            .onChange((value) => {
              this.plugin.settings.ignoreRegexes = value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s);
              saveSettings();
            })
        );
    });

    filteringGroup.addSetting((setting) => {
      setting
        .setName('Exclude property name')
        .setDesc(
          'Name of a boolean property to check in files. Files with this property set to true will be excluded from tracking. Takes priority over folder filtering.'
        )
        .addText((text) =>
          text
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            .setPlaceholder('skip-rename-tracking')
            .setValue(this.plugin.settings.excludePropertyName)
            .onChange((value) => {
              this.plugin.settings.excludePropertyName = value;
              saveSettings();
            })
        );
    });

    // Folder include/exclude settings
    foldersGroup.addSetting((setting) => {
      setting
        .setName('Include folders')
        .setDesc(
          'Comma-separated list of folder paths to include. If empty, all folders are included. Use {vault} or {root} to include only files directly in the vault root (no subfolders).'
        )
        .addText((text) =>
          text
            .setValue(this.plugin.settings.includeFolders.join(','))
            .onChange((value) => {
              this.plugin.settings.includeFolders = value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s);
              saveSettings();
            })
        );
    });

    foldersGroup.addSetting((setting) => {
      setting
        .setName('Exclude folders')
        .setDesc(
          'Comma-separated list of folder paths to exclude. Supports wildcards: use "folder/*" to exclude direct children, "folder/**" to exclude all descendants. Use {vault} or {root} to exclude files directly in the vault root.'
        )
        .addText((text) =>
          text
            .setValue(this.plugin.settings.excludeFolders.join(','))
            .onChange((value) => {
              this.plugin.settings.excludeFolders = value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s);
              saveSettings();
            })
        );
    });

    // Advanced / niche options
    advancedGroup.addSetting((setting) => {
      setting
        .setName('Track folder renames for specific file name')
        .setDesc(
          // eslint-disable-next-line obsidianmd/ui/sentence-case
          'If a markdown file matches this file name, store old immediate parent folder names as aliases when parent folders are renamed.'
        )
        .addText((text) =>
          text
            // eslint-disable-next-line obsidianmd/ui/sentence-case
            .setPlaceholder('index')
            .setValue(this.plugin.settings.trackFolderRenames)
            .onChange((value) => {
              this.plugin.settings.trackFolderRenames = value;
              saveSettings();
            })
        );
    });

  }
}
