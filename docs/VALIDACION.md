# Validación de entrega

Fecha: 2026-09-16. La evidencia se refiere a la implementación v1.1 de esta entrega.

## Ejecutado

| Comprobación | Resultado |
|---|---|
| Sintaxis de módulos JavaScript del motor | Correcta |
| Compilación del sitio React/Vinext | Correcta |
| Compilación independiente React/Vite | Correcta |
| Pruebas Node de simulación y localización | 18 aprobadas, 0 fallidas |
| Recorrido autónomo de la campaña | Victoria en 8.986 pasos de simulación |
| Integridad estructural de mapas y objetivos | Tres niveles transitables en el orden de llaves |
| Assets HD | Dos PNG RGB, 1254 × 1254; incorporados localmente |

## Cobertura automática

1. Rectangularidad, límites de mapa, posiciones de objetos y accesibilidad de objetivos.
2. Colisiones y deslizamiento en muros.
3. Normalización de velocidad diagonal.
4. Llaves, apertura y protección de puerta ocupada.
5. Recompensas de secreto una sola vez.
6. Daño, cadencia, consumo de munición, muerte y aparición de munición.
7. Oclusión de disparos y percepción enemiga.
8. Capacidad máxima de recursos y disponibilidad del cuchillo.
9. Congelación en pausa y transición a muerte por daño.
10. Requisitos de salida y bloqueo por comandante.
11. Guardado válido, datos corruptos y mapa reconstruido.
12. Recorrido integral de los tres niveles con movimiento real, combate, recogida, puertas y final.

La última prueba apunta automáticamente y utiliza un generador fijo favorable para que la prueba no dependa de azar. No teletransporta al jugador, no concede llaves artificialmente y no desactiva colisiones ni daño. Verifica que la campaña puede recorrerse; no cuantifica su dificultad para un humano.

## No ejecutado durante la entrega

No se realizó QA visual en navegador, prueba de GPU física, sesión humana completa ni matriz de compatibilidad de dispositivos. Tampoco se validó WebMCP en un contexto de navegador compatible. No se afirma un benchmark de 60 FPS ni compatibilidad idéntica entre navegadores.

## Lista de aceptación manual

- Abrir el juego, comprobar escena y materiales, iniciar una partida.
- Caminar, correr, girar, disparar, recoger objetos, abrir puertas y encontrar un secreto.
- Perder salud, morir, reintentar y comprobar vidas restantes.
- Guardar, recargar el navegador y continuar desde la posición y recursos guardados.
- Terminar cada nivel y derrotar al comandante antes de la salida final.
- Cambiar calidad, FOV, sensibilidad, sonido y movimiento de cámara.
- Pausar con Escape y al cambiar de ventana; confirmar que no queda una tecla o disparo sostenido.
- Validar joystick + giro + disparo simultáneo en móvil real.
- Ejecutar a 1920×1080, 1366×768, 390×844 y 844×390; revisar controles y texto.
- Jugar 15 minutos y registrar FPS, estabilidad y memoria sobre GPU integrada y móvil.

## Reproducción

```sh
pnpm test
pnpm build:standalone
pnpm play
```

Las pruebas viven en `tests/simulation.test.js`; la compilación independiente en `playable/`. Una prueba aprobada de lógica no demuestra que un navegador concreto permita Pointer Lock, audio o WebGL.

## Localización v1.1: comprobaciones adicionales

13. Igualdad de claves y placeholders de ambos catálogos (183 entradas por idioma).
14. Prioridad de selección guardada, variantes regionales y fallback.
15. Persistencia de preferencia y tolerancia a almacenamiento bloqueado.
16. Plurales, interpolación y formato de números.
17. Traducción en vivo de mensajes reales de combate, puertas y objetos.
18. Cambio de idioma sin alterar partida y compatibilidad con guardado v1.

Se inspeccionó el JSX para localizar textos españoles sin traducir. El cambio de idioma de la UI y el lettering 3D requiere aún la validación visual en navegador indicada arriba.
