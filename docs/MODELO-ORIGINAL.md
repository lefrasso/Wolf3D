# Modelo de referencia y fidelidad

## Evidencia consultada

El repositorio publicado por id Software describe la arquitectura de refresco basada en ray casting y la separación histórica entre el ejecutable y sus datos. Esta entrega conserva la idea de un mundo en cuadrícula, con un renderizador WebGL propio. [Repositorio original](https://github.com/id-Software/wolf3d).

El estado del juego original declara salud, munición, llaves, vidas, puntuación, selección de arma y contadores de bajas, tesoros y secretos. Su enumeración de armas incluye cuchillo, pistola, machinegun y chaingun; estos conceptos organizan el inventario de esta implementación. [WL_DEF.H](https://github.com/id-Software/wolf3d/blob/master/WOLFSRC/WL_DEF.H).

El código de actores contempla la operación de puertas según llaves y paredes móviles. La adaptación conserva la exploración por llaves y los secretos, pero usa animaciones y reglas nuevas. En particular, las puertas normales de esta entrega se cierran por interacción, sin el autocierre temporal del original. [WL_ACT1.C](https://github.com/id-Software/wolf3d/blob/master/WOLFSRC/WL_ACT1.C).

No se copió ninguna rutina de esas fuentes. Las decisiones restantes describen nuestra implementación, no una afirmación de equivalencia exacta con el ejecutable histórico.

## Modelo descompuesto

| Sistema | Función en el diseño | Implementación de esta versión |
|---|---|---|
| Mundo | Espacio, obstáculos y conectividad | Matriz 27×27; 3 unidades renderizadas por celda |
| Jugador | Posición, orientación y recursos | x/z/yaw; salud, munición, inventario, llaves, vidas y puntos |
| Movimiento | Explorar sin atravesar obstáculos | Movimiento continuo; radio de colisión; deslizamiento por ejes |
| Armas | Riesgo, ritmo y economía | Cuatro perfiles hitscan/melee y munición común |
| Actores | Amenaza y respuesta al jugador | Guardias, oficiales y comandante; reposo/persecución/ataque/muerte |
| Puertas | Control de paso y orientación | Estado open/target, llave opcional y animación lateral |
| Secretos | Recompensa por inspección | Paredes deslizantes marcadas; hallazgo irreversible |
| Objetos | Recuperación y puntuación | Botiquines, cajas, tesoros, llaves y armas |
| Salida | Validar objetivo de nivel | Dos llaves; condición extra de comandante en nivel 3 |
| Campaña | Continuidad | Tres niveles, traslado de recursos y resultados |
| Persistencia | Retomar | Slot local versionado; reconstrucción validada de nivel |
| Presentación | Lectura y respuesta | Geometría 3D, materiales HD, HUD React y audio sintetizado |

## Reglas de esta adaptación

El disparo selecciona el enemigo vivo más cercano dentro de la tolerancia angular, el alcance del arma y una línea no obstruida. Las paredes y puertas todavía cerradas bloquean la comprobación. El jugador nunca consume balas con el cuchillo y no necesita cargadores.

La visión del enemigo alcanza diez celdas. Si ve al jugador, mantiene alerta durante catorce segundos. Ataca a menos de 5,5 celdas; de otro modo persigue. El camino se recalcula cada 0,65 segundos sobre la topología actual, sin atravesar puertas cerradas. El enemigo no abre puertas por iniciativa propia. El disparo del jugador alerta enemigos cercanos con línea libre. Un impacto causa una interrupción breve.

Los secretos solo se cuentan una vez. Una puerta no se cierra sobre jugador o enemigos vivos. Los cuerpos no bloquean navegación; los actores vivos sí. La apertura usa una ocupación discreta: la celda se vuelve transitable al superar 88 % de apertura. Es una decisión de robustez, no una simulación física del panel.

## Diferencias explícitas

- Tres mapas propios basados en una topología común con variaciones; no se entregan todos los mapas originales.
- Modelos 3D en lugar de sprites; altura de cámara estable, sin juego vertical.
- Tres dificultades con balance propio, tres tipos de enemigo y un jefe.
- Mapa progresivo y soporte táctil como facilidades del navegador.
- Sin perros, variantes históricas completas de jefes, narrativa original, interludios originales ni voces grabadas.
- Secretos deslizantes y puertas accionadas por el jugador, sin emulación exacta de pushwalls o timings originales.
- Sin vidas extra por umbral de puntuación; se usan tres vidas iniciales.
- Sonido generado por Web Audio; materiales originales generados para la entrega.

El límite de fidelidad es funcional y de ritmo general. No se promete compatibilidad de archivos guardados, demos, datos de mapas, timings o balance con el original.
