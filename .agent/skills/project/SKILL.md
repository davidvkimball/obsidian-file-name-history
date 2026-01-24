---
name: project
description: Project-specific architecture, maintenance tasks, and unique conventions for Alias File Name History.
---

# Alias File Name History Project Skill

Store file name history into the aliases property of your notes. This plugin automates the maintenance of aliases by tracking file renames and appending the old names to the `aliases` frontmatter property.

## Core Architecture

- **Event Handling**: Listens to the Obsidian `rename` event to capture filename changes.
- **Frontmatter Management**: Interacts with `app.fileManager.processFrontMatter` to safely update note metadata.
- **Workflow**: 
  1. Detect rename.
  2. Read existing aliases.
  3. Append previous name if not already present.
  4. Save metadata.

## Project-Specific Conventions

- **Frontmatter Key**: Always use `aliases`.
- **History Tracking**: Only append to aliases, never remove existing ones.
- **Mobile Support**: Fully compatible (no ribbon/complicated UI dependencies).

## Key Files

- `src/main.ts`: Main entry point containing the rename event listener and metadata update logic.
- `manifest.json`: Configuration settings and id (`alias-file-name-history`).
- `styles.css`: Minimal styling requirements.

## Maintenance Tasks

- **Metadata Safety**: Verify frontmatter processing logic against latest Obsidian API updates.
- **Testing**: Ensure renames across different folders are tracked correctly.
