# Plan de Corrección: Selección de Fuente para MP3

## Resumen

Corregir la lógica de selección de fuentes para --container mp3 para que priorice calidad de audio real antes que contenedor. El problema
actual es que el comparador favorece mp4/m4a sobre webm/opus aun cuando el stream webm tenga mayor bitrate, lo que degrada el resultado final
del MP3. La solución debe mantener bitrate como criterio principal y usar el contenedor solo como desempate.

## Cambios de implementación

- Ajustar compareAudioPreference() en src/download/select-formats.ts:
  - para mp3, comparar primero audioBitrate/bitrate
  - solo si la calidad es equivalente, usar preferencia de contenedor como desempate
  - conservar el comportamiento actual de m4a y webm
- Mantener mp4 como preferencia secundaria para mp3 solo cuando dos fuentes tengan calidad comparable:
  - si mp4 y webm tienen el mismo bitrate efectivo, elegir mp4
  - si webm tiene mayor bitrate, elegir webm
- No cambiar el resto del pipeline:
  - la descarga sigue usando la fuente elegida
  - la transcodificación a mp3 con ffmpeg no cambia
  - no se agregan flags ni cambia la interfaz pública del CLI

## Tests y validación

- Reemplazar el test incorrecto en test/select-formats.test.ts:
  - el caso actual que espera preferencia ciega por mp4 debe cambiar
- Añadir o ajustar casos para mp3:
  - webm 160k vs m4a 128k debe elegir webm
  - m4a 128k vs webm 128k debe elegir m4a como desempate
  - un stream progresivo de mayor bitrate debe seguir competir por calidad como hoy
- Ejecutar pnpm test y, si se quiere validación extra, revisar pnpm dev download --help para confirmar que no cambió la interfaz

## Supuestos

- Para esta corrección, “mejor calidad” se aproxima por audioBitrate y, si falta, por bitrate, que es consistente con el selector actual.
- No hace falta introducir lógica de codec-aware ranking más compleja en esta iteración; el review pide corregir la inversión entre bitrate y
  contenedor, no rediseñar todo el ranking de audio.
- mp4 sigue siendo un desempate razonable cuando la calidad reportada es equivalente, porque evita conversiones desde una fuente peor solo por
  el contenedor.
