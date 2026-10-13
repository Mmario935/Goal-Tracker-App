// Valores iniciales: atributos del personaje y actividades de ejemplo.
// Los efectos indican cuánta XP aporta (o resta) cada actividad a cada atributo.

export const DEFAULT_ATTRIBUTES = [
  { id: 'vit', name: 'Vitalidad', emoji: '❤️', color: '#f05252', cls: 'Guerrero' },
  { id: 'int', name: 'Intelecto', emoji: '🧠', color: '#4f8cff', cls: 'Mago' },
  { id: 'dis', name: 'Disciplina', emoji: '⚡', color: '#f5b622', cls: 'Monje' },
  { id: 'per', name: 'Perseverancia', emoji: '🛡️', color: '#a274ff', cls: 'Paladín' },
  { id: 'riq', name: 'Riqueza', emoji: '💰', color: '#2fbf71', cls: 'Mercader' },
  { id: 'esp', name: 'Espíritu', emoji: '✨', color: '#ff6fb5', cls: 'Bardo' },
];

// repeatable: se puede registrar varias veces al día.
// diminishing: cada repetición del mismo día vale la mitad que la anterior.
export const DEFAULT_ACTIVITIES = [
  { id: 'madrugar', emoji: '⏰', name: 'Levantarse temprano', effects: { dis: 10, vit: 2 } },
  { id: 'dormir', emoji: '🌙', name: 'Dormir temprano', effects: { vit: 10, dis: 3 } },
  { id: 'ejercicio', emoji: '🏃', name: 'Ejercicio', effects: { vit: 15, dis: 5 } },
  { id: 'cocinar', emoji: '🍳', name: 'Cocinar en casa', effects: { riq: 10, vit: 5 } },
  { id: 'jornada', emoji: '💼', name: 'Jornada laboral completa', effects: { dis: 10, riq: 10 } },
  { id: 'databricks', emoji: '📊', name: 'Curso Databricks (30 min)', effects: { int: 15, dis: 5 }, repeatable: true },
  { id: 'leer', emoji: '📚', name: 'Leer', effects: { int: 10, esp: 3 } },
  { id: 'postular', emoji: '📨', name: 'Postulación a trabajo', effects: { per: 15, dis: 3 }, repeatable: true },
  { id: 'linkedin', emoji: '🤝', name: 'Networking en LinkedIn', effects: { per: 10, esp: 2 } },
  { id: 'ocio', emoji: '🎮', name: 'Videojuegos / ocio (1 h)', effects: { esp: 10 }, repeatable: true, diminishing: true },
  { id: 'hobby', emoji: '🎨', name: 'Hobby creativo', effects: { esp: 12, int: 3 } },
  { id: 'social', emoji: '🫂', name: 'Tiempo con amigos o familia', effects: { esp: 12, vit: 3 } },
  { id: 'trasnochar', emoji: '🥱', name: 'Dormir tarde', effects: { vit: -8, dis: -4 } },
  { id: 'delivery', emoji: '🛵', name: 'Pedir comida a domicilio', effects: { riq: -8 } },
  { id: 'scroll', emoji: '📱', name: 'Scroll excesivo', effects: { dis: -5, esp: -2 } },
];

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
