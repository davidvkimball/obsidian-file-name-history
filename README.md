# Alias File Name History Plugin for Obsidian

This plugin tracks file name and parent folder name changes for Markdown files in Obsidian, storing old names as aliases in the file's properties. It supports customizable ignore patterns, debouncing, and folder-specific tracking, making it ideal for generating redirect rules (e.g., for Astro templates).

Particularly helpful when used in conjunction with [Astro Composer](https://github.com/davidvkimball/obsidian-astro-composer) Obsidian plugin and the [Astro Modular](https://github.com/davidvkimball/astro-modular) blog theme.

![alias-file-name-history-preview](https://github.com/user-attachments/assets/173da923-9761-4a7d-b08f-1f39d4722299)

## Made for Vault CMS

Part of the [Vault CMS](https://github.com/davidvkimball/vault-cms) project.

## Features
- **Tracks File Name Changes**: Stores old file names as aliases in the `aliases` property after a rename, with a configurable timeout (default 5 seconds).
- **Tracks Parent Folder Renames**: Optionally stores the old immediate parent folder name as an alias when enabled (off by default).
- **Ignore Patterns**: Skips adding aliases for file names or folder names matching regex patterns (e.g., `^_` for underscore prefixes, `^Untitled$` for "Untitled").
- **Case Sensitivity**: Toggle to treat case differences (e.g., "Note" vs. "note") as unique aliases (off by default).
- **Folder Filtering**: Restrict tracking to specific folders or exclude others.
- **File Extension Support**: Tracks `.md` files by default, with support for custom extensions (e.g., `.mdx`).
- **Auto-Create Properties**: Optionally creates the `aliases` property if missing (on by default).

## Installation

Alias File Name History is not yet available in the Community plugins section. Install using [BRAT](https://github.com/TfTHacker/obsidian42-brat) or manually:

### BRAT

1. Download the [Beta Reviewers Auto-update Tester (BRAT)](https://github.com/TfTHacker/obsidian42-brat) plugin from the [Obsidian community plugins directory](https://obsidian.md/plugins?id=obsidian42-brat) and enable it.
2. In the BRAT plugin settings, select `Add beta plugin`.
3. Paste the following: `https://github.com/davidvkimball/obsidian-alias-file-name-history` and select `Add plugin`.

### Manual

1. Download the latest release from the [Releases page](https://github.com/davidvkimball/obsidian-alias-file-name-history/releases) and navigate to your Obsidian vault's `.obsidian/plugins/` directory.
2. Create a new folder called `alias-file-name-history` and ensure `manifest.json` and `main.js` are in there.
3. In Obsidian, go to Settings > Community plugins (enable it if you haven't already) and then enable "Alias File Name History."

## Usage
1. **Configure Settings**:
   - Open Obsidian Settings > Community Plugins > Alias File Name History.
   - Adjust options:
     - **Ignore regex patterns**: Comma-separated regexes (e.g., `^_,^Untitled$`) to skip certain file names or folder names.
     - **Timeout seconds**: Time (1–20 seconds) to wait before adding aliases.
     - **Case sensitive uniqueness**: Enable to treat "Note" and "note" as different aliases.
     - **Auto-create properties**: Enable to create the `aliases` property if missing.
     - **Track folder renames**: Enable to store old parent folder names as aliases.
     - **File extensions**: Comma-separated list of extensions to track (e.g., `md,mdx`).
     - **Include folders**: Comma-separated paths to track (empty for all).
     - **Exclude folders**: Comma-separated paths to exclude.
2. **Rename Files or Folders**:
   - Rename a file (e.g., `note.md` to `new-note.md`): After the timeout, `note` is added to the `aliases` property.
   - With `Track folder renames` enabled, rename a parent folder (e.g., `posts/note.md` to `posts-1/note.md`): `posts` is added as an alias.
   - Names matching ignore regexes (e.g., `_note.md` or `_posts`) are skipped.
3. **Check Aliases**:
   - View the `aliases` property in the Properties view.
   - Manually remove aliases without affecting plugin behavior.
4. **Debugging**:
   - Open Obsidian’s developer console (Ctrl+Shift+I or Cmd+Shift+I) to see logs for added or skipped aliases.

## Example
- File: `posts/hello-there/file.md`
- Rename file to `posts/hello-there/new-file.md`:
  - `file` is added as an alias after 5 seconds (if not ignored).
- With `Track folder renames` on, rename folder to `posts/hello-there-1/file.md`:
  - `hello-there` is added as an alias.
- Rename folder to `posts/_hello-there/file.md`:
  - No alias added if `^_` is in ignore regexes.

## Notes
- Aliases are only added after the first rename (not on file creation).
- Use for Astro redirect rules by exporting aliases from properties.
- Report issues or suggest features on the GitHub repository.

## License
MIT License
