/**
 * Compatibility utilities for settings
 * Provides backward compatibility for SettingGroup (requires API 1.11.0+)
 */
import { Setting, requireApiVersion } from 'obsidian';
import * as Obsidian from 'obsidian';

interface SettingGroupInstance {
  setHeading(heading: string): void;
  addSetting(cb: (setting: Setting) => void): void;
}

/**
 * Interface that works with both SettingGroup and fallback container
 */
export interface SettingsContainer {
  addSetting(cb: (setting: Setting) => void): void;
}

/**
 * Creates a settings container that uses SettingGroup if available (API 1.11.0+),
 * otherwise falls back to creating a heading and using the container directly.
 *
 * Uses requireApiVersion('1.11.0') to check if SettingGroup is available.
 * This is the official Obsidian API method for version checking.
 *
 * @param containerEl - The container element for settings
 * @param heading - The heading text for the settings group
 * @param manifestId - The plugin's manifest ID for CSS scoping (required for fallback mode)
 * @returns A container that can be used to add settings
 */
export function createSettingsGroup(
  containerEl: HTMLElement,
  heading?: string,
  manifestId?: string
): SettingsContainer {
  // Check if SettingGroup is available (API 1.11.0+)
  // requireApiVersion is the official Obsidian API method for version checking
  if (requireApiVersion('1.11.0')) {
    // Use SettingGroup - it's guaranteed to exist at runtime if requireApiVersion returns true.
    // We access it via the namespace import to avoid requiring the type in older API d.ts files.
    type ObsidianWithSettingGroup = typeof Obsidian & {
      SettingGroup: new (containerEl: HTMLElement) => SettingGroupInstance;
    };
    const ObsidianTyped = Obsidian as unknown as ObsidianWithSettingGroup;
    const SettingGroupCtor = ObsidianTyped.SettingGroup;
    const group = new SettingGroupCtor(containerEl);
    if (heading) {
      group.setHeading(heading);
    }
    return {
      addSetting(cb: (setting: Setting) => void) {
        group.addSetting(cb);
      },
    };
  } else {
    // Fallback path (either API < 1.11.0 or SettingGroup not found)
    // Add scoping class to containerEl to scope CSS to only this plugin's settings
    if (manifestId) {
      containerEl.addClass(`${manifestId}-settings-compat`);
    }
    
    // Fallback: create a dedicated container to keep heading + settings together
    const groupEl = containerEl.createDiv('setting-group');
    if (heading) {
      const headingEl = groupEl.createDiv('setting-group-heading');
      headingEl.createEl('h3', { text: heading });
    }

    return {
      addSetting(cb: (setting: Setting) => void) {
        const setting = new Setting(groupEl);
        cb(setting);
      },
    };
  }
}


