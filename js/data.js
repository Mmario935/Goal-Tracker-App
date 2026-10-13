// Catálogo del juego: atributos, categorías y subcategorías con su puntaje base.
//
// Cada subcategoría define cómo se mide y cuánta XP da a cada atributo:
//   mode 'time'  → XP por hora (se registra en minutos)
//   mode 'count' → XP por unidad (ej. por postulación o por comida)
//   mode 'check' → XP fija, una vez al día
// optimal: cantidad diaria (minutos o unidades) sobre la cual cada extra vale la mitad.
// icon: id de un ícono de js/icons.js.
//
// Los ids son permanentes porque los registros guardados los usan ("carrera.postulacion"),
// por eso pueden diferir del nombre visible ("carrera" se muestra como "Profesional" y "tentacion" como "Malos hábitos").

export const DEFAULT_ATTRIBUTES = [
  { id: 'vit', name: 'Vitalidad', icon: 'heart-beats', color: '#ff1f3d', arcana: 'El Carro' },
  { id: 'int', name: 'Intelecto', icon: 'brain', color: '#3ec5ff', arcana: 'El Mago' },
  { id: 'dis', name: 'Disciplina', icon: 'focused-lightning', color: '#ffd400', arcana: 'El Emperador' },
  { id: 'per', name: 'Perseverancia', icon: 'checked-shield', color: '#9b5cff', arcana: 'La Fuerza' },
  { id: 'riq', name: 'Riqueza', icon: 'two-coins', color: '#f2f2f2', arcana: 'La Fortuna' },
  { id: 'esp', name: 'Espíritu', icon: 'sparkles', color: '#ff4fa0', arcana: 'La Estrella' },
];

export const CATEGORIES = [
  {
    id: 'estudio', name: 'Estudio', icon: 'open-book', color: '#3ec5ff',
    subs: [
      { id: 'curso', name: 'Curso / formación', icon: 'graduate-cap', mode: 'time', rate: { int: 20, dis: 6 }, optimal: 180 },
      { id: 'lectura', name: 'Lectura', icon: 'bookshelf', mode: 'time', rate: { int: 12, esp: 4 }, optimal: 120 },
      { id: 'practica', name: 'Proyecto / práctica', icon: 'gears', mode: 'time', rate: { int: 16, per: 6, dis: 4 }, optimal: 180 },
      { id: 'idiomas', name: 'Idiomas', icon: 'talk', mode: 'time', rate: { int: 16, per: 4 }, optimal: 90 },
    ],
  },
  {
    id: 'carrera', name: 'Profesional', icon: 'briefcase', color: '#9b5cff',
    subs: [
      { id: 'jornada', name: 'Jornada laboral', icon: 'desk', mode: 'check', rate: { dis: 10, riq: 10 } },
      { id: 'postulacion', name: 'Búsqueda de empleo', icon: 'envelope', mode: 'count', unit: 'postulación', units: 'postulaciones', rate: { per: 12, dis: 3 }, optimal: 10 },
      { id: 'networking', name: 'Networking / contacto', icon: 'shaking-hands', mode: 'count', unit: 'contacto', units: 'contactos', rate: { per: 8, esp: 3 }, optimal: 5 },
      { id: 'entrevista', name: 'Desarrollo profesional', icon: 'quill-ink', mode: 'time', rate: { per: 14, int: 6 }, optimal: 120 },
    ],
  },
  {
    id: 'deporte', name: 'Deporte', icon: 'run', color: '#ff1f3d',
    subs: [
      { id: 'cardio', name: 'Cardio', icon: 'cycling', mode: 'time', rate: { vit: 25, dis: 8 }, optimal: 90 },
      { id: 'fuerza', name: 'Fuerza / gimnasio', icon: 'weight-lifting-up', mode: 'time', rate: { vit: 22, dis: 10 }, optimal: 90 },
      { id: 'caminata', name: 'Caminata / movilidad', icon: 'walking-boot', mode: 'time', rate: { vit: 12, esp: 4 }, optimal: 120 },
      { id: 'recreativo', name: 'Deporte recreativo', icon: 'soccer-ball', mode: 'time', rate: { vit: 18, esp: 10 }, optimal: 120 },
    ],
  },
  {
    id: 'hogar', name: 'Hogar', icon: 'house', color: '#f2f2f2',
    subs: [
      { id: 'cocinar', name: 'Cocinar', icon: 'cooking-pot', mode: 'count', unit: 'comida', units: 'comidas', rate: { riq: 10, vit: 5 }, optimal: 3 },
      { id: 'aseo', name: 'Aseo / limpieza', icon: 'broom', mode: 'time', rate: { dis: 12, esp: 4 }, optimal: 120 },
      { id: 'orden', name: 'Orden / organización', icon: 'cardboard-box', mode: 'time', rate: { dis: 10, esp: 5 }, optimal: 90 },
      { id: 'tramites', name: 'Compras / trámites', icon: 'shopping-cart', mode: 'time', rate: { dis: 8, riq: 5 }, optimal: 120 },
    ],
  },
  {
    id: 'rutina', name: 'Descanso y rutina', icon: 'moon', color: '#ffd400',
    subs: [
      { id: 'madrugar', name: 'Levantarse temprano', icon: 'sunrise', mode: 'check', rate: { dis: 10, vit: 2 } },
      { id: 'dormir', name: 'Dormir temprano', icon: 'night-sleep', mode: 'check', rate: { vit: 10, dis: 3 } },
      { id: 'meditacion', name: 'Meditación / pausa', icon: 'meditation', mode: 'time', rate: { esp: 20, dis: 5 }, optimal: 30 },
    ],
  },
  {
    id: 'ocio', name: 'Ocio', icon: 'drama-masks', color: '#ff4fa0',
    subs: [
      { id: 'videojuegos', name: 'Videojuegos', icon: 'gamepad', mode: 'time', rate: { esp: 10, int: 2 }, optimal: 120 },
      { id: 'pantalla', name: 'Series / películas', icon: 'tv', mode: 'time', rate: { esp: 8 }, optimal: 120 },
      { id: 'hobby', name: 'Hobby creativo', icon: 'palette', mode: 'time', rate: { esp: 12, int: 4 }, optimal: 180 },
      { id: 'social', name: 'Vida social / familia', icon: 'three-friends', mode: 'time', rate: { esp: 12, vit: 2 }, optimal: 240 },
    ],
  },
  {
    id: 'tentacion', name: 'Malos hábitos', icon: 'devil-mask', color: '#8a0012',
    subs: [
      { id: 'trasnochar', name: 'Dormir tarde', icon: 'owl', mode: 'check', rate: { vit: -8, dis: -4 } },
      { id: 'delivery', name: 'Delivery / gasto impulsivo', icon: 'pizza-slice', mode: 'count', unit: 'vez', units: 'veces', rate: { riq: -8 } },
      { id: 'scroll', name: 'Scroll excesivo', icon: 'smartphone', mode: 'time', rate: { dis: -6, esp: -2 } },
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

const OTHER_CAT = { id: 'otros', name: 'Otros', icon: 'stack', color: '#8c8c8c', subs: [] };
const OTHER_SUB = { id: 'otros', name: 'Otros', icon: 'stack', mode: 'count', unit: 'vez', units: 'veces', rate: {}, cat: OTHER_CAT };

export const subInfo = (id) => SUBS.get(id) ?? OTHER_SUB;

// Actividades frecuentes iniciales: genéricas, para que el usuario cree las suyas.
export const DEFAULT_FAVORITES = [
  { id: 'f-madrugar', sub: 'rutina.madrugar', name: 'Levantarse temprano', icon: 'sunrise' },
  { id: 'f-dormir', sub: 'rutina.dormir', name: 'Dormir temprano', icon: 'night-sleep' },
  { id: 'f-jornada', sub: 'carrera.jornada', name: 'Jornada laboral', icon: 'desk' },
  { id: 'f-postular', sub: 'carrera.postulacion', name: 'Búsqueda de empleo', icon: 'envelope' },
  { id: 'f-cocinar', sub: 'hogar.cocinar', name: 'Cocinar', icon: 'cooking-pot' },
  { id: 'f-aseo', sub: 'hogar.aseo', name: 'Aseo', icon: 'broom' },
  { id: 'f-ejercicio', sub: 'deporte.fuerza', name: 'Ejercicio', icon: 'weight-lifting-up' },
  { id: 'f-lectura', sub: 'estudio.lectura', name: 'Lectura', icon: 'bookshelf' },
  { id: 'f-videojuegos', sub: 'ocio.videojuegos', name: 'Videojuegos', icon: 'gamepad' },
  { id: 'f-trasnochar', sub: 'tentacion.trasnochar', name: 'Dormir tarde', icon: 'owl' },
  { id: 'f-delivery', sub: 'tentacion.delivery', name: 'Delivery', icon: 'pizza-slice' },
  { id: 'f-scroll', sub: 'tentacion.scroll', name: 'Scroll excesivo', icon: 'smartphone' },
];

export const TIME_PRESETS = [15, 30, 45, 60, 90, 120, 180];

// Títulos según el nivel del personaje (nivel mínimo → título).
export const TITLES = [
  [1, 'Novato'],
  [3, 'Despertado'],
  [5, 'Rebelde'],
  [8, 'Infiltrado'],
  [12, 'Comodín'],
  [16, 'Arcano Mayor'],
  [20, 'Leyenda'],
];
