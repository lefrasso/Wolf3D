# ADR 006 — Distribución independiente y verificación por capas

**Estado:** aceptado. **Fecha:** 2026-09-16.

## Contexto

Se pide el proyecto completo, no solo acceso a una página. La fuente hospedada utiliza un envoltorio de framework, mientras que el juego no necesita un servidor de aplicación.

## Decisión

Mantener dos entradas para el mismo componente: la del sitio y una entrada HTML/React estándar. Producir una carpeta `playable/` con assets locales y un servidor Node mínimo sin dependencias. Empaquetar código, lockfile, materiales, compilado, PRD, ADR y pruebas, excluyendo credenciales, caches y dependencias instaladas.

Verificar reglas en Node, compilar ambas entradas y comprobar archivos del paquete. Documentar por separado la validación visual y de rendimiento que necesita navegador y GPU.

## Alternativas

- Solo enlace hospedado: no satisface entrega de fuente.
- Solo código: obliga a instalar y compilar antes de probar.
- Un único HTML con todo incrustado: empeora mantenimiento y tamaño; no elimina restricciones del navegador.

## Consecuencias

El jugador puede abrir el compilado con un servidor local sin instalar paquetes. El desarrollador conserva un build reproducible con pnpm. El sitio y la versión descargable comparten reglas y UI. La ausencia de QA en GPU no se presenta como prueba aprobada: queda documentada en VALIDACION.md. La exportación borra la identidad de despliegue del sitio para evitar confundir proyectos al reutilizarla.
