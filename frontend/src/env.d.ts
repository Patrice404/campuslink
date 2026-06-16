/// <reference types="pinia-plugin-persistedstate" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Ajoute d'autres variables ici plus tard si besoin
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}