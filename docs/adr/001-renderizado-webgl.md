# ADR 001 — WebGL sobre reglas de mundo plano

**Estado:** aceptado. **Fecha:** 2026-09-16.

## Contexto

Se solicita conservar el tipo de juego de Wolf3D y mejorar los gráficos a HD. Un raycaster Canvas replicaría la presentación histórica con facilidad, pero limitaría iluminación, geometría y materiales. Un motor de propósito general completo añadiría complejidad sin necesitar física tridimensional.

## Decisión

Usar Three.js/WebGL 2 para el render y mantener el modelo de movimiento en una cuadrícula 2D. Las celdas se representan como volúmenes 3D, con mapas difusos/bump, modelos animados, luces y niebla. El arma usa una escena separada. Los muros repetidos usan instancias.

## Alternativas

- Canvas raycasting: menor dependencia, más trabajo para HD y sombras.
- Motor de físicas completo: complejidad y divergencia del movimiento clásico.
- WebGPU exclusivo: reduciría alcance de navegadores.

## Consecuencias

El aspecto puede evolucionar sin reescribir el combate. Se requiere WebGL 2. No se promete salto, pendientes ni puntería vertical. El coste de GPU debe medirse en hardware real; hay perfiles de calidad para contenerlo. La arquitectura de ray casting histórica se consultó en el [repositorio de referencia](https://github.com/id-Software/wolf3d); la implementación gráfica actual es nueva.
