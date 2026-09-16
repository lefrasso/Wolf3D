# ADR 004 — Guardado local versionado

**Estado:** aceptado. **Fecha:** 2026-09-16.

## Contexto

El jugador necesita retomar la partida. No se solicitan cuentas, sincronización o un backend. El contenido de `localStorage` puede faltar, estar corrupto o proceder de una versión anterior.

## Decisión

Usar un slot con esquema `version: 1`, separado de los ajustes. Guardar al empezar un nivel, cada quince segundos de juego, manualmente y al salir al menú. Reconstruir la topología del nivel desde código confiable y aplicar el estado dinámico validado al cargar. Comprobar salud, munición, armas, coordenadas y estructuras básicas.

## Alternativas

- Backend: más superficie operativa sin necesidad del producto.
- IndexedDB: adecuado para muchas partidas, innecesario para el tamaño actual.
- Serializar escena Three.js: acopla persistencia con render y genera archivos grandes.

## Consecuencias

La partida pertenece al navegador y origen actual. Borrar datos, cambiar de dispositivo o usar navegación privada puede perderla. Los errores de almacenamiento no impiden jugar y se comunican cuando corresponde. Una nueva operación confirma reemplazo si existe un guardado. No hay promesa de migración desde versiones futuras incompatibles.
