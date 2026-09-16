# PRD 02 — Gráficos HD y experiencia de juego

**Estado:** implementación v1.1; validación visual en dispositivos pendiente. **Principio:** conservar la lectura inmediata de un FPS clásico, con una fortaleza 3D sobria y texturizada.

## Dirección visual

Piedra gris fría, pisos de losas oscuras, hierro envejecido, luz cálida de antorchas y niebla tenue. La interfaz usa carbón/verde oscuro, tipografía condensada y un acento lima. Los objetos útiles tienen siluetas diferenciadas: llaves metálicas, botiquines claros, munición verde y tesoros dorados.

No se incorporan las texturas pixeladas originales. Las dos texturas propias tienen 1254 × 1254 píxeles y se aplican con repetición, filtrado anisotrópico y bump mapping. Los modelos de armas, guardias y objetos son geometría original de complejidad moderada: HD aquí describe resolución de render y materiales, no una producción fotorealista AAA.

## Presupuesto gráfico implementado

| Perfil | Límite de DPR | Sombras | Materiales |
|---|---:|---|---|
| HD / Alta | 1,6 | Spotlight con mapa 1024² | Texturas HD, bump, luces y niebla |
| Equilibrada | 1,15 | Desactivadas | Mismos materiales |
| Rendimiento | 0,8 | Desactivadas | Mismos materiales; intensidad de antorchas menor |

Se usan instancias para muros y molduras, ocho luces cercanas reutilizadas y una luz de seguimiento. Tonemapping ACES, salida sRGB y antialiasing. El arma se dibuja en una escena separada tras limpiar profundidad para evitar intersección con muros. No hay SSAO, reflejos de pantalla, ray tracing ni posprocesado pesado.

## Pantallas y estados

| Estado | Información y acciones |
|---|---|
| Menú | Escena 3D viva, dificultad, Nueva partida, Continuar si hay guardado, manual, audio, ajustes, fullscreen |
| Jugando | Objetivo, nivel, mapa, salud, munición, arma, llaves, bajas, secretos, puntuación y vidas |
| Pausa | Continuar, Guardar, Ajustes, Controles y Menú |
| Derrota | Vidas restantes y reintento; nueva operación al agotar vidas |
| Fin de nivel | Bajas, secretos, tesoros, tiempo y puntuación; acción siguiente nivel |
| Victoria | Confirmación del final; volver al menú |
| Error GPU | Mensaje accionable y posibilidad de recargar |

## Entrada y feedback

- Captura del ratón después del clic del jugador. Si no es posible: flechas o arrastre derecho.
- Puntería horizontal fija. El bob visual no modifica el plano de simulación.
- Retícula central, retroceso de arma, destello, marcador de impacto y viñeta breve de daño.
- Interacción contextual solo cerca de puertas/salida. La falta de llave explica qué se necesita.
- Mensajes cortos al recoger objetos y hallar secretos; no interrumpen movimiento.
- Alternativa táctil con joystick, región de giro y botones de disparo e interacción.
- Mapa de exploración sin enemigos ocultos. El mapa grande declara que la partida continúa.
- Sonido solo tras gesto; todos los efectos pueden silenciarse. Ambiente musical opcional.

## Accesibilidad y adaptación

Controles semánticos, botones con nombres accesibles, foco visible, diálogos con foco administrado mediante Radix y etiquetas de ajustes. Sensibilidad de 0,3× a 2,5×; FOV de 60° a 100°; desactivación del movimiento de cámara. Se respeta la preferencia de movimiento reducido para transiciones CSS.

La experiencia es espacial y visual; esta versión no ofrece navegación no visual completa, reasignación de teclas, modo daltonismo específico o soporte de gamepad. Las llaves se identifican tanto en mensajes como por color. Los controles esenciales se mantienen en pantallas estrechas, reduciendo metadatos decorativos.

## Criterios de QA visual por ejecutar

1. Menú legible y acción de empezar disponible en 1920×1080, 1366×768 y 390×844.
2. HUD sin superposición impeditiva en 844×390 y 390×844.
3. Captura/liberación de ratón y foco del diálogo en Chrome, Edge y Firefox.
4. Escena visible con ambos materiales cargados; errores gráficos sin pantalla silenciosa.
5. Táctil simultáneo: mover + girar + disparar, sin entradas pegadas tras pointercancel.
6. Prueba de 15 minutos para memoria y cambio entre niveles.
7. Medición de FPS sobre GPU integrada y móvil representativos; ajustar presupuestos si es necesario.

Estos puntos se entregan como pendientes explícitos. Las pruebas automáticas de lógica y la compilación no demuestran estos resultados de navegador.

## Idiomas — v1.1

Selector ES/EN en la barra y en Ajustes; nombres nativos English/Español. Todos los textos visibles, de asistencia y carteles 3D se actualizan sin reiniciar el nivel. Se ajusta la barra compacta para evitar desbordes al agregar el control. Validación manual pendiente: cambio de idioma desde pausa, textos ingleses en móvil, persistencia al recargar y lettering de la salida.
