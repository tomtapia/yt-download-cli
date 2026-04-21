# 🎥 yt-download-cli

`yt-download-cli` is a robust, command-line interface (CLI) tool designed to download high-quality videos and audio streams from YouTube. It manages the entire download pipeline, from stream extraction and selection to advanced transcoding and metadata tagging.

## ✨ Features

*   **Universal Downloading:** Downloads media from specified YouTube URLs.
*   **Format Selection:** Supports selecting various output formats (e.g., MP4 video, MP3 audio).
*   **Transcoding:** Utilizes `ffmpeg` to convert video streams into audio formats (like MP3).
*   **Metadata Embedding:** Automatically embeds ID3 metadata (title, artist, etc.) into audio files.
*   **CLI Interface:** Provides a clear, user-friendly command-line experience with explicit error handling.

## 🚀 Prerequisites

Before running the CLI, you must have the following dependencies installed:

1.  **Node.js & pnpm:** The project uses `pnpm` for package management.
    ```bash
    npm install -g pnpm
    ```
2.  **FFmpeg:** The external multimedia framework is required for all transcoding, downloading, and metadata operations. Ensure it is installed and available in your system's PATH.
    ```bash
    # Example installation (may vary by OS)
    brew install ffmpeg # for macOS
    # or
    sudo apt install ffmpeg # for Debian/Ubuntu
    ```

## 🛠️ Installation

Install the package globally using pnpm:

```bash
pnpm install -g @mariozechner/pi-coding-agent
# Note: Replace the package name above with the actual package name if different
```

## 💻 Usage

### Basic Download

To download a video in its native format:

```bash
yt-download-cli download "<youtube-url>"
```

### Audio Extraction (MP3)

To download and transcode the content into an MP3 file, including metadata:

```bash
yt-download-cli download "<youtube-url>" --audio mp3
```

### Advanced Options

The CLI supports various options for format selection, quality control, and output paths. Refer to the `src/cli.ts` documentation for a full list of available flags.

## 🏗️ Architecture & Design Philosophy

This project adheres to a modular, highly decoupled architecture:

*   **`src/cli.ts`**: The entry point, responsible for parsing user input and validating command-line options.
*   **`src/app.ts`**: The core orchestrator, managing the flow of the download process.
*   **`src/youtube/`**: Houses YouTube-specific logic, including the stream extractor and evaluator that determines the best available stream quality.
*   **`src/download/`**: Manages the actual download logistics, stream orchestration, and the critical interaction with `ffmpeg`.

**Design Focus:**
The design prioritizes separation of concerns, ensuring that YouTube extraction logic does not interfere with core download/transcoding logic, leading to a highly maintainable codebase.

## 🧪 Development & Contribution Guidelines

We welcome contributions! If you plan to contribute, please adhere to the following guidelines:

### 📜 Coding Standards
*   **Language:** TypeScript.
*   **Style:** 2-space indentation.
*   **Naming:** Use `camelCase` for functions/variables and `PascalCase` for types.
*   **Modularity:** Keep modules focused on a single responsibility.

### 🧑‍💻 Testing
*   All new features **must** include corresponding tests in the `test/` directory.
*   Tests use **Vitest** and must cover CLI parsing, option validation, extractor behavior, and `ffmpeg` invocation details.

### 🚢 Release Process
When preparing a release, always run these commands to ensure integrity:
```bash
pnpm test
pnpm pack --dry-run
```

### ⚠️ Security & Stability Notes
*   **Data Security:** Never commit downloaded media, cookies, tokens, or local debug artifacts.
*   **YouTube Instability:** YouTube's API and stream structure are subject to change. Be prepared to update the `src/youtube/` extractor logic when regressions are detected.