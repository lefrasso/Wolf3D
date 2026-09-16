# PRD 01 — WOLF3D Castle Escape

**Estado:** implementado v1.1. **Audiencia:** jugador individual de PC, con alternativa táctil. **Stack solicitado:** HTML + JavaScript + React + CSS; renderizador Three.js/WebGL 2.

## Problema y resultado

Recrear la experiencia esencial de explorar una fortaleza en primera persona, administrar salud y munición, combatir, descubrir secretos y alcanzar la salida, presentándola con gráficos HD en un navegador. El resultado entregable es un juego con principio, progresión y final, acompañado de código modificable y documentación de ingeniería.

## Alcance de esta entrega

La versión incluye una campaña original de tres niveles sobre una topología de cuatro sectores conectados, con variantes de obstáculos, materiales y guarnición. Cada nivel tiene dos llaves, puertas y dos secretos. La última salida requiere derrotar al comandante. Se conservan reglas de movimiento plano y armas de impacto instantáneo, con cifras de balance propias.

La implementación no pretende reproducir todos los episodios o cada mapa comercial, ni portar archivos del ejecutable original. No incluye multijugador, cuentas, servicios de puntuación, editor de mapas, logros, recarga por cargadores ni verticalidad. Esta frontera se documenta para distinguir fidelidad del núcleo y extensión de contenido.

## Flujo de jugador

1. Abrir el juego y elegir Recluta, Soldado o Veterano.
2. Iniciar una partida; si existe un guardado, confirmar su reemplazo o continuar.
3. Explorar, combatir y recoger recursos. El objetivo visible cambia con las llaves.
4. Encontrar llave dorada, abrir el siguiente sector, conseguir llave plateada y llegar a la salida.
5. Examinar resultados, avanzar al siguiente nivel y conservar armas, munición, puntuación y vidas.
6. Derrotar al comandante en el tercer nivel y completar la operación.
7. Pausar, guardar o reintentar cuando corresponda.

## Requisitos funcionales y aceptación

| ID | Requisito | Criterio de aceptación |
|---|---|---|
| G01 | Movimiento en tiempo real | WASD, giro, desplazamiento lateral y carrera; velocidad diagonal normalizada |
| G02 | Colisión | Ningún jugador cruza paredes o puertas cerradas; separación de actores vivos |
| G03 | Combate | Cadencia, daño, alcance, munición y obstrucción aplican a cada disparo |
| G04 | Inventario | Cuchillo y pistola iniciales; dos armas obtenibles; munición compartida y limitada |
| G05 | IA | Detección por línea de visión, persecución navegable, ataque con daño y muerte |
| G06 | Puertas | Requerir llave cuando corresponde; apertura animada; evitar cierre sobre actores |
| G07 | Secretos | Dos por nivel; pared inspeccionable; hallazgo y recompensa contados una vez |
| G08 | Recursos | Botiquines restauran salud; munición respeta capacidad; tesoros suman puntos |
| G09 | Progresión | Los tres niveles son transitables; ambos objetos llave alcanzables en orden |
| G10 | Condición final | Última salida bloqueada mientras viva el comandante |
| G11 | Vida y derrota | Salud llega a cero, se pausa combate; reintento consume vida y reinicia nivel |
| G12 | Persistencia | Guardar/cargar mismo nivel, actores, objetos, llaves y estadísticas |
| G13 | UX de pausa | Escape/P y pérdida de foco detienen simulación y limpian entradas |
| G15 | Idiomas | Español e inglés completos, selección persistente, cambio sin reiniciar y compatibilidad de guardados |
| G14 | Distribución | URL hospedada y paquete con fuente, assets, compilado, pruebas, PRD y ADR |

## Parámetros de juego

| Arma | Daño nominal | Cadencia mínima | Alcance en celdas | Munición |
|---|---:|---:|---:|---:|
| Cuchillo | 32 | 0,42 s | 1,15 | 0 |
| Pistola | 32 | 0,32 s | 22 | 1 |
| Subfusil | 26 | 0,135 s | 22 | 1 |
| Ametralladora | 35 | 0,095 s | 24 | 1 |

El daño al enemigo tiene variación de ±6 %. Salud máxima 100, munición máxima 199, salud de botiquín +35, caja de munición +20, munición de enemigo caído +8. Guardias tienen 50 HP, oficiales 75 HP y comandante 420 HP. Niveles: 9, 13 y 17 enemigos; siete tesoros por nivel. Un nivel completado da 1000 puntos. Secretos dan 500; tesoros entre 100 y 500. No se implementa la curva original de vidas extra por puntuación.

La partida inicia con tres vidas, 100 de salud y 40 balas. Reintentar reinicia enemigos, llaves y objetos del nivel, resta una vida y hasta 500 puntos; vuelve al equipo inicial. El paso de nivel conserva inventario y garantiza al menos 60 de salud y 30 balas. Al agotar vidas se ofrece una operación nueva.

## Requisitos no funcionales

- Simulación fija a 60 Hz, independiente de la frecuencia visual; como máximo seis pasos por cuadro.
- UI de estado actualizada aproximadamente a 10 Hz; React no gobierna las posiciones de cada frame.
- Texturas originales con resolución superior a 1024 píxeles; resolución visual adaptable a pantalla y calidad.
- Operación local sin API, CDN de recursos, analítica ni conexión durante el juego compilado.
- Validación de guardado con reconstrucción de mapa confiable desde el código.
- Objetivo de fluidez: 60 FPS en escritorio adecuado; valor objetivo pendiente de medición en hardware real.

## Entrega y comprobación

La prueba de recorrido atraviesa los tres niveles mediante las reglas reales de movimiento, interacción, disparo, recogida y progresión. Usa aleatoriedad fija favorable para aislar lógica: no sustituye una prueba humana de dificultad. La aceptación visual, compatibilidad táctil de dispositivos concretos y rendimiento GPU están señalados como pendientes en VALIDACION.md.

## Actualización v1.1 — Idiomas

Interfaz, mensajes, carteles, instrucciones y etiquetas accesibles disponibles en español e inglés. Se conserva la selección del jugador; el idioma inicial sigue sus preferencias de navegador. Se agregan seis verificaciones de localización. La documentación técnica conserva su idioma original y añade guía de inicio en inglés.
