# 🎭 RPG Metas

App web (PWA) para hacer seguimiento de hábitos y metas como si fueran las estadísticas de un personaje de JRPG.
Cada actividad que registras da XP a uno o más atributos, que suben de nivel, y puedes comparar tu progreso por día, semana y mes.

Está pensada para usarse en **iPhone** desde la pantalla de inicio. No tiene servidor, no usa cuentas y no tiene dependencias: los datos se guardan en tu propio dispositivo.

La estética es de JRPG oscuro: paleta roja, negra y blanca, paneles con cortes en diagonal, etiquetas tipo recorte y tipografía condensada ([Anton](https://fonts.google.com/specimen/Anton), que queda guardada para funcionar sin conexión).

Los íconos son siluetas de [game-icons.net](https://game-icons.net) (Lorc, Delapouite y colaboradores, licencia [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)), integradas en [`js/icons.js`](js/icons.js). Para agregar uno, copia el `<path>` de su SVG en ese archivo y usa su nombre en `js/data.js`.

## Atributos

| Atributo | Arcano | Ejemplos |
|---|---|---|
| ❤️ Vitalidad | El Carro | Dormir temprano, ejercicio |
| 🧠 Intelecto | El Mago | Curso de Databricks, leer |
| ⚡ Disciplina | El Emperador | Levantarse temprano, jornada laboral |
| 🛡️ Perseverancia | La Fuerza | Postulaciones, networking en LinkedIn |
| 💰 Riqueza | La Fortuna | Cocinar en casa |
| ✨ Espíritu | La Estrella | Videojuegos, hobbies, amigos |

Tu **arcano** es el del atributo con más XP. Tu **título** depende de tu nivel general: Novato → Despertado → Rebelde → Infiltrado → Comodín → Arcano Mayor → Leyenda.

## Modelo: categoría → subcategoría → actividad

El puntaje no se define por actividad sino por **subcategoría**. Cada una tiene una forma de medirse y un puntaje base:

| Forma de medir | Ejemplo | Cómo se registra |
|---|---|---|
| ⏱ Por hora | Estudio › Curso: 🧠 +20/h ⚡ +6/h | Duración (15 min, 30 min, 1 h…) |
| 🔢 Por unidad | Profesional › Búsqueda de empleo: 🛡️ +12 ⚡ +3 | Cantidad |
| ✅ Una vez al día | Rutina › Levantarse temprano: ⚡ +10 ❤️ +2 | Un toque |

Hay 7 categorías: **Estudio, Profesional, Deporte, Hogar, Descanso y rutina, Ocio y Malos hábitos**, con 26 subcategorías en total. *Profesional* agrupa la jornada laboral, la búsqueda de empleo (temporal), el networking y el desarrollo profesional. Puedes ver la tabla completa en *Ajustes › Tabla de puntajes* y editarla en [`js/data.js`](js/data.js).

- **Actividad con nombre** (ej. "Curso Databricks" en Estudio › Curso): sirve para lo que quieres seguir como identidad propia. Se guarda en *Mis actividades* para registrarla con un toque y tiene su propia racha.
- **Registro genérico con nota** (ej. Hogar › Aseo, 45 min, "baño y cocina"): sirve para lo variable. No necesitas una actividad por habitación.

## Reglas

- Del nivel N al N+1 de un atributo se necesitan `100 × N^1.5` XP. El nivel del personaje usa la XP total con base 300.
- **Óptimo diario**: cada subcategoría tiene uno (ej. 2 h de videojuegos o 3 h de curso). El tiempo o las unidades por encima valen la mitad. Así el ocio suma sin dominar y no conviene inflar horas.
- **Rachas** (días seguidos con la misma actividad): 3 días ×1.1 · 7 días ×1.25 · 14 días ×1.35 · 30 días ×1.5.
- **Malos hábitos**: subcategorías que restan XP, como dormir tarde, delivery o scroll.
- Puedes registrar actividades simultáneas (por ejemplo, cocinar mientras escuchas un curso). No se bloquean solapes.
- Cada registro guarda la XP que otorgó en ese momento, así que cambiar puntajes no altera tu historial.

## Vistas

- **Hoy**: XP y tiempo invertido del día. Tiene la rutina diaria como píldoras de un toque, tus actividades como tarjetas, los malos hábitos, el botón **＋ Registrar actividad** (categoría → subcategoría → detalle) y el registro del día con opción de borrar. Con ‹ › puedes registrar días anteriores.
- **Personaje**: radar de atributos, nivel de cada uno y rachas activas.
- **Estadísticas**: comparativa diaria, semanal o mensual contra el periodo anterior. Si el periodo está en curso, se compara contra el mismo tramo del anterior. Incluye **tiempo por categoría**, tendencia, lo que más XP te aportó y un mapa de constancia.
- **Ajustes**: perfil, *Mis actividades*, tabla de puntajes y respaldo (exportar e importar JSON).

## Probar en local (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Luego abre http://localhost:8080. Los módulos JS no funcionan abriendo `index.html` directamente con `file://`.

## Publicar gratis en GitHub Pages

1. Crea un repositorio en GitHub y sube el código:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/rpg-metas.git
   git push -u origin main
   ```
2. En GitHub ve a **Settings → Pages → Build and deployment**, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
3. En uno o dos minutos la app queda en `https://<tu-usuario>.github.io/rpg-metas/`.

## Instalar en iPhone

1. Abre la URL en **Safari** (en iOS tiene que ser Safari).
2. Toca **Compartir** (□↑) y luego **Agregar a pantalla de inicio**.
3. Abre la app desde el ícono: se ve a pantalla completa y funciona sin conexión.

> ⚠️ Los datos viven en el almacenamiento de la app en tu iPhone. Si la borras de la pantalla de inicio, se borran también.
> Usa **Ajustes → Exportar** de vez en cuando para guardar un respaldo en Archivos o iCloud Drive.

## Estructura

```
index.html            Estructura y barra de pestañas
manifest.webmanifest  Metadatos de la PWA
sw.js                 Service worker (funciona sin conexión)
css/styles.css        Estilos (mobile-first, áreas seguras del iPhone)
js/app.js             Vistas, eventos y editor de actividades
js/data.js            Atributos, categorías, subcategorías y puntajes
js/game.js            XP, óptimo diario, niveles, rachas y arcano
js/stats.js           Rangos de día/semana/mes y agregaciones
js/store.js           Persistencia en localStorage, exportar e importar
js/charts.js          Gráfico de radar en SVG
js/icons.js           Íconos SVG (game-icons.net) y selector de avatar
tools/serve.ps1       Servidor local para probar
tools/make-icons.ps1  Genera los íconos PNG
```

Si cambias la lista de archivos, sube el número de `CACHE` en `sw.js` para que el iPhone descargue la versión nueva.

## Próximas ideas (v2)

- Misiones diarias y **jefes semanales** (ej.: "10 postulaciones esta semana") con XP extra.
- Logros y medallas (30 días madrugando, 50 postulaciones…).
- Editar puntajes y crear subcategorías desde la app.
- Exportar a CSV para analizarlo en Databricks.
- Sincronización opcional entre dispositivos (Supabase, plan gratuito).
