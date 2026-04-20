# Plan de Implementación: ID3 para Salida MP3

## Resumen

Incorporar metadatos ID3v2.3 a los archivos .mp3 generados por el CLI, reutilizando el VideoMetadata ya disponible en el pipeline y escribiendo las etiquetas durante la transcodificación existente con ffmpeg. El alcance v1 es intencionalmente acotado: title, artist y un comment opcional con la URL original de YouTube, sin introducir nuevas flags ni scraping adicional.

## Cambios de implementación

- Extender el contrato interno de transcodificación MP3:
  - añadir a remuxSingleInput() un bloque opcional de metadata para audio
  - cuando container === "mp3", pasar a ffmpeg -id3v2_version 3 y -metadata por campo
  - mantener el camino actual de copy intacto para m4a y webm
- Mapear metadata del downloader a etiquetas ID3:
  - title <- resolved.metadata.title
  - artist <- resolved.metadata.author si existe
  - comment <- request.url o una leyenda corta con la URL fuente si se decide dar contexto explícito
  - no setear album en v1
- Integrar el mapeo en el servicio de descarga:
  - construir los metadatos ID3 en src/download/service.ts justo antes de la llamada a remuxSingleInput()
  - aplicar ese bloque solo a salida mp3
  - no modificar el modelo público del resultado; basta con usar VideoMetadata ya existente
- Endurecer el comportamiento de error:
  - ausencia de author o cualquier campo opcional no debe bloquear la descarga
  - si ffmpeg falla al escribir tags, el comando debe fallar como hoy con error claro
  - no agregar una segunda pasada de reescritura del archivo

## Interfaces y comportamiento

- No cambia la interfaz pública del CLI.
- Nuevo comportamiento observable:
  - yt-download-cli download <url> --mode audio --container mp3 produce un MP3 con ID3v2.3
  - title y artist deben aparecer cuando estén disponibles
  - comment puede contener la URL fuente
- Cambios internos:
  - remuxSingleInput() recibe metadata opcional para MP3
  - puede añadirse un tipo pequeño interno para los tags, por ejemplo Mp3TagMetadata, si ayuda a mantener claridad

## Plan de pruebas

- Unit tests de ffmpeg:
  - verificar que el camino MP3 agrega -id3v2_version 3
  - verificar que title, artist y comment se traducen a argumentos -metadata
  - verificar que si falta author, simplemente no se emite esa metadata
  - verificar que salidas no MP3 no reciben argumentos ID3
- Tests del servicio:
  - confirmar que el servicio pasa la metadata correcta a remuxSingleInput() en modo audio + mp3
  - confirmar que request.url llega al campo comment si ese es el formato elegido
- Validación general:
  - pnpm build
  - pnpm test

## Supuestos y defaults

- Se usará ffmpeg como único mecanismo de escritura de ID3; no se añadirá una librería adicional como mutagen, node-id3 o similar.
- El estándar objetivo en v1 es ID3v2.3 por compatibilidad; no se implementa ID3v1 explícito.
- album, artwork, track number, year, genre, lyrics y capítulos quedan fuera de esta iteración.
- El campo comment se poblará con la URL original del video, salvo que durante implementación se prefiera una cadena corta tipo Source: <url> sin cambiar el alcance funcional.
