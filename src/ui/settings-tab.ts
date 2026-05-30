import { App, Plugin, PluginSettingTab , Setting, SettingGroup} from 'obsidian';
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

  // 1.13.0+: framework calls this and skips display().
  // Pre-1.13.0: this method is not invoked; display() below runs as before.
  // See https://docs.obsidian.md/plugins/guides/migrate-declarative-settings
  getSettingDefinitions() {
    return [
      {
        // General behavior settings (grouped, no heading)
        type: 'group' as const,
        items: [
          {
            name: 'History property name',
            desc: 'The list property to store file name history.',
            // Render: empty input falls back to the default property name.
            render: (setting: Setting) => {
              setting.addText(text => text
                .setPlaceholder('aliases')
                .setValue(this.plugin.settings.historyPropertyName)
                .onChange(async value => {
                  this.plugin.settings.historyPropertyName = value || 'aliases';
                  await this.plugin.saveSettings();
                }));
            },
          },
          {
            name: 'Timeout seconds',
            desc: 'Time in seconds the name must be stable before adding to the configured property.',
            control: { type: 'slider' as const, key: 'timeoutSeconds', min: 1, max: 20, step: 1 },
          },
          {
            name: 'Case-sensitive uniqueness',
            desc: 'If enabled, treat case differences as unique values in the configured property.',
            control: { type: 'toggle' as const, key: 'caseSensitive' },
          },
          {
            name: 'Auto-create history property',
            desc: 'Automatically create the configured property if missing.',
            control: { type: 'toggle' as const, key: 'autoCreateFrontmatter' },
          },
          {
            name: 'File extensions',
            desc: 'Comma-separated list of file extensions to track.',
            // Render: value is split into an array of trimmed, non-empty extensions.
            render: (setting: Setting) => {
              setting.addText(text => text
                .setPlaceholder('Md, txt')
                .setValue(this.plugin.settings.fileExtensions.join(','))
                .onChange(async value => {
                  this.plugin.settings.fileExtensions = value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s);
                  await this.plugin.saveSettings();
                }));
            },
          },
        ],
      },
      {
        type: 'group' as const,
        heading: 'Filtering',
        items: [
          {
            name: 'Ignore regex patterns',
            desc: 'Comma-separated regex patterns for file names or immediate parent folder names to ignore (e.g., ^_ for underscore prefixes, ^untitled$ for untitled). Leave empty to disable.',
            // Render: value is split into an array of trimmed, non-empty patterns.
            render: (setting: Setting) => {
              setting.addText(text => text
                .setPlaceholder('^_, ^untitled$, ^untitled \\d+$')
                .setValue(this.plugin.settings.ignoreRegexes.join(','))
                .onChange(async value => {
                  this.plugin.settings.ignoreRegexes = value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s);
                  await this.plugin.saveSettings();
                }));
            },
          },
          {
            name: 'Exclude property name',
            desc: 'Name of a boolean property to check in files. Files with this property set to true will be excluded from tracking. Takes priority over folder filtering.',
            control: { type: 'text' as const, key: 'excludePropertyName', placeholder: 'Skip-rename-tracking' },
          },
        ],
      },
      {
        type: 'group' as const,
        heading: 'Folders',
        items: [
          {
            name: 'Include folders',
            desc: 'Comma-separated list of folder paths to include. If empty, all folders are included. Use {vault} or {root} to include only files directly in the vault root (no subfolders).',
            // Render: value is split into an array of trimmed, non-empty paths.
            render: (setting: Setting) => {
              setting.addText(text => text
                .setValue(this.plugin.settings.includeFolders.join(','))
                .onChange(async value => {
                  this.plugin.settings.includeFolders = value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s);
                  await this.plugin.saveSettings();
                }));
            },
          },
          {
            name: 'Exclude folders',
            desc: 'Comma-separated list of folder paths to exclude. Supports wildcards: use "folder/*" to exclude direct children, "folder/**" to exclude all descendants. Use {vault} or {root} to exclude files directly in the vault root.',
            // Render: value is split into an array of trimmed, non-empty paths.
            render: (setting: Setting) => {
              setting.addText(text => text
                .setValue(this.plugin.settings.excludeFolders.join(','))
                .onChange(async value => {
                  this.plugin.settings.excludeFolders = value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s);
                  await this.plugin.saveSettings();
                }));
            },
          },
        ],
      },
      {
        type: 'group' as const,
        heading: 'Advanced',
        items: [
          {
            name: 'Track folder renames for specific file name',
            desc: 'If a Markdown file matches this file name, store old immediate parent folder names in the configured property when parent folders are renamed.',
            control: { type: 'text' as const, key: 'trackFolderRenames', placeholder: 'Index' },
          },
        ],
      },
    ];
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
    generalGroup.addSetting(setting => {
      setting
        .setName('History property name')
        .setDesc('The list property to store file name history.')
        .addText(text =>
          text
            .setPlaceholder('aliases')
            .setValue(this.plugin.settings.historyPropertyName)
            .onChange(value => {
              this.plugin.settings.historyPropertyName = value || 'aliases';
              saveSettings();
            })
        );
    });

    generalGroup.addSetting(setting => {
      setting
        .setName('Timeout seconds')
        .setDesc('Time in seconds the name must be stable before adding to the configured property.')
        .addSlider(slider =>
          slider
            .setLimits(1, 20, 1)
            .setValue(this.plugin.settings.timeoutSeconds)
            .setDynamicTooltip()
            .onChange(value => {
              this.plugin.settings.timeoutSeconds = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting(setting => {
      setting
        .setName('Case-sensitive uniqueness')

        .setDesc('If enabled, treat case differences as unique values in the configured property.')
        .addToggle(toggle =>
          toggle
            .setValue(this.plugin.settings.caseSensitive)
            .onChange(value => {
              this.plugin.settings.caseSensitive = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting(setting => {
      setting
        .setName('Auto-create history property')
        .setDesc('Automatically create the configured property if missing.')
        .addToggle(toggle =>
          toggle
            .setValue(this.plugin.settings.autoCreateFrontmatter)
            .onChange(value => {
              this.plugin.settings.autoCreateFrontmatter = value;
              saveSettings();
            })
        );
    });

    generalGroup.addSetting(setting => {
      setting
        .setName('File extensions')
        .setDesc('Comma-separated list of file extensions to track.')
        .addText(text =>
          text

            .setPlaceholder('Md, txt')
            .setValue(this.plugin.settings.fileExtensions.join(','))
            .onChange(value => {
              this.plugin.settings.fileExtensions = value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
              saveSettings();
            })
        );
    });

    const filteringGroup = new SettingGroup(containerEl).setHeading('Filtering');
    const foldersGroup = new SettingGroup(containerEl).setHeading('Folders');
    const advancedGroup = new SettingGroup(containerEl).setHeading('Advanced');

    // Filtering settings
    filteringGroup.addSetting(setting => {
      setting
        .setName('Ignore regex patterns')
        .setDesc(
          'Comma-separated regex patterns for file names or immediate parent folder names to ignore (e.g., ^_ for underscore prefixes, ^untitled$ for untitled). Leave empty to disable.'
        )
        .addText(text =>
          text
            .setPlaceholder('^_, ^untitled$, ^untitled \\d+$')
            .setValue(this.plugin.settings.ignoreRegexes.join(','))
            .onChange(value => {
              this.plugin.settings.ignoreRegexes = value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
              saveSettings();
            })
        );
    });

    filteringGroup.addSetting(setting => {
      setting
        .setName('Exclude property name')
        .setDesc(
          'Name of a boolean property to check in files. Files with this property set to true will be excluded from tracking. Takes priority over folder filtering.'
        )
        .addText(text =>
          text

            .setPlaceholder('Skip-rename-tracking')
            .setValue(this.plugin.settings.excludePropertyName)
            .onChange(value => {
              this.plugin.settings.excludePropertyName = value;
              saveSettings();
            })
        );
    });

    // Folder include/exclude settings
    foldersGroup.addSetting(setting => {
      setting
        .setName('Include folders')
        .setDesc(
          'Comma-separated list of folder paths to include. If empty, all folders are included. Use {vault} or {root} to include only files directly in the vault root (no subfolders).'
        )
        .addText(text =>
          text
            .setValue(this.plugin.settings.includeFolders.join(','))
            .onChange(value => {
              this.plugin.settings.includeFolders = value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
              saveSettings();
            })
        );
    });

    foldersGroup.addSetting(setting => {
      setting
        .setName('Exclude folders')
        .setDesc(
          'Comma-separated list of folder paths to exclude. Supports wildcards: use "folder/*" to exclude direct children, "folder/**" to exclude all descendants. Use {vault} or {root} to exclude files directly in the vault root.'
        )
        .addText(text =>
          text
            .setValue(this.plugin.settings.excludeFolders.join(','))
            .onChange(value => {
              this.plugin.settings.excludeFolders = value
                .split(',')
                .map(s => s.trim())
                .filter(s => s);
              saveSettings();
            })
        );
    });

    // Advanced / niche options
    advancedGroup.addSetting(setting => {
      setting
        .setName('Track folder renames for specific file name')
        .setDesc(

          'If a Markdown file matches this file name, store old immediate parent folder names in the configured property when parent folders are renamed.'
        )
        .addText(text =>
          text

            .setPlaceholder('Index')
            .setValue(this.plugin.settings.trackFolderRenames)
            .onChange(value => {
              this.plugin.settings.trackFolderRenames = value;
              saveSettings();
            })
        );
    });

  }
}
