# ADR 002 — Separar simulación y React

**Estado:** aceptado. **Fecha:** 2026-09-16.

## Contexto

Actualizar una jerarquía React por cada actor y cuadro introduciría trabajo y dificultaría probar las reglas fuera del navegador. La velocidad del jugador no debe depender de FPS.

## Decisión

La simulación es un módulo JavaScript sin DOM ni Three.js. Se actualiza con pasos fijos de 1/60 s, máximo seis pasos por cuadro. El motor de coordinación mantiene el estado mutable. React recibe instantáneas aproximadamente a 10 Hz y gestiona menús, HUD y controles.

## Alternativas

- React state por frame: sencilla al inicio, costosa e innecesaria.
- Un ECS completo: útil para escala mayor, exceso de estructura para esta campaña.
- Paso variable: simple, pero menos reproducible en colisiones y cadencias.

## Consecuencias

Las pruebas corren en Node y pueden recorrer una campaña sin GPU. La UI tiene hasta unos 100 ms de latencia visual en cifras; los controles y el movimiento se procesan en el ciclo del motor. Pausa detiene reglas, no obliga a desmontar la escena. Si un frame se retrasa en exceso, se limita recuperación en vez de acumular trabajo ilimitado.
