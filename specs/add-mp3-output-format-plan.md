# Plan de Implementación: Audio MP3 para el CLI

## Resumen

Agregar soporte de mp3 al modo audio manteniendo m4a como default. La ruta más performante y compatible con el estado actual del proyecto es
descargar el mejor stream de audio disponible vía YouTube.js y convertirlo a MP3 con ffmpeg; YouTube.js no expone mp3 nativo como formato
fuente. El objetivo es maximizar compatibilidad con equipos antiguos sin degradar el flujo actual de m4a/webm.

## Cambios de implementación

- Extender la interfaz pública del CLI:
  - aceptar --container mp3 solo en --mode audio
  - agregar --audio-bitrate <bitrate> para mp3, con default 192k
  - limitar --audio-bitrate a valores explícitos y compatibles, por ejemplo 128k, 192k, 256k, 320k
- Ajustar validación y tipos:
  - incluir mp3 en DownloadContainer
  - agregar audioBitrate a DownloadCommandOptions y DownloadRequest
  - rechazar --audio-bitrate cuando el contenedor no sea mp3
  - mantener m4a como default en audio y no cambiar el contrato actual de video
- Reutilizar el extractor/selector actual con una política específica para mp3:
  - preferir audio-only mp4/m4a como fuente
  - si no existe, usar audio-only webm
  - si no existe audio-only, caer a un stream progresivo con audio
  - no intentar “descargar mp3” desde YouTube.js; siempre descargar una fuente real y transcodificar
- Extender ffmpeg:
  - mantener copy para m4a y webm
  - agregar una ruta de transcodificación MP3 con libmp3lame, -vn, -b:a <bitrate>
  - generar .mp3 como extensión final y conservar la lógica actual de temporales/overwrite
- Actualizar ayuda y docs:
  - download --help debe mencionar mp3
  - documentar que --audio-bitrate aplica solo a mp3
  - dejar explícito que mp3 implica transcodificación y será más lento que m4a

## Interfaces y comportamiento

- CLI nuevo:
  - yt-download-cli download <url> --mode audio --container mp3
  - yt-download-cli download <url> --mode audio --container mp3 --audio-bitrate 256k
- Defaults elegidos:
  - --mode audio sigue defaulting a m4a
  - --container mp3 es opt-in
  - --audio-bitrate default 192k
- Semántica de calidad:
  - para mp3, la calidad final la domina --audio-bitrate
  - --quality no define el bitrate del mp3; solo puede influir indirectamente si el backend cae a un stream progresivo

## Plan de pruebas

- Validación CLI:
  - aceptar audio + mp3
  - rechazar video + mp3
  - rechazar --audio-bitrate sin mp3
  - usar 192k por defecto cuando no se pase bitrate
- Servicio/selector:
  - preferir audio-only mp4 sobre otras fuentes para mp3
  - fallback a webm audio-only y luego a progresivo cuando corresponda
- ffmpeg:
  - verificar args de transcodificación MP3
  - mantener intacto el flujo copy de m4a/webm
- Integración:
  - nombre final con extensión .mp3
  - docs/help actualizados
  - pnpm build y pnpm test en verde

## Supuestos y defaults

- mp3 se implementa solo para --mode audio.
- No se agrega soporte de metadata ID3 avanzada en esta iteración; el foco es compatibilidad y descarga funcional.
- No se cambia el comportamiento actual de m4a/webm; mp3 se suma como ruta nueva de transcodificación.
