export type ChatSlim = {
  id: string;
  title: string;
  updated_at: number;
  created_at: number;
};

export type ChatFull = {
  id: string;
  user_id: string;
  title: string;
  chat: Chat;
  updated_at: number;
  created_at: number;
  share_id: string | null;
  archived: boolean;
  pinned: boolean;
  meta: Meta;
  folder_id: string | null;
};

type Chat = {
  id: string;
  title: string;
  models: string[];
  params: Record<string, any>;
  history: ChatHistory;
  messages: Message[];
  tags: string[];
  timestamp: number;
  files: any[];
};

export type Message = {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  models?: string[];
  model?: string;
  modelName?: string;
  modelIdx?: number;
  userContext?: any;
  lastSentence?: string;
  usage?: {
    response_token_s: number;
    prompt_token_s: number;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
    approximate_total: string;
  };
  done?: boolean;
  files?: any[];
  error?: { content: any };
  statusHistory?: any;
};

export type ChatHistory = {
  messages: Record<string, Message>;
  currentId: string;
};

type Meta = {
  tags: string[];
};

export type WebModel = {
  id: string;
  name: string;
  object: string;
  created: number;
  owned_by: string;
  ollama: {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
      parent_model: string;
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
    urls: number[];
  };
  actions: any[];
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'moderator'; // Adjust as needed
  profile_image_url: string;
  token: string;
  token_type: 'Bearer'; // If other types are possible, change accordingly
  expires_at: string | null;
  permissions: {
    workspace: {
      models: boolean;
      knowledge: boolean;
      prompts: boolean;
      tools: boolean;
    };
    chat: {
      controls: boolean;
      file_upload: boolean;
      delete: boolean;
      edit: boolean;
      temporary: boolean;
    };
    features: {
      web_search: boolean;
      image_generation: boolean;
      code_interpreter: boolean;
    };
  };
};

export type Config = {
  status: boolean;
  name: string;
  version: string;
  default_locale: string;
  oauth: {
    providers: Record<string, unknown>;
  };
  features: {
    auth: boolean;
    auth_trusted_header: boolean;
    enable_ldap: boolean;
    enable_api_key: boolean;
    enable_signup: boolean;
    enable_login_form: boolean;
    enable_websocket: boolean;
    enable_direct_connections: boolean;
    enable_channels: boolean;
    enable_web_search: boolean;
    enable_code_interpreter: boolean;
    enable_image_generation: boolean;
    enable_autocomplete_generation: boolean;
    enable_community_sharing: boolean;
    enable_message_rating: boolean;
    enable_admin_export: boolean;
    enable_admin_chat_access: boolean;
    enable_google_drive_integration: boolean;
  };
  default_models: null;
  default_prompt_suggestions: {
    title: string[];
    content: string;
  }[];
  code: {
    engine: string;
  };
  audio: {
    tts: {
      engine: string;
      voice: string;
      split_on: string;
    };
    stt: {
      engine: string;
    };
  };
  file: {
    max_size: number | null;
    max_count: number | null;
  };
  permissions: {
    workspace: {
      models: boolean;
      knowledge: boolean;
      prompts: boolean;
      tools: boolean;
    };
    chat: {
      controls: boolean;
      file_upload: boolean;
      delete: boolean;
      edit: boolean;
      temporary: boolean;
    };
    features: {
      web_search: boolean;
      image_generation: boolean;
      code_interpreter: boolean;
    };
  };
  google_drive: {
    client_id: string;
    api_key: string;
  };
};

export type ChatEvent = {
  chat_id: string;
  message_id: string;
  data: { type: 'other'; data?: any } | ChatCompletionData;
};

export type ChatCompletionData = {
  type: 'chat:completion';
  data: {
    id?: string;
    choices?: any;
    sources?: any;
    selected_model_id?: any;
    error?: any;
    usage?: any;
    done?: true;
    content: string;
    title?: string;
  };
};

export type ChatCompleted = {
  chat_id: string;
  id: string;
  messages: Message[];
  model: string;
  session_id: string;
};
