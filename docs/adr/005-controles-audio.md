# ADR 005 — Controles alternativos y audio por gesto

**Estado:** aceptado. **Fecha:** 2026-09-16.

## Contexto

El navegador puede restringir captura del puntero, fullscreen y audio. El juego debe seguir siendo controlable si no hay Pointer Lock y debe limpiar entradas al perder foco.

## Decisión

Solicitar captura solo desde acciones del usuario. Ofrecer flechas y arrastre derecho como alternativa, además de joystick y botones táctiles. Pausar ante pérdida de foco, visibilidad o liberación de captura. Eliminar teclas/disparo activos al cambiar de estado. Crear o reanudar AudioContext tras un gesto y sintetizar sonidos localmente.

## Alternativas

- Exigir Pointer Lock: bloquearía algunas vistas integradas.
- Autoplay: no funciona de forma fiable por políticas del navegador.
- Archivos de audio externos: más recursos y dependencia innecesaria.

## Consecuencias

El primer clic inicia audio y captura cuando están disponibles. No se supone que fullscreen o captura estén autorizados por el contenedor. Se dispone de mute y ajuste de volumen. No hay gamepad o reasignación de controles en v1. Se siguió la documentación de [Pointer Lock de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API).
