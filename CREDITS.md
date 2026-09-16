# Créditos y procedencia

Wolfenstein 3D y sus marcas pertenecen a sus titulares. Este proyecto es una reinterpretación independiente, no un producto oficial ni un paquete de recursos del juego original.

## Recursos creados para este proyecto

- Código de simulación, mapas, modelos de geometría, interfaz y síntesis de audio: implementación nueva.
- `stone-wall.png`: textura de mampostería creada con ImageGen, 1254 × 1254, RGB.
- `stone-floor.png`: textura de losas creada con ImageGen, 1254 × 1254, RGB.
- Las texturas se solicitaron repetibles y se usan en repetición; no se garantiza continuidad exacta de píxeles entre bordes.
- Señalización de texto y favicon: creados para este proyecto.
- No se incluyen archivos de datos, sprites, música, efectos grabados ni código del Wolfenstein 3D comercial.

## Dependencias

React y React DOM (MIT), Three.js (MIT), Lucide (ISC), Radix UI (MIT), Vite (MIT), Tailwind CSS (MIT) y las dependencias del envoltorio Vinext. Consultá las licencias incluidas por cada paquete y las versiones exactas del lockfile. Esta nota no cambia las licencias de terceros ni concede derechos sobre sus marcas.

## Referencias consultadas

- [Repositorio original de id Software](https://github.com/id-Software/wolf3d): arquitectura y contexto histórico.
- [WL_DEF.H](https://github.com/id-Software/wolf3d/blob/master/WOLFSRC/WL_DEF.H): inventario de armas y estado de partida.
- [WL_ACT1.C](https://github.com/id-Software/wolf3d/blob/master/WOLFSRC/WL_ACT1.C): puertas, llaves y paredes móviles.
- [Documentación Three.js](https://threejs.org/docs/): motor gráfico.
- [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API): captura del ratón y restricciones de gesto de usuario.
