export type ResearchEntry = {
  id: string;
  title: string;
  category: string;
  evidence: "Hecho histórico" | "Cálculo astronómico" | "Interpretación moderna" | "Requisito de producto";
  summary: string;
  rule: string;
  appUse: string;
  notes: string;
  sourceUrl: string;
};

export const RESEARCH: ResearchEntry[] = [
  {
    id: "ifc",
    title: "International Fixed Calendar",
    category: "Sistema de calendario",
    evidence: "Hecho histórico",
    summary:
      "Propuesta moderna de calendario solar fijo asociada a Moses B. Cotsworth (1902): 13 meses de 28 días, más Year Day y Leap Day.",
    rule: "13 periodos × 28 días = 364 días, más Year Day y, en años bisiestos, Leap Day.",
    appUse: "Inspiración estructural principal del año SÚE.",
    notes: "Usar como inspiración, no como prueba de un calendario universal antiguo.",
    sourceUrl: "https://en.wikipedia.org/wiki/International_Fixed_Calendar",
  },
  {
    id: "synodic",
    title: "Mes sinódico lunar",
    category: "Ciclo",
    evidence: "Cálculo astronómico",
    summary: "El ciclo real de fases lunares dura unos 29,53 días, no 28.",
    rule: "Mes sinódico medio ≈ 29,53 días.",
    appUse: "Las fases lunares son una capa sobre los periodos SÚE, no equivalen a esos periodos.",
    notes: "Evita afirmar que 13 × 28 es un calendario lunar.",
    sourceUrl: "https://aa.usno.navy.mil/faq/calendars",
  },
  {
    id: "lunisolar",
    title: "Meses intercalares lunisolares",
    category: "Regla de fecha",
    evidence: "Hecho histórico",
    summary:
      "Muchos calendarios tradicionales añaden a veces un mes lunar 13 para alinearse con las estaciones.",
    rule: "La mayoría de los años tienen 12 meses lunares; algunos incluyen 13.",
    appUse: "Explica la diferencia entre un año de 13 meses históricos y 13 periodos fijos cada año.",
    notes: "No describirlo como un sistema permanente de 13 × 28.",
    sourceUrl: "https://www.britannica.com/science/Metonic-cycle",
  },
  {
    id: "metonic",
    title: "Ciclo metónico",
    category: "Cálculo",
    evidence: "Cálculo astronómico",
    summary: "Aproxima 19 años solares a 235 meses lunares.",
    rule: "19 años solares ≈ 235 meses lunares; 7 años con mes extra en 19.",
    appUse: "Referencia educativa para reconciliar Luna y Sol.",
    notes: "Útil para calendarios hebreos y lunisolares afines.",
    sourceUrl: "https://www.britannica.com/science/Metonic-cycle",
  },
  {
    id: "seasons",
    title: "Estaciones solares",
    category: "Ciclo",
    evidence: "Cálculo astronómico",
    summary: "Solsticios y equinoccios marcan el año solar por la inclinación axial de la Tierra.",
    rule: "Los marcadores estacionales derivan de la órbita y el eje terrestre.",
    appUse: "Capa de conciencia planetaria sin afirmaciones pseudo-científicas.",
    notes: "Más adelante puede ser local (orto/ocaso, duración del día).",
    sourceUrl: "https://science.nasa.gov/solar-system/skywatching/the-seasons-solstices-and-equinoxes/",
  },
  {
    id: "personal",
    title: "Ciclos personales",
    category: "Ciclo",
    evidence: "Interpretación moderna",
    summary:
      "Cada persona puede definir ritmos de energía, ánimo, entrenamiento, descanso, menstruación o foco de trabajo.",
    rule: "Longitud, fases, inicio y notas los define la persona. Son privados.",
    appUse: "Planificación reflexiva sin asumir un ciclo biológico universal de 28 días.",
    notes: "Sin afirmaciones médicas.",
    sourceUrl: "https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo/irregularities",
  },
  {
    id: "sprint",
    title: "Modelo de planificación de 13 periodos",
    category: "Producto",
    evidence: "Interpretación moderna",
    summary: "Cada periodo de 28 días puede usarse como un sprint de cuatro semanas.",
    rule: "Un foco, cuatro revisiones semanales, un cierre por periodo.",
    appUse: "Puente entre reforma de calendario y planificación usable.",
    notes: "Es una decisión de diseño, no un hecho antiguo ni astronómico.",
    sourceUrl: "https://en.wikipedia.org/wiki/4%E2%80%934%E2%80%935_calendar",
  },
  {
    id: "yearday",
    title: "Year Day",
    category: "Regla de fecha",
    evidence: "Interpretación moderna",
    summary:
      "Un día fuera del ciclo semanal/mensual para reconciliar 364 días con la duración del año solar.",
    rule: "Año común: 364 días regulares + 1 Year Day.",
    appUse: "Momento anual de revisión y reinicio en SÚE.",
    notes: "Interrumpe la secuencia continua de días de la semana en el modelo IFC.",
    sourceUrl: "https://en.wikipedia.org/wiki/International_Fixed_Calendar",
  },
  {
    id: "google",
    title: "Sincronización con Google Calendar",
    category: "Producto",
    evidence: "Requisito de producto",
    summary: "Ver eventos de calendarios Google seleccionados dentro del marco de 13 periodos.",
    rule: "OAuth, calendarios elegidos, eventos de día completo y con hora, husos, recurrencia.",
    appUse: "Ruta principal de importación del MVP.",
    notes: "El calendario externo sigue siendo la fuente de verdad salvo escritura explícita.",
    sourceUrl: "https://developers.google.com/calendar/api",
  },
  {
    id: "apple",
    title: "Opciones para Apple Calendar",
    category: "Producto",
    evidence: "Requisito de producto",
    summary:
      "No hay una API web de Apple Calendar equivalente a Google. EventKit en nativo; CalDAV o ICS como alternativa.",
    rule: "EventKit nativo; CalDAV/iCloud si hay autorización; ICS de solo lectura como fallback.",
    appUse: "En web, el MVP usa importación .ics (exportación de Calendario de Apple).",
    notes: "Documentar límites por plataforma.",
    sourceUrl: "https://developer.apple.com/documentation/eventkit",
  },
];

export const CLAIMS_TO_AVOID = [
  "La humanidad usó originalmente un único calendario universal de 13 meses.",
  "13 × 28 es el verdadero calendario lunar.",
  "Todas las personas siguen de forma natural un ciclo biológico de 28 días.",
  "El tiempo gregoriano es falso.",
  "La reforma del calendario prueba un saber antiguo oculto.",
  "Las fases lunares determinan científicamente resultados personales.",
];

export const CLAIMS_OK = [
  "Un marco de 13 × 28 crea un ritmo de planificación visualmente constante.",
  "Periodos de cuatro semanas facilitan comparar metas y revisiones.",
  "Fases lunares y estaciones pueden ser prompts de reflexión, no pruebas.",
  "Algunos calendarios históricos incluyen años ocasionales de 13 meses.",
  "Las propuestas modernas de calendario fijo intentaron resolver problemas reales de administración.",
  "Observar los propios patrones a lo largo del tiempo puede ser útil.",
];
