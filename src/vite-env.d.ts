/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The Render backend, e.g. https://your-api.onrender.com (no trailing slash). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
