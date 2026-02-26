export interface FileNameHistorySettings {
  historyPropertyName: string;
  ignoreRegexes: string[];
  timeoutSeconds: number;
  caseSensitive: boolean;
  autoCreateFrontmatter: boolean;
  includeFolders: string[];
  excludeFolders: string[];
  fileExtensions: string[];
  trackFolderRenames: string;
  excludePropertyName: string;
}

export const DEFAULT_SETTINGS: FileNameHistorySettings = {
  historyPropertyName: 'aliases',
  ignoreRegexes: ['^_', '^Untitled$', '^Untitled \\d+$'],
  timeoutSeconds: 5,
  caseSensitive: false,
  autoCreateFrontmatter: true,
  includeFolders: [],
  excludeFolders: [],
  fileExtensions: ['md'],
  trackFolderRenames: '',
  excludePropertyName: '',
};