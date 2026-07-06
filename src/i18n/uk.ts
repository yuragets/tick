import type { Dict } from './index'

// Ukrainian dictionary. Must implement every key from ./en.ts.
const uk: Dict = {
  // App shell
  appSubtitle: 'Особистий трекер часу · дані зберігаються на цьому комп’ютері',
  loading: 'Завантаження даних…',
  offlineTitle: 'Немає зв’язку зі службою даних',
  retry: 'Повторити',
  saveError: 'Не вдалося зберегти зміни — перевір, чи запущено службу даних.',
  tabTrack: 'Таймер',
  tabReport: 'Звіти',
  themeLight: 'Світла тема',
  themeDark: 'Темна тема',

  // Store errors
  errBackendDown: 'Службу даних не запущено. Запусти її: npm run dev (або npm run dev:server).',
  errLoadFailed: 'Не вдалося завантажити дані.',

  // Timer
  descPlaceholder: 'Над чим працюєш?',
  tagsPlaceholder: 'Теги через кому (необов’язково)',
  start: '▶ Старт',
  stop: '■ Стоп',

  // Projects
  projects: 'Проєкти',
  newProjectPlaceholder: 'Новий проєкт',
  add: '+ Додати',
  editHint: 'Натисни ще раз для редагування',
  project: 'Проєкт',
  name: 'Назва',
  color: 'Колір',
  pickColor: 'Обрати колір',
  preview: 'Перегляд:',
  delete: 'Видалити',
  confirmDelete: 'Точно видалити?',
  confirmDeleteHint: 'Натисни ще раз для підтвердження',
  cancel: 'Скасувати',
  save: 'Зберегти',

  // Entry list
  entries: 'Записи',
  allProjects: 'Усі проєкти',
  allTags: 'Усі теги',
  emptyStart: 'Поки порожньо — запусти таймер.',
  emptyFiltered: 'Немає записів за обраними фільтрами.',
  noDescription: 'Без опису',
  edit: 'Редагувати',
  showingLast50: 'Показано останні 50 записів. Повний список доступний через експорт CSV.',

  // Entry edit modal
  editEntry: 'Редагувати запис',
  description: 'Опис',
  tagsComma: 'Теги (через кому)',
  start_: 'Початок',
  end_: 'Кінець',

  // Reports — ranges
  rangeToday: 'Сьогодні',
  rangeWeek: 'Тиждень',
  rangeMonth: 'Місяць',
  rangeCustom: 'Свій період',
  // Reports — chart modes
  chartProjects: '▦ Проєкти',
  chartDays: '↗ За днями',
  chartCalendar: '⊞ Календар',
  import: '↑ Імпорт',
  csv: '↓ CSV',
  importSuccess: 'Імпортовано: {entries} записів, {projects} проєктів',

  // Stats cards
  totalTime: 'Усього часу',
  entriesCount: 'Записів',
  projectsCount: 'Проєктів',

  // Breakdown
  noData: 'Немає даних за обраний період',

  // Calendar
  today: 'Сьогодні',
  monthTotal: 'Усього за місяць:',

  // Settings
  settings: 'Налаштування',
  showDescriptions: 'Показувати опис записів',
  showDescriptionsHint: 'У списку записів і в календарі',
  language: 'Мова',
  done: 'Готово',

  // CSV / import-export
  csvNoEntries: 'Немає записів за обраний період',
  csvColDescription: 'Опис',
  csvColProject: 'Проєкт',
  csvColTags: 'Теги',
  csvColStart: 'Початок',
  csvColEnd: 'Кінець',
  csvColDate: 'Дата',
  csvColHours: 'Години',
  importFileTooBig: 'Файл завеликий (максимум {mb} МБ)',
  importUnsupported: 'Підтримуються лише файли .json та .csv',
  importInvalidJson: 'Невалідний JSON',
  importBadStructure: 'Структура JSON не відповідає формату Tick: {detail}',
  importTooManyEntries: 'Забагато записів (максимум {max})',
  importTooManyRows: 'Забагато рядків (максимум {max})',
  importCsvEmpty: 'CSV-файл порожній або не містить даних',

  // Time units
  unitHour: 'год',
  unitMinute: 'хв',
}

export default uk
