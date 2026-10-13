// Catálogo del juego: atributos, categorías y subcategorías con su puntaje base.
//
// Cada subcategoría define cómo se mide y cuánta XP da a cada atributo:
//   mode 'time'  → XP por hora (se registra en minutos)
//   mode 'count' → XP por unidad (ej. por postulación o por comida)
//   mode 'check' → XP fija, una vez al día
// optimal: cantidad diaria (minutos o unidades) sobre la cual cada extra vale la mitad.

export const DEFAULT_ATTRIBUTES = [
  { id: 'vit', name: 'Vitalidad', emoji: '❤️', color: '#f05252', cls: 'Guerrero' },
  { id: 'int', name: 'Intelecto', emoji: '🧠', color: '#4f8cff', cls: 'Mago' },
  { id: 'dis', name: 'Disciplina', emoji: '⚡', color: '#f5b622', cls: 'Monje' },
  { id: 'per', name: 'Perseverancia', emoji: '🛡️', color: '#a274ff', cls: 'Paladín' },
  { id: 'riq', name: 'Riqueza', emoji: '💰', color: '#2fbf71', cls: 'Mercader' },
  { id: 'esp', name: 'Espíritu', emoji: '✨', color: '#ff6fb5', cls: 'Bardo' },
];

export const CATEGORIES = [
  {
    id: 'estudio', name: 'Estudio', emoji: '📚', color: '#4f8cff',
    subs: [
      { id: 'curso', name: 'Curso / formación', emoji: '🎓', mode: 'time', rate: { int: 20, dis: 6 }, optimal: 180 },
      { id: 'lectura', name: 'Lectura', emoji: '📖', mode: 'time', rate: { int: 12, esp: 4 }, optimal: 120 },
      { id: 'practica', name: 'Proyecto / práctica', emoji: '🛠️', mode: 'time', rate: { int: 16, per: 6, dis: 4 }, optimal: 180 },
      { id: 'idiomas', name: 'Idiomas', emoji: '🗣️', mode: 'time', rate: { int: 16, per: 4 }, optimal: 90 },
    ],
  },
  {
    id: 'carrera', name: 'Carrera', emoji: '💼', color: '#a274ff',
    subs: [
      { id: 'postulacion', name: 'Postulación', emoji: '📨', mode: 'count', unit: 'postulación', units: 'postulaciones', rate: { per: 12, dis: 3 }, optimal: 10 },
      { id: 'networking', name: 'Networking / contacto', emoji: '🤝', mode: 'count', unit: 'contacto', units: 'contactos', rate: { per: 8, esp: 3 }, optimal: 5 },
      { id: 'entrevista', name: 'Preparar CV / entrevista', emoji: '📝', mode: 'time', rate: { per: 14, int: 6 }, optimal: 120 },
      { id: 'jornada', name: 'Jornada laboral', emoji: '🏢', mode: 'check', rate: { dis: 10, riq: 10 } },
    ],
  },
  {
    id: 'deporte', name: 'Deporte', emoji: '🏃', color: '#f05252',
    subs: [
      { id: 'cardio', name: 'Cardio', emoji: '🚴', mode: 'time', rate: { vit: 25, dis: 8 }, optimal: 90 },
      { id: 'fuerza', name: 'Fuerza / gimnasio', emoji: '🏋️', mode: 'time', rate: { vit: 22, dis: 10 }, optimal: 90 },
      { id: 'caminata', name: 'Caminata / movilidad', emoji: '🚶', mode: 'time', rate: { vit: 12, esp: 4 }, optimal: 120 },
      { id: 'recreativo', name: 'Deporte recreativo', emoji: '⚽', mode: 'time', rate: { vit: 18, esp: 10 }, optimal: 120 },
    ],
  },
  {
    id: 'hogar', name: 'Hogar', emoji: '🏠', color: '#2fbf71',
    subs: [
      { id: 'cocinar', name: 'Cocinar', emoji: '🍳', mode: 'count', unit: 'comida', units: 'comidas', rate: { riq: 10, vit: 5 }, optimal: 3 },
      { id: 'aseo', name: 'Aseo / limpieza', emoji: '🧹', mode: 'time', rate: { dis: 12, esp: 4 }, optimal: 120 },
      { id: 'orden', name: 'Orden / organización', emoji: '🗂️', mode: 'time', rate: { dis: 10, esp: 5 }, optimal: 90 },
      { id: 'tramites', name: 'Compras / trámites', emoji: '🛒', mode: 'time', rate: { dis: 8, riq: 5 }, optimal: 120 },
    ],
  },
  {
    id: 'rutina', name: 'Descanso y rutina', emoji: '🌙', color: '#f5b622',
    subs: [
      { id: 'madrugar', name: 'Levantarse temprano', emoji: '⏰', mode: 'check', rate: { dis: 10, vit: 2 } },
      { id: 'dormir', name: 'Dormir temprano', emoji: '😴', mode: 'check', rate: { vit: 10, dis: 3 } },
      { id: 'meditacion', name: 'Meditación / pausa', emoji: '🧘', mode: 'time', rate: { esp: 20, dis: 5 }, optimal: 30 },
    ],
  },
  {
    id: 'ocio', name: 'Ocio', emoji: '🎮', color: '#ff6fb5',
    subs: [
      { id: 'videojuegos', name: 'Videojuegos', emoji: '🎮', mode: 'time', rate: { esp: 10, int: 2 }, optimal: 120 },
      { id: 'pantalla', name: 'Series / películas', emoji: '🎬', mode: 'time', rate: { esp: 8 }, optimal: 120 },
      { id: 'hobby', name: 'Hobby creativo', emoji: '🎨', mode: 'time', rate: { esp: 12, int: 4 }, optimal: 180 },
      { id: 'social', name: 'Vida social / familia', emoji: '🫂', mode: 'time', rate: { esp: 12, vit: 2 }, optimal: 240 },
    ],
  },
  {
    id: 'tentacion', name: 'Tentaciones', emoji: '😈', color: '#ff5c6c',
    subs: [
      { id: 'trasnochar', name: 'Dormir tarde', emoji: '🥱', mode: 'check', rate: { vit: -8, dis: -4 } },
      { id: 'delivery', name: 'Delivery / gasto impulsivo', emoji: '🛵', mode: 'count', unit: 'vez', units: 'veces', rate: { riq: -8 } },
      { id: 'scroll', name: 'Scroll excesivo', emoji: '📱', mode: 'time', rate: { dis: -6, esp: -2 } },
    ],
  },
];

// Índice "categoria.sub" → subcategoría (con referencia a su categoría).
export const SUBS = new Map(
  CATEGORIES.flatMap((cat) => cat.subs.map((sub) => {
    const id = `${cat.id}.${sub.id}`;
    return [id, { ...sub, id, cat }];
  })),
);

const OTHER_CAT = { id: 'otros', name: 'Otros', emoji: '📦', color: '#a59dc2', subs: [] };
const OTHER_SUB = { id: 'otros', name: 'Otros', emoji: '📦', mode: 'count', unit: 'vez', units: 'veces', rate: {}, cat: OTHER_CAT };

export const subInfo = (id) => SUBS.get(id) ?? OTHER_SUB;

// Actividades frecuentes iniciales: genéricas, para que el usuario cree las suyas.
export const DEFAULT_FAVORITES = [
  { id: 'f-madrugar', sub: 'rutina.madrugar', name: 'Levantarse temprano', emoji: '⏰' },
  { id: 'f-dormir', sub: 'rutina.dormir', name: 'Dormir temprano', emoji: '😴' },
  { id: 'f-jornada', sub: 'carrera.jornada', name: 'Jornada laboral', emoji: '🏢' },
  { id: 'f-postular', sub: 'carrera.postulacion', name: 'Postulación', emoji: '📨' },
  { id: 'f-cocinar', sub: 'hogar.cocinar', name: 'Cocinar', emoji: '🍳' },
  { id: 'f-aseo', sub: 'hogar.aseo', name: 'Aseo', emoji: '🧹' },
  { id: 'f-ejercicio', sub: 'deporte.fuerza', name: 'Ejercicio', emoji: '🏋️' },
  { id: 'f-lectura', sub: 'estudio.lectura', name: 'Lectura', emoji: '📖' },
  { id: 'f-videojuegos', sub: 'ocio.videojuegos', name: 'Videojuegos', emoji: '🎮' },
  { id: 'f-trasnochar', sub: 'tentacion.trasnochar', name: 'Dormir tarde', emoji: '🥱' },
  { id: 'f-delivery', sub: 'tentacion.delivery', name: 'Delivery', emoji: '🛵' },
  { id: 'f-scroll', sub: 'tentacion.scroll', name: 'Scroll excesivo', emoji: '📱' },
];

export const TIME_PRESETS = [15, 30, 45, 60, 90, 120, 180];

// Títulos según el nivel del personaje (nivel mínimo → título).
export const TITLES = [
  [1, 'Novato'],
  [3, 'Aprendiz'],
  [5, 'Aventurero'],
  [8, 'Veterano'],
  [12, 'Campeón'],
  [16, 'Héroe'],
  [20, 'Leyenda'],
];
