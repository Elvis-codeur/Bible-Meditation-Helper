interface CalloutBlock {
	text: string;
	startIndex: number;
	endIndex: number;
}



type TranslationService = 'claude' | 'chatgpt' | 'gemini' | 'google' | 'deepl';

type OpenAIModel =
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'gpt-4-turbo-preview'
  | 'gpt-4-1106-preview'
  | 'gpt-4-0125-preview'
  | 'gpt-4o'
  | 'o1'
  | 'o3';

type ClaudeModel =
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

type GeminiModel =
  | 'gemini-1.0-pro'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemma-7b'
  | 'gemma-2b';

type TranslationModel = OpenAIModel | ClaudeModel | GeminiModel;

const MODEL_TOKEN_LIMITS: Record<TranslationModel, number> = {
  // OpenAI models
  'gpt-3.5-turbo': 4096,
  'gpt-4': 8192,
  'gpt-4-turbo-preview': 128000,
  'gpt-4-1106-preview': 128000,
  'gpt-4-0125-preview': 128000,
  'gpt-4o': 128000,
  'o1': 128000,
  'o3': 128000,

  // Claude models (Anthropic)
  'claude-3-opus': 200000,
  'claude-3-sonnet': 150000,
  'claude-3-haiku': 100000,

  // Gemini models (Google)
  'gemini-1.0-pro': 32768,
  'gemini-1.5-pro': 1048576,      // 1M tokens context window
  'gemini-1.5-flash': 1048576,
  'gemma-7b': 8192,               // Same as standard 7B context
  'gemma-2b': 8192                // Approximate, unless specified otherwise
};




interface BibleCitationPluginSettings {
    openaiApiKey: string;
    claudeApiKey: string;
    geminiApiKey: string;
    deeplApiKey: string;
    googleTranslateApiKey: string;
    customTranslationPrompts: string[]; // Now stores multiple prompts
    translationsOutputFolder:string;
}
interface TranslationSettings {
    openaiApiKey: string;
    claudeApiKey: string;
    geminiApiKey: string;
    deeplApiKey: string;
    googleTranslateApiKey: string;
    translationsOutputFolder:string;
}



export type{
    TranslationModel,
    TranslationService,
    OpenAIModel,
    ClaudeModel,
    GeminiModel,
    TranslationSettings,
    BibleCitationPluginSettings,
    CalloutBlock,
}

export {
    MODEL_TOKEN_LIMITS
}

