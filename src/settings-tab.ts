import { App, PluginSettingTab, Setting } from 'obsidian';
import BibleCitationPlugin from './main';

export class BibleCitationSettingTab extends PluginSettingTab {
    plugin: BibleCitationPlugin;

    constructor(app: App, plugin: BibleCitationPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Bible Meditation Helper Settings' });

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('Enter your OpenAI API key')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openaiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openaiApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('DeepL API Key')
            .setDesc('Enter your DeepL API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.deeplApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.deeplApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Claude API Key')
            .setDesc('Enter your Claude API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.claudeApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.claudeApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Enter your Gemini API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.geminiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.geminiApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Google Translate API Key')
            .setDesc('Enter your Google Translate API key')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.googleTranslateApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.googleTranslateApiKey = value;
                    await this.plugin.saveSettings();
                }));
    }
}