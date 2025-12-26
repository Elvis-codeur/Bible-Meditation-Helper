import { App, Modal, Notice, TextAreaComponent, TextComponent, TFolder, TFile } from "obsidian";
import { TranslationModel, TranslationService } from "./type_definitions";
import { BibleVersion, CitationStyle, InlineQuoteStyle, BibleCitation, mapEnglishToFrenchBibleBooks, mapBibleVersionToLanguage } from './constants';

class BibleCitationVersionChangePromptModal extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;

		// Title
		contentEl.createEl("h2", { text: "Enter the new Bible version : Change the version of your Bible citations in the text" });

		// Description
		const description = contentEl.createEl("p", {
			text: "Choose the bible version to which you want convert your bible citations"
		});
		description.style.marginBottom = "50px";
		description.style.fontStyle = "italic";
		description.style.color = "#667";
		description.style.fontSize = "25px";
		description.style.height = "30px";

		// Select element
		const selectEl = contentEl.createEl("select");
		selectEl.style.padding = "8px";
		selectEl.style.margin = "10px 0";
		selectEl.style.width = "100%";
		selectEl.style.border = "1px solid #ccc";
		selectEl.style.borderRadius = "4px";
		selectEl.style.height = "70px";
		selectEl.style.boxSizing = "border-box";

		const versions = ["ESV", "KJV", "LSG10"];
		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});

		// Submit button
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		submitButton.style.marginTop = "12px";
		submitButton.style.padding = "8px 16px";
		submitButton.style.backgroundColor = "#3a7bfd";
		submitButton.style.color = "#fff";
		submitButton.style.border = "none";
		submitButton.style.borderRadius = "4px";
		submitButton.style.cursor = "pointer";

		submitButton.onmouseenter = () => submitButton.style.backgroundColor = "#245edb";
		submitButton.onmouseleave = () => submitButton.style.backgroundColor = "#3a7bfd";

		// Submit logic
		submitButton.onclick = () => {
			const bibleVersion = selectEl.value.trim();
			this.resolve(bibleVersion || null);
			this.close();
		};

		// Append elements to panel
		contentEl.appendChild(selectEl);
		contentEl.appendChild(submitButton);


	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}




class BibleCitationChangePlainTextCitation extends Modal {
	private resolve: (value: string | null) => void;

	constructor(app: App, resolve: (value: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;

		// Title
		contentEl.createEl("h2", { text: "Enter the Bible version to which you want your plain citations to be cited in" });

		// Description
		const description = contentEl.createEl("p", {
			text: "Choose the bible version in which you want your plain citations to be cited in"
		});
		description.style.marginBottom = "50px";
		description.style.fontStyle = "italic";
		description.style.color = "#667";
		description.style.fontSize = "15px";

		// Select element
		const selectEl = contentEl.createEl("select");
		selectEl.style.padding = "8px";
		selectEl.style.margin = "10px 0";
		selectEl.style.width = "100%";
		selectEl.style.border = "1px solid #ccc";
		selectEl.style.borderRadius = "4px";
		selectEl.style.height = "100px";
		selectEl.style.boxSizing = "border-box";

		const versions = ["ESV", "KJV", "LSG10"];
		versions.forEach(version => {
			const optionEl = selectEl.createEl("option", { text: version });
			optionEl.value = version;
			selectEl.appendChild(optionEl);
		});

		// Submit button
		const submitButton = contentEl.createEl("button", { text: "Submit" });
		submitButton.style.marginTop = "12px";
		submitButton.style.padding = "8px 16px";
		submitButton.style.backgroundColor = "#3a7bfd";
		submitButton.style.color = "#fff";
		submitButton.style.border = "none";
		submitButton.style.borderRadius = "4px";
		submitButton.style.cursor = "pointer";

		submitButton.onmouseenter = () => submitButton.style.backgroundColor = "#245edb";
		submitButton.onmouseleave = () => submitButton.style.backgroundColor = "#3a7bfd";

		// Submit logic
		submitButton.onclick = () => {
			const bibleVersion = selectEl.value.trim();
			this.resolve(bibleVersion || null);
			this.close();
		};

		// Append elements to panel
		contentEl.appendChild(selectEl);
		contentEl.appendChild(submitButton);


	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


class BibleCitationPromptModal extends Modal {
    private resolve: (value: BibleCitation | null) => void;
    private selectedVersion: BibleVersion = BibleVersion.ESV;
    private citationStyle: CitationStyle = CitationStyle.BLOCK;
    private inlineStyle: InlineQuoteStyle = InlineQuoteStyle.ENGLISH;
    private existingCitations: string[] = [];
    private suggestionContainer: HTMLElement | null = null;
    private selectedSuggestionIndex: number = -1;

    constructor(app: App, resolve: (value: BibleCitation | null) => void) {
        super(app);
        this.resolve = resolve;
    }

    async loadExistingCitations(): Promise<void> {
        const citationsFolder = 'Bible-Meditation-Helper/citations';
        const folder = this.app.vault.getAbstractFileByPath(citationsFolder);

        if (folder instanceof TFolder) {
            const filenames = folder.children
                .filter((file) => file instanceof TFile && file.extension === 'md')
                .map((file) => file.name.replace('.md', ''));

            // Create both English and French versions of each citation
            const allCitations: string[] = [];
            filenames.forEach(filename => {
                const englishVersion = this.parseFilenameToReadable(filename, 'en');
                const frenchVersion = this.parseFilenameToReadable(filename, 'fr');

                allCitations.push(englishVersion);
                // Only add French version if it's different from English
                if (frenchVersion !== englishVersion) {
                    allCitations.push(frenchVersion);
                }
            });

            this.existingCitations = allCitations.sort();
        }
    }

    private parseFilenameToReadable(filename: string, languageCode?: string): string {
        // Extract book name and citation parts
        // Examples: "I_Samuel 1_1" -> "I Samuel 1:1" or "1 Samuel 1:1" (French)
        //           "Song_of_Solomon 1_1-2" -> "Song of Solomon 1:1-2" or "Cantique des Cantiques 1:1-2" (French)

        // Split by space to separate book from chapter_verse
        const parts = filename.split(' ');
        if (parts.length < 2) {
            return filename.replace(/_/g, ' ');
        }

        const bookName = parts[0]; // e.g., "I_Samuel"
        let citationPart = parts.slice(1).join(' '); // e.g., "1_1" or "1_1-2"

        // Replace the underscore between chapter and verse with a colon
        // "1_1" -> "1:1", "1_1-2" -> "1:1-2"
        citationPart = citationPart.replace(/_/, ':');

        // Use provided languageCode or fall back to selectedVersion
        const lang = languageCode || (mapBibleVersionToLanguage.get(this.selectedVersion) || 'en');
        let displayBookName = bookName.replace(/_/g, ' '); // Default: replace underscores

        if (lang === 'fr') {
            // Try to get French translation
            const frenchName = mapEnglishToFrenchBibleBooks.get(bookName);
            if (frenchName) {
                displayBookName = frenchName;
            }
        }

        return `${displayBookName} ${citationPart}`;
    }

    async onOpen() {
        const { contentEl } = this;

        // Load existing citations
        await this.loadExistingCitations();

        // Title
        contentEl.createEl("h2", { text: "Enter Bible Citation" });

        // Description
        const description = contentEl.createEl("p", {
            text: "Please enter a Bible verse (e.g., John 3:16) and choose options below.",
        });
        description.style.marginBottom = "12px";
        description.style.fontStyle = "italic";
        description.style.color = "#667";

        // Input container for autocomplete
        const inputContainer = contentEl.createDiv();
        inputContainer.style.position = "relative";
        inputContainer.style.marginBottom = "10px";

        // Input element
        const inputEl = inputContainer.createEl("input", {
            type: "text",
            placeholder: "e.g. John 3:16"
        });
        this.styleInputField(inputEl);

        // Suggestion dropdown
        this.suggestionContainer = inputContainer.createDiv();
        this.suggestionContainer.style.position = "absolute";
        this.suggestionContainer.style.top = "100%";
        this.suggestionContainer.style.left = "0";
        this.suggestionContainer.style.right = "0";
        this.suggestionContainer.style.maxHeight = "200px";
        this.suggestionContainer.style.overflowY = "auto";
        this.suggestionContainer.style.backgroundColor = "var(--background-primary)";
        this.suggestionContainer.style.border = "1px solid var(--background-modifier-border)";
        this.suggestionContainer.style.borderRadius = "4px";
        this.suggestionContainer.style.zIndex = "1000";
        this.suggestionContainer.style.display = "none";
        this.suggestionContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

        // Input event listener for autocomplete
        inputEl.addEventListener("input", () => {
            this.handleInputChange(inputEl);
        });

        // Keyboard navigation for suggestions
        inputEl.addEventListener("keydown", (event) => {
            this.handleKeyNavigation(event, inputEl);
        });

        // Version Cards Container
        const versionsContainer = contentEl.createDiv();
        versionsContainer.style.display = 'flex';
        versionsContainer.style.gap = '10px';
        versionsContainer.style.marginTop = '20px';
        versionsContainer.style.marginBottom = '20px';

        // Create version cards
        const versions = Object.values(BibleVersion);
        versions.forEach(version => {
            const card = this.createVersionCard(version, versionsContainer);
            if (version === this.selectedVersion) {
                card.addClass('selected-version');
            }
        });

        // Citation Style Options
        const styleContainer = contentEl.createDiv();
        styleContainer.style.marginTop = '20px';
        styleContainer.createEl('h3', { text: 'Citation Style' });

        // Citation Style Cards Container
        const styleCardsContainer = contentEl.createDiv();
        styleCardsContainer.style.display = 'flex';
        styleCardsContainer.style.gap = '10px';
        styleCardsContainer.style.marginTop = '10px';
        styleCardsContainer.style.marginBottom = '20px';

        // Create citation style cards
        const blockCard = this.createCitationStyleCard(CitationStyle.BLOCK, 'Block Citation', styleCardsContainer, true);
        const inlineCard = this.createCitationStyleCard(CitationStyle.INLINE, 'Inline Citation', styleCardsContainer, false);

        // Inline Style Options (hidden by default)
        const inlineStyleContainer = contentEl.createDiv();
        inlineStyleContainer.style.marginTop = '10px';
        inlineStyleContainer.style.display = 'none';
        inlineStyleContainer.createEl('h4', { text: 'Quote Style' });

        // Inline Style Cards Container
        const inlineStyleCardsContainer = inlineStyleContainer.createDiv();
        inlineStyleCardsContainer.style.display = 'flex';
        inlineStyleCardsContainer.style.gap = '10px';
        inlineStyleCardsContainer.style.marginTop = '10px';

        // Create inline style cards
        const quotesCard = this.createInlineStyleCard(InlineQuoteStyle.ENGLISH, 'English ("...")', inlineStyleCardsContainer, true);
        const guillemetsCard = this.createInlineStyleCard(InlineQuoteStyle.FRENCH, 'French (« ... »)', inlineStyleCardsContainer, false);

        // Store reference for showing/hiding
        blockCard.addEventListener('click', () => {
            inlineStyleContainer.style.display = 'none';
        });

        inlineCard.addEventListener('click', () => {
            inlineStyleContainer.style.display = 'block';
        });

        contentEl.appendChild(inlineStyleContainer);

        // Submit button
        const submitButton = this.createSubmitButton();
        submitButton.onclick = () => {
            const reference = inputEl.value.trim();
            if (!reference) {
                new Notice('Please enter a Bible reference');
                return;
            }
            
            const citation = this.formatCitation(reference);
            this.resolve(citation);
            this.close();
        };

        // Keyboard shortcut (Enter) - only submit if suggestions are not visible
        inputEl.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                // Only submit if suggestions are not visible or no suggestion is selected
                if (!this.suggestionContainer ||
                    this.suggestionContainer.style.display === 'none' ||
                    this.selectedSuggestionIndex === -1) {
                    submitButton.click();
                }
            }
        });

        // Append elements
        contentEl.appendChild(submitButton);
    }

    private styleInputField(inputEl: HTMLInputElement) {
        inputEl.style.padding = "8px";
        inputEl.style.marginBottom = "10px";
        inputEl.style.width = "100%";
        inputEl.style.border = "1px solid #ccc";
        inputEl.style.borderRadius = "4px";
        inputEl.style.boxSizing = "border-box";
        inputEl.style.height = "40px";
        inputEl.focus();
    }

    private createVersionCard(version: BibleVersion, container: HTMLElement): HTMLElement {
        const card = container.createDiv({ cls: 'version-card' });
        card.setText(version);
        card.style.padding = '15px 25px';
        card.style.border = '1px solid #ccc';
        card.style.borderRadius = '4px';
        card.style.cursor = 'pointer';
        card.style.backgroundColor = version === this.selectedVersion ? '#3a7bfd' : '#fff';
        card.style.color = version === this.selectedVersion ? '#fff' : '#000';

        card.addEventListener('click', () => {
            container.findAll('.version-card').forEach(c => {
                c.style.backgroundColor = '#fff';
                c.style.color = '#000';
            });
            card.style.backgroundColor = '#3a7bfd';
            card.style.color = '#fff';
            this.selectedVersion = version;
        });

        return card;
    }

    private createCitationStyleCard(style: CitationStyle, label: string, container: HTMLElement, selected: boolean): HTMLElement {
        const card = container.createDiv({ cls: 'citation-style-card' });
        card.setText(label);
        card.style.padding = '15px 25px';
        card.style.border = '1px solid #ccc';
        card.style.borderRadius = '4px';
        card.style.cursor = 'pointer';
        card.style.backgroundColor = selected ? '#3a7bfd' : '#fff';
        card.style.color = selected ? '#fff' : '#000';

        card.addEventListener('click', () => {
            container.findAll('.citation-style-card').forEach(c => {
                c.style.backgroundColor = '#fff';
                c.style.color = '#000';
            });
            card.style.backgroundColor = '#3a7bfd';
            card.style.color = '#fff';
            this.citationStyle = style;
        });

        return card;
    }

    private createInlineStyleCard(style: InlineQuoteStyle, label: string, container: HTMLElement, selected: boolean): HTMLElement {
        const card = container.createDiv({ cls: 'inline-style-card' });
        card.setText(label);
        card.style.padding = '15px 25px';
        card.style.border = '1px solid #ccc';
        card.style.borderRadius = '4px';
        card.style.cursor = 'pointer';
        card.style.backgroundColor = selected ? '#3a7bfd' : '#fff';
        card.style.color = selected ? '#fff' : '#000';

        card.addEventListener('click', () => {
            container.findAll('.inline-style-card').forEach(c => {
                c.style.backgroundColor = '#fff';
                c.style.color = '#000';
            });
            card.style.backgroundColor = '#3a7bfd';
            card.style.color = '#fff';
            this.inlineStyle = style;
        });

        return card;
    }

    private createRadioOption(
        container: HTMLElement, 
        name: string, 
        value: CitationStyle | InlineQuoteStyle, 
        label: string, 
        checked = false
    ): HTMLInputElement {
        const wrapper = container.createDiv();
        wrapper.style.marginBottom = '8px';

        const radio = wrapper.createEl('input', {
            type: 'radio',
            attr: { name, value, checked }
        });
        radio.style.marginRight = '8px';

        wrapper.createEl('label', { text: label });

        return radio;
    }

    private createSubmitButton(): HTMLButtonElement {
        const submitButton = createEl("button", { text: "Submit" });
        submitButton.style.marginTop = "12px";
        submitButton.style.padding = "8px 16px";
        submitButton.style.backgroundColor = "#3a7bfd";
        submitButton.style.color = "#fff";
        submitButton.style.border = "none";
        submitButton.style.borderRadius = "4px";
        submitButton.style.cursor = "pointer";

        submitButton.onmouseenter = () => submitButton.style.backgroundColor = "#245edb";
        submitButton.onmouseleave = () => submitButton.style.backgroundColor = "#3a7bfd";

        return submitButton;
    }

    private formatCitation(reference: string): BibleCitation {

        let fullText: string = `${reference}||${this.selectedVersion}`;

        return {
            reference,
            version: this.selectedVersion,
            style: this.citationStyle,
            inlineStyle: this.citationStyle === CitationStyle.INLINE ? this.inlineStyle : undefined,
            fullText,// Always "reference||version" format
        };
    }

    private handleInputChange(inputEl: HTMLInputElement): void {
        const inputValue = inputEl.value.trim().toLowerCase();

        if (!this.suggestionContainer) return;

        // Clear previous suggestions
        this.suggestionContainer.empty();
        this.selectedSuggestionIndex = -1;

        // If input is empty, hide suggestions
        if (!inputValue) {
            this.suggestionContainer.style.display = 'none';
            return;
        }

        // Filter citations that match the input
        const filteredCitations = this.existingCitations.filter(citation =>
            citation.toLowerCase().includes(inputValue)
        );

        // If no matches, hide suggestions
        if (filteredCitations.length === 0) {
            this.suggestionContainer.style.display = 'none';
            return;
        }

        // Display filtered suggestions (limit to 10 for performance)
        const limitedCitations = filteredCitations.slice(0, 10);
        limitedCitations.forEach((citation, index) => {
            const suggestionItem = this.suggestionContainer!.createDiv();
            suggestionItem.setText(citation);
            suggestionItem.style.padding = '8px 12px';
            suggestionItem.style.cursor = 'pointer';
            suggestionItem.style.borderBottom = '1px solid var(--background-modifier-border)';

            // Hover effect
            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.backgroundColor = 'var(--background-modifier-hover)';
            });
            suggestionItem.addEventListener('mouseleave', () => {
                if (index !== this.selectedSuggestionIndex) {
                    suggestionItem.style.backgroundColor = 'transparent';
                }
            });

            // Click handler
            suggestionItem.addEventListener('click', () => {
                inputEl.value = citation;
                this.suggestionContainer!.style.display = 'none';
                inputEl.focus();
            });

            // Store reference for keyboard navigation
            suggestionItem.setAttribute('data-index', index.toString());
        });

        this.suggestionContainer.style.display = 'block';
    }

    private handleKeyNavigation(event: KeyboardEvent, inputEl: HTMLInputElement): void {
        if (!this.suggestionContainer || this.suggestionContainer.style.display === 'none') {
            return;
        }

        const suggestions = this.suggestionContainer.querySelectorAll('div');
        const suggestionsCount = suggestions.length;

        if (suggestionsCount === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % suggestionsCount;
                this.updateSuggestionSelection(suggestions);
                break;

            case 'ArrowUp':
                event.preventDefault();
                this.selectedSuggestionIndex = (this.selectedSuggestionIndex - 1 + suggestionsCount) % suggestionsCount;
                this.updateSuggestionSelection(suggestions);
                break;

            case 'Enter':
                if (this.selectedSuggestionIndex >= 0) {
                    event.preventDefault();
                    const selectedSuggestion = suggestions[this.selectedSuggestionIndex];
                    inputEl.value = selectedSuggestion.getText();
                    this.suggestionContainer.style.display = 'none';
                    this.selectedSuggestionIndex = -1;
                }
                break;

            case 'Escape':
                event.preventDefault();
                this.suggestionContainer.style.display = 'none';
                this.selectedSuggestionIndex = -1;
                break;
        }
    }

    private updateSuggestionSelection(suggestions: NodeListOf<Element>): void {
        suggestions.forEach((suggestion, index) => {
            const htmlSuggestion = suggestion as HTMLElement;
            if (index === this.selectedSuggestionIndex) {
                htmlSuggestion.style.backgroundColor = 'var(--background-modifier-hover)';
                htmlSuggestion.scrollIntoView({ block: 'nearest' });
            } else {
                htmlSuggestion.style.backgroundColor = 'transparent';
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}




class TranslationModal extends Modal {
	private bibleVersions = ['LSG10', 'ESV', 'KJV'];

	private result: {
		service: TranslationService;
		targetLang: string;
		customPrompt?: string;
		model?: TranslationModel;
		bibleVersion:string;
	};

	private onSubmit: (result: {
		service: TranslationService;
		targetLang: string;
		customPrompt?: string;
		openAIModel?: TranslationModel;
		bibleVersion:string;

	}) => void;

	constructor(app: App, onSubmit: (result: {
		bibleVersion: string;
		service: TranslationService;
		targetLang: string;
		customPrompt?: string;
		iaModel?: TranslationModel;
	}) => void,
		private savedPrompts: string[] = [] // pass from plugin

	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h3', { text: 'Translation Settings' });

		// Helper to create consistent form groups
		const createFormGroup = (labelText: string, element: HTMLElement) => {
			const group = contentEl.createDiv({ cls: 'translation-form-group' });
			group.createEl('label', { text: labelText });
			group.appendChild(element);
			group.setAttr('style', 'margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px;');
		};

		// Service selection
		const serviceSelect = createEl('select', {
			attr: { style: 'padding: 6px; font-size: 14px; width: 100%;' }
		});
		['chatgpt', 'claude', 'gemini', 'google', 'deepl'].forEach(service => {
			serviceSelect.createEl('option', { text: service, value: service });
		});
		createFormGroup('Translation Service', serviceSelect);

		// Model selection (dynamic)
		const modelContainer = contentEl.createDiv({ attr: { style: 'margin-bottom: 16px;' } });
		const modelLabel = modelContainer.createEl('label', { text: 'Model' });
		modelLabel.setAttr('style', 'margin-bottom: 4px; display: block;');
		const modelSelect = modelContainer.createEl('select', {
			attr: { style: 'padding: 6px; font-size: 14px; width: 100%;' }
		});
		modelContainer.style.display = 'none'; // Hidden initially

		// Model list by service
		const modelsByService: Record<TranslationService, TranslationModel[]> = {
			chatgpt: [
				'gpt-4',
				'gpt-4o',
				'o1',
				'o3',
				'gpt-3.5-turbo',
				'gpt-4-0125-preview',
				'gpt-4-turbo-preview',
				'gpt-4-1106-preview',
			],
			claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
			gemini: ['gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemma-7b', 'gemma-2b'],
			google: [],
			deepl: []
		};

		const updateModelOptions = (service: TranslationService) => {
			modelSelect.innerHTML = '';
			const models = modelsByService[service];
			if (models.length > 0) {
				modelContainer.style.display = 'block';
				models.forEach(model => {
					const option = modelSelect.createEl('option', {
						text: model,
						value: model
					});
					if (service === 'chatgpt' && model === 'gpt-4') {
						option.selected = true;
					}
				});
			} else {
				modelContainer.style.display = 'none';
			}
		};

		serviceSelect.addEventListener('change', () => {
			updateModelOptions(serviceSelect.value as TranslationService);
		});
		updateModelOptions(serviceSelect.value as TranslationService);

		// Append model container only once
		contentEl.appendChild(modelContainer);

		// Target language input
		const langInput = new TextComponent(contentEl);
		langInput.setPlaceholder('e.g., fr, es, de');
		langInput.inputEl.style.padding = '6px';
		langInput.inputEl.style.fontSize = '14px';
		langInput.inputEl.style.width = '100%';
		createFormGroup('Target Language', langInput.inputEl);


		// Bible version checkbox and dropdown
		const bibleVersionCheckbox = contentEl.createEl('input', {
			type: 'checkbox'
		});
		bibleVersionCheckbox.setAttr('style', 'margin-right: 8px;');

		const bibleVersionLabel = contentEl.createDiv();
		bibleVersionLabel.setAttr('style', 'display: flex; align-items: center; margin-bottom: 8px;');
		bibleVersionLabel.appendChild(bibleVersionCheckbox);
		bibleVersionLabel.createEl('span', { text: 'Include Bible Version' });

		contentEl.appendChild(bibleVersionLabel);

		// Bible version dropdown (hidden by default)
		const bibleVersionSelect = contentEl.createEl('select', {
			attr: { style: 'padding: 6px; font-size: 14px; width: 100%; margin-bottom: 16px;' }
		});
		this.bibleVersions.forEach(version => {
			bibleVersionSelect.createEl('option', { text: version, value: version });
		});
		bibleVersionSelect.style.display = 'none';
		contentEl.appendChild(bibleVersionSelect);

		// Toggle visibility on checkbox change
		bibleVersionCheckbox.addEventListener('change', () => {
			bibleVersionSelect.style.display = bibleVersionCheckbox.checked ? 'block' : 'none';
		});



		// Prompt selector
		contentEl.createEl('label', { text: 'Choose Saved Prompt' });
		const promptSelect = contentEl.createEl('select');
		promptSelect.createEl('option', { text: '-- Select a saved prompt --', value: '' });

		this.savedPrompts.forEach((prompt, i) => {
			promptSelect.createEl('option', {
				text: prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt,
				value: i.toString()
			});
		});

		// Update prompt input to be set dynamically:

		const promptInput = new TextAreaComponent(contentEl)
			.setPlaceholder('Enter custom translation instructions');

		// Add styles
		promptInput.inputEl.style.width = '100%';          // full width
		promptInput.inputEl.style.minHeight = '80px';      // taller textarea
		promptInput.inputEl.style.resize = 'vertical';     // allow vertical resize only
		promptInput.inputEl.style.padding = '8px';         // some padding
		promptInput.inputEl.style.fontSize = '14px';       // readable font size
		promptInput.inputEl.style.borderRadius = '4px';    // rounded corners
		promptInput.inputEl.style.border = '1px solid #ccc'; // subtle border
		promptInput.inputEl.style.marginTop = '8px';       // spacing above textarea

		promptSelect.addEventListener('change', () => {
			const selected = promptSelect.value;
			if (selected !== '') {
				promptInput.setValue(this.savedPrompts[parseInt(selected)]);
			}
		});



		// Submit button
		const submitBtn = contentEl.createEl('button', {
			text: 'Translate',
			cls: 'mod-cta'
		});
		submitBtn.setAttr('style', 'margin-top: 12px; padding: 8px 16px; font-size: 14px;');

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

			const service = serviceSelect.value as TranslationService;
			const model = modelSelect.value as TranslationModel;

			try {
				this.result = {
					service,
					targetLang,
					customPrompt: promptInput.getValue(),
					model: modelsByService[service].length > 0 ? model : undefined,
					bibleVersion: bibleVersionCheckbox.checked ? bibleVersionSelect.value : ""
				};
				this.onSubmit(this.result);
				this.close();
			} catch (error) {
				console.error('Translation error:', error);
				new Notice(`Translation failed: ${error.message}`);
			}
		};

		contentEl.appendChild(submitBtn);
	}


	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}




export {
	BibleCitationPromptModal,
	BibleCitationVersionChangePromptModal,
	TranslationModal,
	BibleCitationChangePlainTextCitation
}
