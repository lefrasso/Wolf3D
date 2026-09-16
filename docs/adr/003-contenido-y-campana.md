# ADR 003 — Contenido original y campaña parametrizada

**Estado:** aceptado. **Fecha:** 2026-09-16.

## Contexto

El proyecto debe ser autónomo, modificable y jugable sin archivos del juego comercial. Replicar todos los episodios históricos ampliaría significativamente el contenido de la primera entrega.

## Decisión

Crear tres niveles propios, modelos geométricos propios, audio sintetizado y dos materiales HD originales. Los niveles comparten una topología de sectores con variaciones de obstáculos, guarnición y apariencia. Las armas, objetos y dificultades se describen en datos. Se replica el núcleo de exploración y combate, dejando documentada la diferencia de contenido.

## Alternativas

- Importar recursos del juego: añade dependencias sobre archivos externos y distribución.
- Generar mapas aleatorios: reduce control del ritmo y dificulta garantizar llaves alcanzables.
- Diseñar una campaña extensa antes del motor: retrasa una versión completa y comprobable.

## Consecuencias

El ZIP contiene todos los recursos necesarios para jugar. La apariencia no es una réplica exacta de personajes o escenarios originales. Se puede ampliar la campaña desde `levels.js`, pero cada mapa nuevo debe pasar pruebas de conectividad y objetivos. Los tres niveles actuales ofrecen un final, no una promesa de contenido futuro.
