declare namespace NodeJS {
  interface ProcessEnv {
    OPENTUI_WEBUI_TOKEN: string;
    OPENTUI_WEBUI_HOST: string;
    OPENTUI_LOG?: string;
    OPENTUI_APPEND_LOG?: string;
  }
}
