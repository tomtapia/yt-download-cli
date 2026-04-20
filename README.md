# yt-download-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Descripción

`yt-download-cli` es un CLI en TypeScript para descargar videos públicos de YouTube. Incluye un scaffold extensible, comandos básicos de información y un subcomando `download` respaldado por `YouTube.js` para resolver metadata y streams desde InnerTube.

## Características

*   **CLI en TypeScript:** estructura base lista para crecer con nuevos comandos.
*   **Descarga de YouTube:** soporte inicial para videos públicos desde `youtube.com/watch` y `youtu.be`.
*   **Backend TypeScript nativo:** usa `YouTube.js` en vez de `yt-dlp` o `@distube/ytdl-core`.
*   **Selección simple de formato:** presets por modo, contenedor y calidad, resueltos sobre InnerTube.
*   **Ayuda integrada:** `--help` muestra uso y opciones disponibles.
*   **Información del proyecto:** `--about` imprime nombre, versión y descripción.
*   **Gestión de dependencias:** utiliza `pnpm`.

## Instalación

Para instalar `yt-download-cli`, sigue estos pasos:

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd yt-download-cli
    ```

2.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```

3.  **Instalar `ffmpeg`:**
    El comando `download` requiere `ffmpeg` disponible en el `PATH`.

## Uso

## Desarrollo

```bash
pnpm install
pnpm dev --help
pnpm dev --about
pnpm dev download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
pnpm build
pnpm test
```

## Uso

Durante desarrollo:

```bash
pnpm dev --help
pnpm dev --about
pnpm dev download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --mode video --container mp4 --quality best
pnpm dev download "https://youtu.be/dQw4w9WgXcQ" --mode audio --container m4a
```

Después de compilar:

```bash
node dist/cli.js --help
node dist/cli.js --about
node dist/cli.js download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --output-dir ./downloads
```

## Limitaciones de v1

*   Solo soporta URLs públicas completas de `youtube.com/watch` y `youtu.be`.
*   No soporta playlists, login, cookies, videos privados, age-gated ni streams en vivo.
*   Requiere `ffmpeg` para muxing y remuxing.

## Requisitos

*   Node.js 20+.
*   pnpm instalado.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor, revisa nuestro archivo `CONTRIBUTING.md` (si existe).

## Licencia

Este proyecto está distribuido bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.
