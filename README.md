# WOLF3D — Castle Escape · HD Edition

Un FPS jugable en HTML, JavaScript, React, CSS y Three.js. Reinterpreta el núcleo de Wolfenstein 3D con una campaña original de tres niveles y gráficos 3D HD. Versión 1.1, 16 de septiembre de 2026.

[English quick start](README.en.md)

## Idiomas

Elegí **ES / EN** en la barra superior o **Ajustes → Idioma**. La selección se recuerda en este dispositivo; en la primera visita se usa el idioma compatible del navegador, con inglés como alternativa. Cambiar de idioma actualiza interfaz, mensajes y carteles sin reiniciar la partida. Los guardados anteriores siguen siendo compatibles. Ver [guía de localización](docs/LOCALIZATION.md).

## Jugar inmediatamente

La distribución descargable contiene `playable/`, ya compilado. No necesita instalar dependencias, descargar texturas ni conectarse a una API para jugar. Requiere Node.js 22.13 o superior para el servidor local y un navegador con WebGL 2 y aceleración gráfica.

**Windows:** ejecutá `start-game.bat` y abrí `http://localhost:8080`. Si el navegador se abre antes que el servidor, recargá la pestaña.

**Cualquier sistema:** desde la carpeta del proyecto:

```sh
node scripts/serve-playable.mjs
```

Después abrí `http://localhost:8080`. No abras `index.html` con doble clic: los módulos JavaScript y las texturas necesitan HTTP. También podés servir el contenido de `playable/` como raíz de cualquier servidor estático. El progreso queda en el navegador y origen que uses.

## Desarrollar o modificar

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev:standalone
```

La consola indica el puerto de desarrollo. El proyecto declara la versión de pnpm en `package.json`; conservá `pnpm-lock.yaml`.

```sh
pnpm test                 # Pruebas del motor y recorrido completo
pnpm build:standalone     # Regenera playable/
pnpm play                 # Sirve playable/ en localhost:8080
```

`pnpm dev` y `pnpm build` conservan el envoltorio Vinext/Workers del sitio hospedado. Para trabajar exclusivamente en el juego, usá las variantes `:standalone`. El paquete descargable no contiene la identidad de despliegue de la instancia original.

## Qué incluye

- Campaña cerrada de tres niveles: Las mazmorras, El arsenal y La fortaleza.
- 39 enemigos en total: guardias, oficiales y un comandante final.
- Cuatro armas: cuchillo, pistola, subfusil y ametralladora; munición compartida.
- Dos llaves por nivel, puertas animadas, seis áreas secretas y tesoros.
- IA con percepción por línea de visión, persecución con búsqueda de caminos y ataques.
- Vida, tres vidas iniciales, reintentos, puntuación y pantallas de resultados.
- Guardado automático cada 15 segundos de juego, al comenzar un nivel y al volver al menú; guardado manual.
- Materiales HD originales, iluminación cálida, niebla, modelos 3D animados, retroceso y destellos.
- Sonido sintetizado localmente y ambiente musical opcional.
- Teclado/ratón, alternativa sin Pointer Lock y controles táctiles.
- Mapa progresivo de zonas exploradas, tres dificultades y tres perfiles gráficos.
- Interfaz React, motor modular, distribución compilada, documentación y pruebas.

## Controles

| Acción | Control |
|---|---|
| Movimiento | W, A, S, D; ↑ y ↓ también avanzan/retroceden |
| Girar | Ratón; ← y →; arrastre con botón derecho si no hay captura |
| Disparar | Clic izquierdo o Ctrl |
| Interactuar | E o Espacio |
| Correr | Shift |
| Armas | 1–4 o rueda |
| Mapa | M o Tab |
| Pausa | Escape o P |
| Guardar / cargar | F5 / F9 durante la partida |
| Táctil | Joystick izquierdo; arrastre derecho; botones disparar/interactuar |

La puntería es horizontal, como en el modelo clásico. No hay salto, recarga por cargadores ni cambio de altura. El mapa grande **no pausa**. Escape libera el ratón y pausa; el botón Continuar recupera la captura mediante un gesto del usuario.

## Estructura principal

| Ruta | Responsabilidad |
|---|---|
| `index.html`, `standalone/main.jsx` | Entrada HTML + React independiente |
| `components/game/WolfGame.jsx` | Menús, HUD, ajustes, mapa, estados y controles táctiles |
| `app/globals.css` | Sistema visual y adaptación a pantallas |
| `lib/game/levels.js` | Datos de campaña, armas y dificultades |
| `lib/game/simulation.js` | Reglas, colisiones, IA, combate y serialización |
| `lib/game/engine.js` | WebGL, ciclo de juego, entradas, audio y coordinación |
| `lib/game/models.js` | Modelos 3D originales, objetos y señalización |
| `lib/game/audio.js` | Síntesis de efectos y ambiente |
| `public/textures/` | Dos texturas originales 1254 × 1254 |
| `tests/simulation.test.js` | Doce pruebas, incluido recorrido de campaña |
| `lib/game/i18n.js`, `lib/game/locales/` | Soporte extensible de español e inglés |
| `tests/i18n.test.js` | Seis pruebas de traducciones, preferencias y compatibilidad |
| `docs/` | PRD, análisis del modelo, arquitectura, ADR y verificación |
| `playable/` | Compilación independiente incluida en el ZIP |

## Documentación

Empezá por [el índice técnico](docs/INDEX.md), [PRD de producto](docs/PRD-01-producto.md) y [PRD de gráficos y UX](docs/PRD-02-graficos-ux.md).

## Alcance y verificación

Es una reinterpretación independiente y una campaña completa de tres niveles. Los mapas, modelos, interfaz, sonidos, valores de balance y materiales son propios; no es una reproducción exacta de todos los episodios, enemigos o recursos comerciales originales. El código original se consultó como referencia de sistemas, sin incorporarlo al proyecto. Ver [modelo y fidelidad](docs/MODELO-ORIGINAL.md) y [créditos](CREDITS.md).

Se verificaron compilaciones de producción y 18 pruebas de lógica y localización. La prueba de recorrido usa RNG fijo para verificar reglas y progresión; no mide dificultad humana. No se ejecutó validación visual en navegador ni una medición de FPS sobre GPU real durante esta entrega. Los perfiles gráficos son presupuestos de diseño, no garantías de rendimiento. Consultá [VALIDACION.md](docs/VALIDACION.md).

## Solución de problemas

- **Pantalla sin escena 3D:** activá aceleración gráfica y verificá WebGL 2. El juego muestra un aviso si no se puede crear el renderizador.
- **No se captura el ratón:** jugá con flechas o arrastre derecho; abrí el juego en su propia pestaña si un contenedor limita la captura.
- **No hay sonido:** iniciá una partida o activá sonido con un clic; los navegadores requieren un gesto.
- **Bajo rendimiento:** Ajustes → Rendimiento. Cerrá otras aplicaciones que utilicen GPU.
- **Guardado no disponible:** navegación privada o políticas del navegador pueden impedir `localStorage`. La partida sigue funcionando, pero no se asegura persistencia.
- **Puerto ocupado:** elegí otro mediante `GAME_PORT` y abrí ese puerto. El servidor se vincula únicamente a loopback.
