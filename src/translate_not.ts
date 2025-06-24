import { App, Modal, Notice, Plugin, TFile, TextComponent } from 'obsidian';
import OpenAI from 'openai';
import { Translate } from '@google-cloud/translate/build/src/v2';
import axios from 'axios';
import { requestUrl, RequestUrlResponse } from 'obsidian';
import { MODEL_TOKEN_LIMITS, OpenAIModel, TranslationModel, TranslationService, TranslationSettings } from './type_definitions';
import { chunkTextByTokens } from './text_manipulations';
import { extractBibleCitations } from './bible_citation_getter';
import { text } from 'stream/consumers';




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

    //import { Vault, TFile } from 'obsidian'; // make sure these are imported

    private async translateWithOpenAI(
        content: string,
        targetLang: string,
        customPrompt?: string,
        model?: OpenAIModel
    ): Promise<string> {


        let gptDefaultModel = 'gpt-4o';

        const activeFile = this.app.workspace.getActiveFile();
        const inputFileName = activeFile ? activeFile.name : 'unknown-file';


        try {
            const response = await requestUrl({
                url: 'https://api.openai.com/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model || gptDefaultModel,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional translator. Translate the following text to ${targetLang} while maintaining the original formatting and markdown syntax. ${customPrompt} || ''}`
                        },
                        {
                            role: 'user',
                            content: `Translate this text to ${targetLang}:\n\n${content}`
                        }
                    ],
                    temperature: 0.2
                })
            });

            if (response.status !== 200) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const translatedText = response.json.choices[0].message.content;

            // Build metadata object
            const metadata = {
                translation_id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                model: {
                    model_name: model || gptDefaultModel,
                    api_base: 'https://api.openai.com/v1',
                    organization: null // or your org id if applicable
                },
                translation_settings: {
                    temperature: 0.2,
                    // add other settings as needed
                },
                translation_data: {
                    source_text: content,
                    translated_text: translatedText,
                    source_language: 'auto', // or add a param for source lang detection
                    target_language: targetLang
                },
                system_info: {
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    appVersion: navigator.appVersion
                },
                notes: null
            };

            await this.saveTranslationMetadata(metadata, inputFileName, targetLang);

            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error(`OpenAI translation failed: ${error.message}`);
        }
    }

    private async saveTranslationMetadata(metadata: any, inputFileName: string, targetLang: string) {
        try {
            // Use the output folder from settings or fallback
            const baseFolder = this.settings.translationsOutputFolder?.trim() || 'Translations';

            // Create folder path using the input file name (without extension) as subfolder
            const inputFileBaseName = inputFileName.replace(/\.[^/.]+$/, ""); // Remove file extension

            const folderPath = `${baseFolder}/${inputFileBaseName}`;

            // Ensure the folder exists
            await this.app.vault.createFolder(folderPath).catch(() => { });

            // File name includes target language and translation ID
            const fileName = `${folderPath}/translation-${targetLang}-${metadata.translation_id}.json`;

            const fileContent = JSON.stringify(metadata, null, 2);

            await this.app.vault.adapter.write(fileName, fileContent);

        } catch (error) {
            console.error('Failed to save translation metadata:', error);
        }
    }


    private extractWikiLinks = (text: string) => {
        // Modified regex to handle nested links
        const regex = /\[\[(?:[^\[\]]|\[[^\[\]]*\])*?\]\]/g;
        const matches: Array<{
            fullText: string,
            beginIndex: number,
            endIndex: number
        }> = [];

        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                fullText: match[0],
                beginIndex: match.index,
                endIndex: match.index + match[0].length - 1
            });
        }

        // Sort matches by beginIndex in reverse order to handle nested links correctly
        matches.sort((a, b) => b.beginIndex - a.beginIndex);
        return matches;
    };





    async translateNote(file: TFile, service: TranslationService, targetLang: string, customPrompt?: string, model?: TranslationModel): Promise<void> {
        try {
            this.validateApiKey(service);


            let fileContent = await this.app.vault.read(file);

            let processedContent = fileContent;


            // Extract and replace Bible Citations 
            let bibleCitations = await extractBibleCitations(processedContent);

            //console.log(bibleCitations);
            
            //console.log("bibleCitations",bibleCitations);
            const BibleCitationRecoveryMap = new Map<string, string>();

            bibleCitations.forEach((match,index)=>{
                const placeholder = `BIBLE_CITATION_${index}`
                processedContent =  processedContent.slice(0,match.startIndex) + 
                placeholder +" "+ 
                processedContent.slice(match.endIndex + 1);
                BibleCitationRecoveryMap.set(placeholder,match.fullText)
            })

            //console.log(processedContent);

            
            // Extract and replace wiki links
            const matcheList = this.extractWikiLinks(processedContent);

            const linksRecoveryMap = new Map<string, string>();

            // Process matches in reverse order to handle nested links correctly
            matcheList.forEach((match, index) => {
                const placeholder = `[[WIKILINK_${index}]]`; // More unique placeholder
                processedContent = processedContent.slice(0, match.beginIndex) +
                    placeholder +
                    processedContent.slice(match.endIndex + 1);
                linksRecoveryMap.set(placeholder, match.fullText);
            });
            

            //console.log(processedContent)

            const selectedModel = model || 'gpt-4o' as OpenAIModel;
            const maxTokens = MODEL_TOKEN_LIMITS[selectedModel];

            const chunkList = chunkTextByTokens(processedContent, maxTokens, 5);

            console.log("translation initiated")


            new Notice("Translation initiated",5e3)

            console.log("chunkList",chunkList)

            let translatedContent = "";

                // Translate the processed content
            for (var chunk of chunkList) {
                
                let translatedChunck = await this.translateWithOpenAI(
                    chunk,
                    targetLang,
                    customPrompt,
                    model as OpenAIModel
                );
                translatedContent += translatedChunck;
            }


            console.log("translation finished")

            new Notice("Translation finished",5e3)

        

            // Restore wiki links in reverse order
            Array.from(linksRecoveryMap.entries()).forEach(([placeholder, originalLink]) => {
                translatedContent = translatedContent.replace(placeholder, originalLink);
            });

            // Restore the Bible Citations in reverse order 

            Array.from(BibleCitationRecoveryMap.entries()).forEach(([placeholder,bibleCitation])=>{
                //console.log(placeholder,bibleCitation);
                translatedContent = translatedContent.replace(placeholder,bibleCitation);
            });

            // Create new file with translated content
            const newFileName = `${file.parent?.path}/${file.basename}_${targetLang}.${file.extension}`;
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
