# Bible Meditation Helper - Technical Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Core Modules](#core-modules)
4. [Data Architecture](#data-architecture)
5. [Citation Processing Flow](#citation-processing-flow)
6. [Translation System](#translation-system)
7. [Text Processing Algorithms](#text-processing-algorithms)
8. [API Integration](#api-integration)
9. [Type System](#type-system)
10. [Build and Deployment](#build-and-deployment)

---

## System Overview

### Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript 4.7.4
- **Build Tool**: esbuild 0.17.3
- **Plugin Framework**: Obsidian API (latest)
- **Package Manager**: npm

### Architecture Pattern
- **Plugin Type**: Obsidian Community Plugin
- **Design Pattern**: Modular, Service-Oriented
- **Data Storage**: File-based (no database)
- **State Management**: Obsidian Plugin Settings API

### Key Dependencies
```json
{
  "dependencies": {
    "@google-cloud/translate": "^9.1.0",
    "axios": "^1.7.9",
    "cheerio": "^1.0.0",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "iconv-lite": "^0.6.3",
    "js-levenshtein": "^1.1.6",
    "openai": "^5.3.0",
    "puppeteer": "^24.2.1"
  }
}
```

---

## Project Structure

### Directory Layout
```
Bible-Meditation-Helper/
├── src/
│   ├── main.ts                    # Plugin entry point
│   ├── bible_citation_getter.ts   # Citation fetching logic
│   ├── translate_not.ts           # Translation service
│   ├── text_manipulations.ts      # Text processing utilities
│   ├── prompt_modals.ts           # UI modal components
│   ├── settings-tab.ts            # Settings interface
│   ├── constants.ts               # Configuration constants
│   ├── type_definitions.ts        # TypeScript interfaces
│   ├── table_of_citations.ts      # Citation table generation
│   └── js-levenshtein.d.ts        # Type declarations
├── data/
│   └── Bible/
│       └── {language}/
│           └── {version}/
│               └── by_chapter/
│                   └── {book}/
│                       └── Chapter_{number}.md
├── styles/
│   └── citation_callout_style.css
├── docs/
│   ├── DEVELOPMENT_HISTORY.md
│   ├── FUNCTIONALITIES.md
│   └── TECHNICAL_ARCHITECTURE.md
├── manifest.json
├── package.json
├── tsconfig.json
└── esbuild.config.mjs
```

### Build Output
- **main.js**: Bundled plugin code
- **manifest.json**: Plugin metadata
- **styles.css**: Global styles (if used)

---

## Core Modules

### 1. main.ts - Plugin Entry Point

**Responsibility**: Plugin lifecycle management and command registration

**Key Class**: `BibleCitationPlugin`

**Lifecycle Methods**:
```typescript
async onload() {
  await this.loadSettings();
  this.addSettingTab(new BibleCitationSettingTab(this.app, this));
  this.registerCommands();
  this.loadStyles();
}
```

**Registered Commands**:
1. `create-bible-citation` (Ctrl+J)
2. `change-bible-citation-version` (Ctrl+M)
3. `convert-plain-citation-to-plugging-citations` (Alt+M)
4. `translate-note` (Ctrl+T)

**Settings Management**:
```typescript
interface BibleCitationPluginSettings {
  openaiApiKey: string;
  claudeApiKey: string;
  geminiApiKey: string;
  deeplApiKey: string;
  googleTranslateApiKey: string;
  customTranslationPrompts: string[];
  translationsOutputFolder: string;
}
```

---

### 2. bible_citation_getter.ts - Citation Engine

**Responsibility**: Bible text retrieval, citation formatting, and version conversion

**Key Class**: `BibleCitationGetter`

**Core Methods**:

#### Citation Retrieval
```typescript
async getCitation(text: string): Promise<{ citation: string, result: any }>
```
**Flow**:
1. Parse input: `Book Chapter:Verse || VERSION`
2. Normalize book name using Levenshtein distance
3. Read Bible text from file system
4. Extract requested verses
5. Format as Obsidian callout
6. Create citation file with wikilink
7. Return formatted citation

#### Parsing Logic
```typescript
// Extract book and chapter
for (let i = 0; i < book_and_chapter.length; i++) {
  if (isInteger(book_and_chapter[i]) && i != 0) {
    book = book_and_chapter.substring(0, i);
    chapter = book_and_chapter.substring(i);
    break;
  }
}

// Extract verse range
let verse_indice_inf = citation[1].split("-")[0];
let verse_indice_sup = citation[1].split("-").length > 1
  ? citation[1].split("-")[1]
  : "";
```

#### Version Conversion
```typescript
async function changeBibleCitationVersionInText(
  content: string,
  newBibleCitationVersion: string
): Promise<string>
```
**Flow**:
1. Extract all existing citations using regex
2. Parse each citation reference
3. Fetch verses in new version
4. Replace old citations with new ones
5. Return updated content

#### Plain Text Detection
```typescript
async function convertPlainCitationsToPluggingCitationsInText(
  content: string,
  newBibleCitationVersion: string
): Promise<string>
```
**Regex Pattern**:
```typescript
const BibleCitationRegex =
  /\b(?:[1-3]?\s?[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿa-zà-ÿ]+)*)
    (?:\s+\d{1,3}(?::\d{1,3})?(?:-\d{1,3})?)\b/g;
```

**Processing**:
1. Split content by lines
2. Skip callout lines (starting with `>`)
3. Skip list lines (starting with `-`, `+`)
4. Apply regex to detect citations
5. Convert matches to full citations
6. Reconstruct document

---

### 3. translate_not.ts - Translation Service

**Responsibility**: Multi-service translation with Bible citation handling

**Key Class**: `TranslateNotes`

**Supported Services**:
```typescript
type TranslationService =
  'claude' | 'chatgpt' | 'gemini' | 'google' | 'deepl';
```

**Service Implementations**:

#### OpenAI (ChatGPT)
```typescript
private async translateWithOpenAI(
  content: string,
  targetLang: string,
  customPrompt?: string,
  model?: OpenAIModel
): Promise<string>
```
**Features**:
- Multiple model support (GPT-3.5, GPT-4, GPT-4o, o1, o3)
- Custom system prompts
- Token limit handling
- Chunking for large documents

#### Anthropic (Claude)
```typescript
private async translateWithClaude(
  content: string,
  targetLang: string,
  customPrompt?: string,
  model?: ClaudeModel
): Promise<string>
```
**Features**:
- Claude 3 model variants (Opus, Sonnet, Haiku)
- Large context windows (up to 200K tokens)
- High-quality theological translation

#### Google (Gemini)
```typescript
private async translateWithGemini(
  content: string,
  targetLang: string,
  customPrompt?: string,
  model?: GeminiModel
): Promise<string>
```
**Features**:
- Massive context window (1M tokens for 1.5 models)
- Fast processing
- Cost-effective for long documents

#### DeepL
```typescript
private async translateWithDeepL(
  content: string,
  targetLang: string
): Promise<string>
```
**Features**:
- Professional translation quality
- Excellent for European languages
- Simple API (no model selection)

#### Google Translate
```typescript
private async translateWithGoogleTranslate(
  content: string,
  targetLang: string
): Promise<string>
```
**Features**:
- Wide language support
- Fast and economical
- Legacy support

**Translation Flow**:
```typescript
async translateNote(
  file: TFile,
  service: TranslationService,
  targetLang: string,
  bibleVersion?: string,
  customPrompt?: string,
  model?: TranslationModel
): Promise<void>
```

1. Read source file content
2. Extract Bible citations
3. Translate non-citation text
4. Convert citations to target Bible version
5. Reassemble content
6. Create new file with translated content
7. Preserve formatting and structure

---

### 4. text_manipulations.ts - Text Processing

**Responsibility**: String manipulation and pattern matching utilities

**Key Functions**:

#### Book Name Normalization
```typescript
function findClosestBookName(
  input: string,
  validBooks: string[]
): string | null
```
**Algorithm**: Levenshtein distance
**Purpose**: Typo correction in book names
**Example**: `"Jhon"` → `"John"`, `"Gensis"` → `"Genesis"`

#### Text Chunking
```typescript
function chunkTextByTokens(
  text: string,
  maxTokens: number
): string[]
```
**Purpose**: Split large documents for API token limits
**Strategy**: Paragraph-aware splitting to maintain context
**Usage**: Translation of documents exceeding model limits

#### Callout Detection
```typescript
function findCalloutsWithIndices(
  markdown: string
): CalloutBlock[]
```
**Purpose**: Locate and extract callout blocks
**Returns**:
```typescript
interface CalloutBlock {
  text: string;
  startIndex: number;
  endIndex: number;
}
```

---

### 5. prompt_modals.ts - User Interface

**Responsibility**: Modal dialogs for user interaction

**Modal Classes**:

#### BibleCitationPromptModal
```typescript
class BibleCitationPromptModal extends Modal
```
**Purpose**: Input citation reference
**Input**: `Book Chapter:Verse || VERSION`
**Output**: Citation string for processing

#### BibleCitationVersionChangePromptModal
```typescript
class BibleCitationVersionChangePromptModal extends Modal
```
**Purpose**: Select Bible version for conversion
**Input**: Version dropdown selection
**Output**: Selected version code

#### BibleCitationChangePlainTextCitation
```typescript
class BibleCitationChangePlainTextCitation extends Modal
```
**Purpose**: Select version for plain text conversion
**Input**: Version dropdown selection
**Output**: Selected version code

#### TranslationModal
```typescript
class TranslationModal extends Modal
```
**Purpose**: Configure translation parameters
**Inputs**:
- Translation service
- Target language
- Bible version (optional)
- Custom prompt (optional)
- AI model (for AI services)
**Output**: Translation configuration object

---

### 6. settings-tab.ts - Configuration UI

**Responsibility**: Plugin settings management

**Key Class**: `BibleCitationSettingTab`

**Settings Sections**:

1. **API Keys Configuration**
   - OpenAI API Key (text input, password type)
   - Claude API Key (text input, password type)
   - Gemini API Key (text input, password type)
   - DeepL API Key (text input, password type)
   - Google Translate API Key (text input, password type)

2. **Translation Settings**
   - Output folder path
   - Custom prompt management (add, edit, delete)

**Persistence**:
```typescript
async saveSettings() {
  await this.plugin.saveData(this.settings);
}

async loadSettings() {
  this.settings = Object.assign(
    DEFAULT_SETTINGS,
    await this.plugin.loadData()
  );
}
```

---

### 7. constants.ts - Configuration Data

**Responsibility**: Centralized configuration and mappings

**Key Constants**:

#### Plugin Configuration
```typescript
const pluginCallout = "[!bible-meditation-helper-citation]";
const defaultCitationFolder = "Bible-Meditation-Helper/citations";
```

#### Bible Book Mappings
```typescript
export const mapBibleBookAbbrevToBibleBooks = new Map<string, string>([
  ["gen", "Genesis"],
  ["ex", "Exodus"],
  ["matt", "Matthew"],
  ["rom", "Romans"],
  ["1cor", "I_Corinthians"],
  // ... 200+ mappings for English, French, full names
]);
```

#### Version to Language Mappings
```typescript
export const mapBibleVersionToLanguage = new Map<string, string>([
  ["ESV", "en"],
  ["NIV", "en"],
  ["LSG", "fr"],
  ["RVR1960", "es"],
  ["ARC", "pt"],
  // ... 30+ version mappings
]);
```

#### Book Order Mappings
```typescript
export const mapBibleBookToNumericalOrder = new Map<string, number>([
  ["Genesis", 0],
  ["Exodus", 1],
  // ... 66 books
  ["Revelation_of_John", 65]
]);
```

#### French Translation Mappings
```typescript
export const mapEnglishToFrenchBibleBooks = new Map<string, string>([
  ["Genesis", "Genèse"],
  ["Exodus", "Exode"],
  ["Matthew", "Matthieu"],
  // ... full Bible book translations
]);
```

---

## Data Architecture

### Bible Text Storage

#### Directory Structure
```
data/Bible/
├── en/                  # English language
│   ├── ESV/
│   │   └── by_chapter/
│   │       ├── 01_Genesis/
│   │       │   ├── Chapter_01.md
│   │       │   ├── Chapter_02.md
│   │       │   └── ...
│   │       ├── 02_Exodus/
│   │       └── ...
│   ├── NIV/
│   ├── KJV/
│   └── ...
├── fr/                  # French language
│   ├── LSG/
│   ├── LSG10/
│   └── ...
├── es/                  # Spanish language
└── pt/                  # Portuguese language
```

#### File Naming Convention
- Book folders: `{order}_{BookName}/`
  - Example: `01_Genesis/`, `40_Matthew/`
- Chapter files: `Chapter_{number}.md`
  - Example: `Chapter_01.md`, `Chapter_10.md`
  - Always 2 digits for chapter number

#### File Format
```markdown
# Genesis 1 (ESV)

1. In the beginning, God created the heavens and the earth.

2. The earth was without form and void...

3. And God said, "Let there be light"...
```

**Structure**:
- Line 1: Chapter heading with version
- Blank line
- Verses in numbered format: `{number}. {text}`

### Citation File System

#### Storage Location
```
{Vault}/Bible-Meditation-Helper/citations/
```

#### File Creation
**When**: Every time a citation is created
**Naming**: `{Book} {Chapter}_{Verse(s)}.md`
**Content**: Initially empty (user can add notes)

**Examples**:
- `John 3_16.md`
- `Romans 8_28-30.md`
- `Psalms 23_1-6.md`

#### Purpose
1. **Backlinks**: See where verses are referenced across vault
2. **Personal Notes**: Add reflections to citation files
3. **Concordance**: Build personal Bible concordance
4. **Organization**: Centralized citation management

---

## Citation Processing Flow

### 1. Citation Creation Flow

```
User Input (Ctrl+J)
    ↓
Modal: Enter Citation Reference
    ↓
Input: "John 3:16 || ESV"
    ↓
Parse Citation:
  - Book: "John"
  - Chapter: 3
  - Verse: 16
  - Version: "ESV"
    ↓
Normalize Book Name (Levenshtein)
    ↓
Map to File System:
  - Language: "en" (from version)
  - Folder: "43_John"
  - File: "Chapter_03.md"
    ↓
Read File from Disk
    ↓
Parse Verses (numbered pattern)
    ↓
Extract Verse 16
    ↓
Format as Callout:
  >[!bible-meditation-helper-citation] [[John 3_16|John 3:16 | ESV]]
  >**16** For God so loved...
    ↓
Create Citation File (if not exists)
    ↓
Insert at Cursor Position
    ↓
Render in Obsidian
```

### 2. Version Change Flow

```
User Command (Ctrl+M)
    ↓
Modal: Select New Version
    ↓
User Selects: "NIV"
    ↓
Scan Document for Citations
  Regex: />\[!bible-meditation-helper-citation].*?\[\[([^\]]+)\]\]/g
    ↓
For Each Citation:
  - Extract reference: "John 3:16"
  - Parse book, chapter, verses
    ↓
  Fetch New Version:
    - Map "NIV" → "en"
    - Read from NIV folder
    - Extract same verses
    ↓
  Format New Citation:
    - Same structure
    - New verse text
    - New version indicator
    ↓
  Replace Old Citation
    ↓
Save Document
```

### 3. Plain Text Conversion Flow

```
User Command (Alt+M)
    ↓
Modal: Select Bible Version
    ↓
User Selects: "ESV"
    ↓
Split Document by Lines
    ↓
For Each Line:
  Is it a callout (starts with >)? → Skip
  Is it a list (starts with -, +)? → Skip
  Matches citation regex? → Process
    ↓
  Process Line:
    - Detect: "John 3:16"
    - Create citation reference: "John 3:16 || ESV"
    - Call getCitation()
    - Replace line with full citation
    ↓
Reassemble Document
    ↓
Save Changes
```

---

## Translation System

### Architecture

```
TranslateNotes Class
├── Service Layer
│   ├── OpenAI Integration
│   ├── Claude Integration
│   ├── Gemini Integration
│   ├── DeepL Integration
│   └── Google Translate Integration
├── Citation Extraction
│   └── extractBibleCitations()
├── Text Chunking
│   └── chunkTextByTokens()
└── Content Reassembly
    └── mergeCitationsAndTranslation()
```

### Translation Process Detail

```
1. Read Source File
    ↓
2. Extract Bible Citations
   - Identify callout blocks
   - Store citations separately
   - Replace with placeholders
    ↓
3. Prepare Text for Translation
   - Remove citations
   - Keep formatting markers
    ↓
4. Check Token Limit
   - Calculate tokens
   - If > limit: Chunk text
    ↓
5. Translate Each Chunk
   API Call:
   {
     "model": selected_model,
     "messages": [{
       "role": "system",
       "content": custom_prompt || default_prompt
     }, {
       "role": "user",
       "content": text_chunk
     }]
   }
    ↓
6. Convert Bible Citations
   - Extract original citation reference
   - Parse book, chapter, verses
   - Map to target Bible version
   - Fetch verses in target language
   - Format with target language book names
    ↓
7. Reassemble Content
   - Insert translated text
   - Insert converted citations
   - Preserve structure
    ↓
8. Create Output File
   - Name: "{original} (Translated to {lang}).md"
   - Location: configured output folder
   - Content: fully translated note
    ↓
9. Notify User
   - Success or error message
```

### API Request Examples

#### OpenAI Request
```typescript
const response = await openai.chat.completions.create({
  model: model || 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: customPrompt ||
        `Translate to ${targetLang}. Preserve markdown.`
    },
    {
      role: 'user',
      content: textChunk
    }
  ],
  temperature: 0.3
});
```

#### DeepL Request
```typescript
const response = await requestUrl({
  url: 'https://api-free.deepl.com/v2/translate',
  method: 'POST',
  headers: {
    'Authorization': `DeepL-Auth-Key ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: [content],
    target_lang: targetLang.toUpperCase()
  })
});
```

---

## Text Processing Algorithms

### 1. Levenshtein Distance Implementation

**Purpose**: Calculate edit distance for typo correction

**Algorithm**:
```typescript
import levenshtein from 'js-levenshtein';

function findClosestBookName(
  input: string,
  validBooks: string[]
): string | null {
  let minDistance = Infinity;
  let closest = null;

  for (const book of validBooks) {
    const distance = levenshtein(
      input.toLowerCase(),
      book.toLowerCase()
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = book;
    }
  }

  // Accept if within reasonable threshold
  return minDistance <= 2 ? closest : null;
}
```

**Examples**:
- `"Jhon"` → `"John"` (distance: 1)
- `"Gensis"` → `"Genesis"` (distance: 1)
- `"Romns"` → `"Romans"` (distance: 1)

### 2. Verse Extraction Algorithm

**Purpose**: Extract specific verses from chapter text

**Algorithm**:
```typescript
function splitTextByNumberedPattern(text: string): string[] {
  // Split on pattern: number followed by dot and space
  return text.split(/(?=\b\d+\.\s)/g);
}

function extractVerses(
  chapterText: string,
  startVerse: number,
  endVerse: number
): Verse[] {
  const verses = splitTextByNumberedPattern(chapterText);
  const result = [];

  for (const line of verses) {
    if (!line.contains(".")) continue;

    const verseNum = parseInt(
      line.slice(0, line.indexOf("."))
    );

    if (verseNum >= startVerse && verseNum <= endVerse) {
      result.push({
        number: verseNum,
        text: line.slice(line.indexOf(".") + 1).trim()
      });
    }
  }

  return result;
}
```

### 3. Callout Detection Algorithm

**Purpose**: Find callout blocks with positions

**Algorithm**:
```typescript
function findCalloutsWithIndices(markdown: string): CalloutBlock[] {
  const lines = markdown.split('\n');
  const results: CalloutBlock[] = [];

  let insideCallout = false;
  let calloutStartLine = 0;
  let currentCalloutLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!insideCallout) {
      // Detect callout start: >[!type] ...
      if (/^\s{0,3}>\s*\[!\w+.*?\]/.test(line)) {
        insideCallout = true;
        calloutStartLine = i;
        currentCalloutLines = [line];
      }
    } else {
      // Continue if line starts with >
      if (/^\s{0,3}>\s?.*/.test(line)) {
        currentCalloutLines.push(line);
      } else {
        // End of callout
        const startIndex = getLineOffset(markdown, calloutStartLine);
        const endIndex = getLineOffset(markdown, i);

        results.push({
          text: currentCalloutLines.join('\n'),
          startIndex,
          endIndex
        });

        insideCallout = false;
      }
    }
  }

  return results;
}
```

---

## API Integration

### OpenAI Integration

**SDK**: `openai` version 5.3.0

**Initialization**:
```typescript
const openai = new OpenAI({
  apiKey: this.settings.openaiApiKey
});
```

**Usage**:
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  temperature: 0.3
});

const translated = completion.choices[0].message.content;
```

### Anthropic Integration

**API**: Direct HTTP requests to Anthropic API

**Endpoint**: `https://api.anthropic.com/v1/messages`

**Request Format**:
```typescript
const response = await requestUrl({
  url: 'https://api.anthropic.com/v1/messages',
  method: 'POST',
  headers: {
    'anthropic-version': '2023-06-01',
    'x-api-key': this.settings.claudeApiKey,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [...]
  })
});
```

### Google AI Integration

**SDK**: Google Generative AI (Gemini)

**Initialization**:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  this.settings.geminiApiKey
);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro'
});
```

### DeepL Integration

**API**: DeepL Translation API v2

**Endpoint**: `https://api-free.deepl.com/v2/translate`

**Authentication**: Header-based
```typescript
'Authorization': `DeepL-Auth-Key ${apiKey}`
```

---

## Type System

### Core Interfaces

#### BibleCitationPluginSettings
```typescript
interface BibleCitationPluginSettings {
  openaiApiKey: string;
  claudeApiKey: string;
  geminiApiKey: string;
  deeplApiKey: string;
  googleTranslateApiKey: string;
  customTranslationPrompts: string[];
  translationsOutputFolder: string;
}
```

#### CalloutBlock
```typescript
interface CalloutBlock {
  text: string;
  startIndex: number;
  endIndex: number;
}
```

#### TranslationService
```typescript
type TranslationService =
  'claude' | 'chatgpt' | 'gemini' | 'google' | 'deepl';
```

#### AI Models
```typescript
type OpenAIModel =
  | 'gpt-3.5-turbo'
  | 'gpt-4'
  | 'gpt-4-turbo-preview'
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
  | 'gemini-1.5-flash';

type TranslationModel =
  OpenAIModel | ClaudeModel | GeminiModel;
```

#### Token Limits
```typescript
const MODEL_TOKEN_LIMITS: Record<TranslationModel, number> = {
  'gpt-3.5-turbo': 4096,
  'gpt-4': 8192,
  'gpt-4-turbo-preview': 128000,
  'gpt-4o': 128000,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 150000,
  'gemini-1.5-pro': 1048576,
  // ...
};
```

---

## Build and Deployment

### TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "ESNext",
    "lib": ["ES2017", "DOM"],
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}
```

### Build Process

**Tool**: esbuild

**Configuration** (esbuild.config.mjs):
```javascript
import esbuild from 'esbuild';
import process from 'process';

const production = process.argv[2] === 'production';

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron'],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: production ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: production
}).catch(() => process.exit(1));
```

### Build Commands

**Development**:
```bash
npm run dev
# Watches for changes, rebuilds automatically
```

**Production**:
```bash
npm run build
# Single build, minified, no sourcemaps
```

**Version Bump**:
```bash
npm version patch|minor|major
# Runs version-bump.mjs script
# Updates manifest.json and versions.json
```

### Deployment

**Files Required for Distribution**:
1. `main.js` - Bundled plugin code
2. `manifest.json` - Plugin metadata
3. `styles.css` - Plugin styles (if any)

**Installation Location**:
```
{VaultPath}/.obsidian/plugins/Bible-Meditation-Helper/
├── main.js
├── manifest.json
├── styles.css
└── data/ (Bible text files)
```

### Version Management

**manifest.json**:
```json
{
  "id": "Bible Meditation Helper",
  "name": "Bible Meditation Helper",
  "version": "1.0.4",
  "minAppVersion": "0.15.0",
  "description": "A plugin to help meditate the bible in any language",
  "author": "AGBALENYO Komi Barthélémy Elvis"
}
```

**versions.json**:
```json
{
  "1.0.0": "0.15.0",
  "1.0.1": "0.15.0",
  "1.0.2": "0.15.0",
  "1.0.4": "0.15.0"
}
```

---

## Performance Considerations

### File System Access
- **Optimization**: Bible text files are read on-demand
- **Caching**: No caching implemented (files are small)
- **Path Resolution**: Uses Node.js `path` module for cross-platform compatibility

### Citation Processing
- **Regex Performance**: Compiled regex patterns for reuse
- **Levenshtein Distance**: O(mn) complexity, acceptable for ~70 book names
- **Text Splitting**: Efficient string operations, no DOM manipulation

### Translation
- **Rate Limiting**: Implemented per API service requirements
- **Token Management**: Pre-calculation prevents API errors
- **Chunking**: Paragraph-aware to maintain context
- **Error Handling**: Graceful degradation on API failures

### Memory Management
- **Stream Processing**: Not implemented (file sizes small enough)
- **Citation Files**: Created incrementally, not all at once
- **Translation Output**: Written directly to file, not held in memory

---

## Security Considerations

### API Key Storage
- **Location**: Obsidian plugin data (JSON file)
- **Encryption**: None (relies on file system permissions)
- **Best Practice**: Users should secure their vault directory

### User Input Validation
- **Citation Input**: Regex validation before processing
- **File Paths**: Sanitized using `sanitizeFileName()`
- **API Requests**: Parameterized, no direct string injection

### External Requests
- **HTTPS Only**: All API calls use HTTPS
- **Timeout**: Implemented for API requests
- **Error Messages**: Do not expose API keys or sensitive data

---

## Error Handling Strategy

### Levels of Error Handling

1. **User Notification** (via Obsidian Notice)
   - Invalid citation format
   - Missing API key
   - Translation failure

2. **Console Logging** (for debugging)
   - API responses
   - File read errors
   - Processing steps

3. **Graceful Degradation**
   - Failed citation: original text preserved
   - Failed translation: user notified, original file intact
   - Missing Bible file: error notice, no crash

### Example Error Handling
```typescript
try {
  const citation = await getCitation(reference);
  editor.replaceRange(citation, cursor);
} catch (error) {
  console.error('Citation error:', error);
  new Notice(`Failed to create citation: ${error.message}`);
  // Original text remains unchanged
}
```

---

## Testing Approach

### Manual Testing
Based on git history, testing was primarily manual:
- Feature testing during development
- Bug reproduction from issues
- Version compatibility testing

### Test Scenarios (Evident from Commits)
1. Single verse citations
2. Verse range citations
3. Chapter > 10 handling
4. Callout detection
5. Version changing
6. Plain text conversion
7. Translation with various services

### Future Testing Recommendations
- Unit tests for text parsing
- Integration tests for API calls
- Regression tests for fixed bugs
- End-to-end tests for full workflows

---

## Extension Points

### Adding New Bible Versions
1. Add version data files to `data/Bible/{lang}/{version}/`
2. Update `mapBibleVersionToLanguage` in constants.ts
3. Test citation retrieval

### Adding New Translation Services
1. Implement service method in `translate_not.ts`
2. Add service to `TranslationService` type
3. Update modal UI in `prompt_modals.ts`
4. Add API key field in settings

### Custom Citation Formats
1. Modify `getCitation()` in `bible_citation_getter.ts`
2. Update callout template
3. Adjust CSS styling if needed

---

## Conclusion

The Bible Meditation Helper plugin demonstrates a well-structured, modular architecture with clear separation of concerns. The codebase is maintainable, extensible, and follows TypeScript best practices. The file-based data storage approach keeps the plugin lightweight while the integration with multiple AI services provides flexibility for users.

Key architectural strengths:
- **Modularity**: Clear module boundaries
- **Type Safety**: Comprehensive TypeScript usage
- **User Experience**: Intuitive keyboard shortcuts and modals
- **Extensibility**: Easy to add new Bible versions and translation services
- **Performance**: Efficient text processing and on-demand file loading

For more information:
- **Development History**: See `DEVELOPMENT_HISTORY.md`
- **Feature Usage**: See `FUNCTIONALITIES.md`
