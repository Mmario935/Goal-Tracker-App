# 🛡️ RPG Metas

App web (PWA) para hacer seguimiento de hábitos y metas como si fueran las estadísticas de un personaje de RPG.
Cada actividad que registras da XP a uno o más atributos, que suben de nivel, y puedes comparar tu progreso por día, semana y mes.

Está pensada para usarse en **iPhone** desde la pantalla de inicio. No tiene servidor, no usa cuentas y no tiene dependencias: los datos se guardan en tu propio dispositivo.

## Atributos

| Atributo | Clase | Ejemplos |
|---|---|---|
| ❤️ Vitalidad | Guerrero | Dormir temprano, ejercicio |
| 🧠 Intelecto | Mago | Curso de Databricks, leer |
| ⚡ Disciplina | Monje | Levantarse temprano, jornada laboral |
| 🛡️ Perseverancia | Paladín | Postulaciones, networking en LinkedIn |
| 💰 Riqueza | Mercader | Cocinar en casa |
| ✨ Espíritu | Bardo | Videojuegos, hobbies, amigos |

Tu **clase** es la del atributo con más XP, y tu **título** (Novato → Leyenda) depende de tu nivel general.

## Reglas

- Del nivel N al N+1 de un atributo se necesitan `100 × N^1.5` XP. El nivel del personaje usa la XP total con base 300.
- **Rachas** (días seguidos con la misma actividad): 3 días ×1.1 · 7 días ×1.25 · 14 días ×1.35 · 30 días ×1.5.
- **Rendimiento decreciente** (opcional por actividad): cada repetición del mismo día vale la mitad. Sirve para que el ocio sume sin dominar.
- **Tentaciones**: actividades que restan XP, como dormir tarde o pedir delivery.
- Cada registro guarda la XP que otorgó en ese momento, así que editar una actividad no cambia tu historial.

## Vistas

- **Hoy**: checklist del día. Tocas una actividad para registrarla, con ‹ › puedes registrar días anteriores y con − deshaces una repetición.
- **Personaje**: radar de atributos, nivel de cada uno y rachas activas.
- **Estadísticas**: comparativa diaria, semanal o mensual contra el periodo anterior. Si el periodo está en curso, se compara contra el mismo tramo del anterior. Además muestra la tendencia de los últimos 8 periodos, las actividades más realizadas y un mapa de constancia.
- **Ajustes**: crear, editar o eliminar actividades, perfil y respaldo (exportar e importar JSON).

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
js/data.js            Atributos y actividades iniciales
js/game.js            XP, niveles, rachas y clase
js/stats.js           Rangos de día/semana/mes y agregaciones
js/store.js           Persistencia en localStorage, exportar e importar
js/charts.js          Gráfico de radar en SVG
tools/serve.ps1       Servidor local para probar
tools/make-icons.ps1  Genera los íconos PNG
```

Si cambias la lista de archivos, sube el número de `CACHE` en `sw.js` para que el iPhone descargue la versión nueva.

## Próximas ideas (v2)

- Misiones diarias y **jefes semanales** (ej.: "10 postulaciones esta semana") con XP extra.
- Logros y medallas (30 días madrugando, 50 postulaciones…).
- Editar atributos desde la app.
- Exportar a CSV para analizarlo en Databricks.
- Sincronización opcional entre dispositivos (Supabase, plan gratuito).
