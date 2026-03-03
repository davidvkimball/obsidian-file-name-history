import { App, Plugin, PluginSettingTab , SettingGroup} from 'obsidian';
import { FileNameHistorySettings } from '../settings';


interface FileNameHistoryPlugin extends Plugin {
  settings: FileNameHistorySettings;
  saveSettings(): Promise<void>;
}

export class FileNameHistorySettingTab extends PluginSettingTab {
  plugin: FileNameHistoryPlugin;
  public icon = 'lucide-forward';

  constructor(app: App, plugin: FileNameHistoryPlugin) {
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

    const generalGroup = new SettingGroup(containerEl);

    // General behavior settings (grouped, no heading)
    generalGroup.addSetting((setting: any) => {
      setting
        .setName('History property name')
        .setDesc('The list property to store file name history.')
        .addText((text: any) =>
          text
            .setPlaceholder('aliases')
            .setValue(this.plugin.settings.historyPropertyName)
            .onChange((value: any) => {
              this.plugin.settings.historyPropertyName = value || 'aliases';
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting: any) => {
      setting
        .setName('Timeout seconds')
        .setDesc('Time in seconds the name must be stable before adding to the configured property.')
        .addSlider((slider: any) =>
          slider
            .setLimits(1, 20, 1)
            .setValue(this.plugin.settings.timeoutSeconds)
            .setDynamicTooltip()
            .onChange((value: any) => {
              this.plugin.settings.timeoutSeconds = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting: any) => {
      setting
        .setName('Case-sensitive uniqueness')

        .setDesc('If enabled, treat case differences as unique values in the configured property.')
        .addToggle((toggle: any) =>
          toggle
            .setValue(this.plugin.settings.caseSensitive)
            .onChange((value: any) => {
              this.plugin.settings.caseSensitive = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting: any) => {
      setting
        .setName('Auto-create history property')
        .setDesc('Automatically create the configured property if missing.')
        .addToggle((toggle: any) =>
          toggle
            .setValue(this.plugin.settings.autoCreateFrontmatter)
            .onChange((value: any) => {
              this.plugin.settings.autoCreateFrontmatter = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting((setting: any) => {
      setting
        .setName('File extensions')
        .setDesc('Comma-separated list of file extensions to track.')
        .addText((text: any) =>
          text

            .setPlaceholder('Md, txt')
            .setValue(this.plugin.settings.fileExtensions.join(','))
            .onChange((value: any) => {
              this.plugin.settings.fileExtensions = value
                .split(',')
                .map((s: any) => s.trim())
                .filter((s: any) => s);
              saveSettings();
            })
        );
    });

    const filteringGroup = new SettingGroup(containerEl).setHeading('Filtering');
    const foldersGroup = new SettingGroup(containerEl).setHeading('Folders');
    const advancedGroup = new SettingGroup(containerEl).setHeading('Advanced');

    // Filtering settings
    filteringGroup.addSetting((setting: any) => {
      setting
        .setName('Ignore regex patterns')
        .setDesc(
          'Comma-separated regex patterns for file names or immediate parent folder names to ignore (e.g., ^_ for underscore prefixes, ^untitled$ for untitled). Leave empty to disable.'
        )
        .addText((text: any) =>
          text
            .setPlaceholder('^_, ^untitled$, ^untitled \\d+$')
            .setValue(this.plugin.settings.ignoreRegexes.join(','))
            .onChange((value: any) => {
              this.plugin.settings.ignoreRegexes = value
                .split(',')
                .map((s: any) => s.trim())
                .filter((s: any) => s);
              saveSettings();
            })
        );
    });

    filteringGroup.addSetting((setting: any) => {
      setting
        .setName('Exclude property name')
        .setDesc(
          'Name of a boolean property to check in files. Files with this property set to true will be excluded from tracking. Takes priority over folder filtering.'
        )
        .addText((text: any) =>
          text

            .setPlaceholder('Skip-rename-tracking')
            .setValue(this.plugin.settings.excludePropertyName)
            .onChange((value: any) => {
              this.plugin.settings.excludePropertyName = value;
              saveSettings();
            })
        );
    });

    // Folder include/exclude settings
    foldersGroup.addSetting((setting: any) => {
      setting
        .setName('Include folders')
        .setDesc(
          'Comma-separated list of folder paths to include. If empty, all folders are included. Use {vault} or {root} to include only files directly in the vault root (no subfolders).'
        )
        .addText((text: any) =>
          text
            .setValue(this.plugin.settings.includeFolders.join(','))
            .onChange((value: any) => {
              this.plugin.settings.includeFolders = value
                .split(',')
                .map((s: any) => s.trim())
                .filter((s: any) => s);
              saveSettings();
            })
        );
    });

    foldersGroup.addSetting((setting: any) => {
      setting
        .setName('Exclude folders')
        .setDesc(
          'Comma-separated list of folder paths to exclude. Supports wildcards: use "folder/*" to exclude direct children, "folder/**" to exclude all descendants. Use {vault} or {root} to exclude files directly in the vault root.'
        )
        .addText((text: any) =>
          text
            .setValue(this.plugin.settings.excludeFolders.join(','))
            .onChange((value: any) => {
              this.plugin.settings.excludeFolders = value
                .split(',')
                .map((s: any) => s.trim())
                .filter((s: any) => s);
              saveSettings();
            })
        );
    });

    // Advanced / niche options
    advancedGroup.addSetting((setting: any) => {
      setting
        .setName('Track folder renames for specific file name')
        .setDesc(

          'If a Markdown file matches this file name, store old immediate parent folder names in the configured property when parent folders are renamed.'
        )
        .addText((text: any) =>
          text

            .setPlaceholder('Index')
            .setValue(this.plugin.settings.trackFolderRenames)
            .onChange((value: any) => {
              this.plugin.settings.trackFolderRenames = value;
              saveSettings();
            })
        );
    });

  }
}
