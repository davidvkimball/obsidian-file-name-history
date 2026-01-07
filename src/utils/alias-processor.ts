import { App, stringifyYaml, parseYaml } from 'obsidian';
import { AliasFilenameHistorySettings } from '../settings';

export class AliasProcessor {
  constructor(
    private app: App,
    private settings: AliasFilenameHistorySettings
  ) {}

  private async processAliasesManually(path: string, queue: Set<string>): Promise<void> {
    const file = this.app.vault.getFileByPath(path);
    if (!file) {
      return;
    }

    const regexes: RegExp[] = [];
    for (const regexStr of this.settings.ignoreRegexes) {
      try {
        regexes.push(new RegExp(regexStr));
      } catch (e) {
        console.error(`Invalid ignore regex: ${regexStr}`, e);
      }
    }

    const toAdd: string[] = [];
    const currentBasename = file.basename;
    const currentBasenameLower = currentBasename.toLowerCase();

    for (const name of queue) {
      if (regexes.some(re => re.test(name))) {
        continue;
      }
      const nameLower = name.toLowerCase();
      if (
        (this.settings.caseSensitive && name === currentBasename) ||
        (!this.settings.caseSensitive && nameLower === currentBasenameLower)
      ) {
        continue;
      }
      toAdd.push(name);
    }

    if (toAdd.length === 0) {
      return;
    }

    // Read file content
    let content = await this.app.vault.read(file);

    // Parse frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    let frontmatter: Record<string, unknown> = {};
    let frontmatterText = '';
    let bodyContent = content;

    if (match) {
      frontmatterText = match[1];
      bodyContent = content.slice(match[0].length);
      try {
        const parsed = parseYaml(frontmatterText) as Record<string, unknown> | null | undefined;
        frontmatter = parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) {
        console.error(`Error parsing properties:`, e);
        frontmatter = {};
      }
    } else {
      bodyContent = content;
    }

    // Get or create aliases array
    let aliases = frontmatter.aliases;
    if (!Array.isArray(aliases)) {
      const hasFrontmatter = Object.keys(frontmatter).length > 0;
      if (hasFrontmatter && !this.settings.autoCreateFrontmatter) {
        return;
      }
      aliases = [];
    }

    const aliasesArray = aliases as string[];
    const existing = new Set<string>(
      this.settings.caseSensitive ? aliasesArray : aliasesArray.map((a: string) => a.toLowerCase())
    );

    let added = false;
    for (const name of toAdd) {
      const checkName = this.settings.caseSensitive ? name : name.toLowerCase();
      if (!existing.has(checkName)) {
        aliasesArray.push(name);
        existing.add(checkName);
        added = true;
      }
    }

    if (!added) {
      return;
    }

    // Update frontmatter
    frontmatter.aliases = aliasesArray;

    // Stringify frontmatter
    const newFrontmatterText = stringifyYaml(frontmatter).trim();

    // Reconstruct file content
    const newContent = `---\n${newFrontmatterText}\n---\n${bodyContent}`;

    // Write back to file
    await this.app.vault.modify(file, newContent);
  }

  async processAliases(path: string, queue: Set<string>): Promise<void> {
    const file = this.app.vault.getFileByPath(path);
    if (!file) return;

    const regexes: RegExp[] = [];
    for (const regexStr of this.settings.ignoreRegexes) {
      try {
        regexes.push(new RegExp(regexStr));
      } catch (e) {
        console.error(`Invalid ignore regex: ${regexStr}`, e);
      }
    }

    const toAdd: string[] = [];
    const currentBasename = file.basename;
    const currentBasenameLower = currentBasename.toLowerCase();

    for (const name of queue) {
      if (regexes.some(re => re.test(name))) {
        continue;
      }
      const nameLower = name.toLowerCase();
      if (
        (this.settings.caseSensitive && name === currentBasename) ||
        (!this.settings.caseSensitive && nameLower === currentBasenameLower)
      ) {
        continue;
      }
      toAdd.push(name);
    }

    if (toAdd.length === 0) {
      return;
    }

    // Use manual processing for non-md files, or as fallback
    if (file.extension !== 'md') {
      await this.processAliasesManually(path, queue);
      return;
    }

    await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
      let aliases = fm.aliases;
      if (!Array.isArray(aliases)) {
        // If there's no frontmatter at all, we need to create it to add aliases
        // If there's frontmatter but no aliases property, respect the autoCreateFrontmatter setting
        const hasFrontmatter = Object.keys(fm).length > 0;
        if (hasFrontmatter && !this.settings.autoCreateFrontmatter) {
          return;
        }
        aliases = [];
        fm.aliases = aliases;
      }

      const aliasesArray = aliases as string[];
      const existing = new Set<string>(
        this.settings.caseSensitive ? aliasesArray : aliasesArray.map((a: string) => a.toLowerCase())
      );

      for (const name of toAdd) {
        const checkName = this.settings.caseSensitive ? name : name.toLowerCase();
        if (!existing.has(checkName)) {
          aliasesArray.push(name);
          existing.add(checkName);
        }
      }
    });
  }
}
