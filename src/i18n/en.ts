// English dictionary. This is the reference set of keys — every other
// language file must implement exactly these keys (enforced via the
// `Dict` type in ./index.ts). Use {name} tokens for interpolation.
const en = {
  // App shell
  appSubtitle: 'Personal time tracker · data stays on this computer',
  loading: 'Loading data…',
  offlineTitle: 'No connection to the data service',
  retry: 'Retry',
  saveError: 'Could not save changes — check that the data service is running.',
  tabTrack: 'Timer',
  tabReport: 'Reports',
  themeLight: 'Light theme',
  themeDark: 'Dark theme',

  // Store errors
  errBackendDown: 'Data service is not running. Start it with: npm run dev (or npm run dev:server).',
  errLoadFailed: 'Failed to load data.',

  // Timer
  descPlaceholder: 'What are you working on?',
  tagsPlaceholder: 'Tags, comma-separated (optional)',
  start: '▶ Start',
  stop: '■ Stop',
  pause: '⏸ Pause',
  resume: '▶ Resume',
  paused: 'Paused',
  editStart: 'Adjust start time',
  startTime: 'Start time',
  newStartFuture: 'Start time cannot be in the future',

  // Projects
  projects: 'Projects',
  newProjectPlaceholder: 'New project',
  add: '+ Add',
  editHint: 'Click again to edit',
  project: 'Project',
  name: 'Name',
  color: 'Color',
  pickColor: 'Pick a color',
  preview: 'Preview:',
  delete: 'Delete',
  confirmDelete: 'Really delete?',
  confirmDeleteHint: 'Click again to confirm',
  cancel: 'Cancel',
  save: 'Save',
  deleteTitle: 'Delete project',
  deleteConfirm: 'Delete “{name}”? This can’t be undone.',
  deleteEntriesInfo: '“{name}” has {count} entries. Where should they go?',
  reassignNew: '＋ New project…',
  reassignOrphan: 'Leave without a project',
  reassignOrphanHint: 'Entries are kept but shown without a project (“—”).',
  newProjectName: 'New project name',

  // Entry list
  entries: 'Entries',
  allProjects: 'All projects',
  nProjects: '{count} projects',
  allTags: 'All tags',
  emptyStart: 'Nothing yet — start the timer.',
  emptyFiltered: 'No entries match the selected filters.',
  noDescription: 'No description',
  edit: 'Edit',
  showingLast50: 'Showing the last 50 entries. The full list is available via CSV export.',

  // Entry edit modal
  editEntry: 'Edit entry',
  description: 'Description',
  tagsComma: 'Tags (comma-separated)',
  start_: 'Start',
  end_: 'End',
  duration_: 'Duration',

  // Reports — ranges
  rangeToday: 'Today',
  rangeWeek: 'Week',
  rangeMonth: 'Month',
  rangeCustom: 'Custom range',
  // Reports — chart modes
  chartProjects: '▦ Projects',
  chartDays: '↗ By day',
  chartCalendar: '⊞ Calendar',
  import: '↑ Import',
  csv: '↓ CSV',
  importSuccess: 'Imported: {entries} entries, {projects} projects',

  // Stats cards
  totalTime: 'Total time',
  entriesCount: 'Entries',
  projectsCount: 'Projects',

  // Breakdown
  noData: 'No data for the selected period',

  // Calendar
  today: 'Today',
  monthTotal: 'Month total:',

  // Settings
  settings: 'Settings',
  showDescriptions: 'Show entry descriptions',
  showDescriptionsHint: 'In the entry list and calendar',
  language: 'Language',
  done: 'Done',

  // CSV / import-export
  csvNoEntries: 'No entries for the selected period',
  csvColDescription: 'Description',
  csvColProject: 'Project',
  csvColTags: 'Tags',
  csvColStart: 'Start',
  csvColEnd: 'End',
  csvColDate: 'Date',
  csvColHours: 'Hours',
  importFileTooBig: 'File is too big (max {mb} MB)',
  importUnsupported: 'Only .json and .csv files are supported',
  importInvalidJson: 'Invalid JSON',
  importBadStructure: 'JSON does not match the Tick format: {detail}',
  importTooManyEntries: 'Too many entries (max {max})',
  importTooManyRows: 'Too many rows (max {max})',
  importCsvEmpty: 'CSV file is empty or has no data',

  // Time units
  unitHour: 'h',
  unitMinute: 'm',
}

export default en
