interface CalloutBlock {
	text: string;
	startIndex: number;
	endIndex: number;
}



// For translation 
type TranslationService = 'claude' | 'chatgpt' | 'gemini' | 'google' | 'deepl';

type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview' | 'gpt-4-1106-preview' | 'gpt-4-0125-preview' | 'gpt-4-o' | 'o1' | 'o3';
type ClaudeModel = 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
type GeminiModel = 'gemini-1.0-pro' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemma-7b' | 'gemma-2b';

type TranslationModel = OpenAIModel | ClaudeModel | GeminiModel;


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
    CalloutBlock
}

