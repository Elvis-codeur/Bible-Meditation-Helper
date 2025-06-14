import { App, Modal, Notice, Plugin, TFile, TextComponent } from 'obsidian';
import OpenAI from 'openai';
import { Translate } from '@google-cloud/translate/build/src/v2';
import axios from 'axios';
import { requestUrl, RequestUrlResponse } from 'obsidian';

interface TranslationSettings {
    openaiApiKey: string;
    claudeApiKey: string;
    geminiApiKey: string;
    deeplApiKey: string;
    googleTranslateApiKey: string;
}

type TranslationService = 'claude' | 'chatgpt' | 'gemini' | 'google' | 'deepl';
type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview' | 'gpt-4-1106-preview' | 'gpt-4-0125-preview';

export class TranslateNotes {
    private app: App;
    private settings: TranslationSettings;

    constructor(app: App, settings: TranslationSettings) {
        this.app = app;
        this.settings = settings;
    }

    private validateApiKey(service: TranslationService): void {
        switch (service) {
            case 'chatgpt':
                if (!this.settings.openaiApiKey) {
                    throw new Error('OpenAI API key is not configured. Please add it in settings.');
                }
                break;
            case 'deepl':
                if (!this.settings.deeplApiKey) {
                    throw new Error('DeepL API key is not configured. Please add it in settings.');
                }
                break;
            case 'claude':
                if (!this.settings.claudeApiKey) {
                    throw new Error('Claude API key is not configured. Please add it in settings.');
                }
                break;
            case 'gemini':
                if (!this.settings.geminiApiKey) {
                    throw new Error('Gemini API key is not configured. Please add it in settings.');
                }
                break;
            case 'google':
                if (!this.settings.googleTranslateApiKey) {
                    throw new Error('Google Translate API key is not configured. Please add it in settings.');
                }
                break;
        }
    }

    private async translateWithDeepL(content: string, targetLang: string): Promise<string> {
        try {
            const response = await requestUrl({
                url: 'https://api-free.deepl.com/v2/translate',
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${this.settings.deeplApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: [content],
                    target_lang: targetLang.toUpperCase()
                })
            });

            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your DeepL API key in settings.');
            }

            if (response.status !== 200) {
                throw new Error(`DeepL API error: ${response.status}`);
            }

            return response.json.translations[0].text;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to connect to DeepL service');
        }
    }

    private async translateWithOpenAI(content: string, targetLang: string, customPrompt?: string, model?: OpenAIModel): Promise<string> {
        try {
            const response = await requestUrl({
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model || 'gpt-4-turbo-preview',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional translator. Translate the following text to ${targetLang} while maintaining the original formatting and markdown syntax. ${customPrompt}`
                        },
                        {
                            role: 'user',
                            content:  `Translate this text to ${targetLang}:\n\n${content}`
                        }
                    ],
                    temperature: 0.2
                })
            });

            if (response.status !== 200) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            return response.json.choices[0].message.content;
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error(`OpenAI translation failed: ${error.message}`);
        }
    }

    async translateNote(file: TFile, service: TranslationService, targetLang: string, customPrompt?: string, openAIModel?: OpenAIModel): Promise<void> {
        try {
            // Validate API key before proceeding
            this.validateApiKey(service);

            const fileContent = await this.app.vault.read(file);
            let translatedContent = '';

            switch (service) {
                case 'chatgpt':
                    translatedContent = await this.translateWithOpenAI(fileContent, targetLang, customPrompt, openAIModel);
                    break;
                case 'deepl':
                    translatedContent = await this.translateWithDeepL(fileContent, targetLang);
                    break;
                default:
                    throw new Error(`Unsupported translation service: ${service}`);
            }

            if (!translatedContent) {
                throw new Error('No translation received from the service.');
            }

            // Create new file with translated content
            const newFileName = `${file.basename}_${targetLang}.${file.extension}`;
            await this.app.vault.create(newFileName, translatedContent);

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Translation failed: ${error.message}`);
            } else {
                throw new Error('Translation failed: Unknown error occurred');
            }
        }
    }
}

export class TranslationModal extends Modal {
    private result: { 
        service: TranslationService; 
        targetLang: string; 
        customPrompt?: string;
        openAIModel?: OpenAIModel 
    };
    private onSubmit: (result: { 
        service: TranslationService; 
        targetLang: string; 
        customPrompt?: string;
        openAIModel?: OpenAIModel 
    }) => void;

    constructor(app: App, onSubmit: (result: { service: TranslationService; targetLang: string; customPrompt?: string; openAIModel?: OpenAIModel }) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h3', { text: 'Translation Settings' });

        // Translation service selection
        contentEl.createEl('label', { text: 'Translation Service' });
        const serviceSelect = contentEl.createEl('select');
        ['claude', 'chatgpt', 'gemini', 'google', 'deepl'].forEach(service => {
            serviceSelect.createEl('option', { text: service, value: service });
        });

        // OpenAI model selection (initially hidden)
        const modelContainer = contentEl.createEl('div');
        modelContainer.style.display = 'none';
        contentEl.createEl('label', { text: 'OpenAI Model', parent: modelContainer });
        const modelSelect = contentEl.createEl('select', { parent: modelContainer });
        [
            'gpt-4-0125-preview',
            'gpt-4-turbo-preview',
            'gpt-4-1106-preview',
            'gpt-4',
            'gpt-3.5-turbo'
        ].forEach(model => {
            const option = modelSelect.createEl('option', { 
                text: model, 
                value: model 
            });
            // Set gpt-4-turbo-preview as default
            if (model === 'gpt-4-turbo-preview') {
                option.selected = true;
            }
        });

        // Show/hide model selection based on service selection
        serviceSelect.addEventListener('change', () => {
            modelContainer.style.display = serviceSelect.value === 'chatgpt' ? 'block' : 'none';
        });

        // Target language input
        contentEl.createEl('label', { text: 'Target Language' });
        const langInput = new TextComponent(contentEl)
            .setPlaceholder('Enter target language (e.g., fr, es, de)');

        // Custom prompt input
        contentEl.createEl('label', { text: 'Custom Translation Prompt (optional)' });
        const promptInput = new TextComponent(contentEl)
            .setPlaceholder('Enter custom translation instructions');

        // Submit button
        const submitBtn = contentEl.createEl('button', { 
            text: 'Translate',
            cls: 'mod-cta'
        });

        submitBtn.onclick = async () => {
            const targetLang = langInput.getValue().trim();
            if (!targetLang) {
                new Notice('Please enter a target language code (e.g., fr, es, de)');
                return;
            }

            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('No active file to translate');
                return;
            }

            try {
                this.result = {
                    service: serviceSelect.value as TranslationService,
                    targetLang: targetLang,
                    customPrompt: promptInput.getValue(),
                    openAIModel: serviceSelect.value === 'chatgpt' ? 
                        modelSelect.value as OpenAIModel : 
                        undefined
                };
                this.onSubmit(this.result);
                this.close();
            } catch (error) {
                new Notice(`Translation failed: ${error.message}`);
                console.error('Translation error:', error);
            }
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}