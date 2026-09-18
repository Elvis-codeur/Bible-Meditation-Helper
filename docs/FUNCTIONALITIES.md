# Bible Meditation Helper - Functionalities Documentation

## Table of Contents
1. [Overview](#overview)
2. [Feature 1: Bible Citation Insertion](#feature-1-bible-citation-insertion)
3. [Feature 2: Citation Version Changing](#feature-2-citation-version-changing)
4. [Feature 3: Plain Text Citation Conversion](#feature-3-plain-text-citation-conversion)
5. [Feature 4: Note Translation](#feature-4-note-translation)
6. [Supported Bible Versions](#supported-bible-versions)
7. [Citation Format Specifications](#citation-format-specifications)
8. [Settings Configuration](#settings-configuration)

---

## Overview

The Bible Meditation Helper plugin provides four main functionalities to enhance Bible study and meditation within Obsidian:

1. **Cite Bible passages** - Insert formatted Bible citations with full verse text
2. **Change citation versions** - Convert all citations in a document to a different Bible version
3. **Convert plain citations** - Transform plain text Bible references into full citations
4. **Translate notes** - Translate entire notes using AI services

All functionalities support multiple languages and Bible versions, making it suitable for multilingual Bible study.

---

## Feature 1: Bible Citation Insertion

### Description
Insert formatted Bible citations directly into your notes with full verse text in your chosen Bible version.

### How to Use
1. **Trigger**: Press `Ctrl+J` (Windows/Linux) or `Cmd+J` (macOS)
2. **Input Format**: `Book Chapter:Verse || VERSION`
   - Example: `John 3:16 || ESV`
   - Example: `Rom 8:28-30 || NIV`
   - Example: `Ps 23:1-6 || LSG`
3. **Output**: A formatted callout block with:
   - Clickable wikilink to a citation file
   - Full verse text
   - Verse numbers in bold
   - Bible version indicator

### Input Format Details

#### Single Verse Citation
```
Book Chapter:Verse || VERSION
```
Examples:
- `John 3:16 || ESV`
- `Matthieu 5:3 || LSG`
- `1Cor 13:4 || NIV`

#### Verse Range Citation
```
Book Chapter:VerseStart-VerseEnd || VERSION
```
Examples:
- `Romans 8:28-30 || ESV`
- `Genèse 1:1-5 || LSG10`
- `Psalm 23:1-6 || KJV`

#### Open-Ended Range (to end of chapter)
```
Book Chapter:VerseStart- || VERSION
```
Example:
- `Matt 5:1- || ESV` (cites from verse 1 to the end of chapter 5)

### Book Name Variations

The plugin supports multiple formats for book names:

#### Abbreviations
- `Gen` → Genesis
- `Ex` → Exodus
- `Matt` → Matthew
- `Rom` → Romans
- `1Cor` → 1 Corinthians
- `Ps` → Psalms

#### Full Names (English)
- `Genesis`, `Exodus`, `Matthew`, `John`, `Romans`, etc.

#### French Names
- `Genèse`, `Exode`, `Matthieu`, `Jean`, `Romains`, etc.

#### Typo Correction
The plugin uses Levenshtein distance algorithm to correct minor spelling errors:
- `Jhon` → `John`
- `Romns` → `Romans`
- `Gensis` → `Genesis`

### Output Format

The citation is inserted as an Obsidian callout:

```markdown
>[!bible-meditation-helper-citation]  [[John 3_16|John 3:16 | ESV]]
>**16** For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.
```

**Rendered view**:
- Displays as a formatted callout block
- Verse numbers are bold
- Citation reference is a clickable link
- Full verse text is quoted

### Citation File System

For each citation, the plugin creates a file in:
```
Bible-Meditation-Helper/citations/
```

File naming pattern:
- Single verse: `Book Chapter_Verse.md`
  - Example: `John 3_16.md`
- Verse range: `Book Chapter_VerseStart-VerseEnd.md`
  - Example: `Romans 8_28-30.md`

These files can be used for:
- Backlinks to see where you've cited a verse
- Adding your own notes and reflections
- Creating a personal concordance

### Supported Citation Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| Book Chapter:Verse | John 3:16 | Single verse |
| Book Chapter:Start-End | Rom 8:28-30 | Verse range |
| Book Chapter:Start- | Matt 5:1- | From verse to chapter end |
| Abbreviated Book | 1Cor 13:4 | Using common abbreviations |
| French Book Names | Genèse 1:1 | French language support |
| With Spaces | 1 Cor 13:4 | Space between number and book |

---

## Feature 2: Citation Version Changing

### Description
Convert all Bible citations in the current document to a different Bible version. Useful when translating your notes or preferring a different translation.

### How to Use
1. **Trigger**: Press `Ctrl+M` (Windows/Linux) or `Cmd+M` (macOS)
2. **Select Version**: Choose your desired Bible version from the modal
3. **Automatic Processing**: All existing citations in the document are updated

### Use Cases

#### Translation Workflow
When translating notes from English to French:
1. Translate your text content
2. Use `Ctrl+M` to convert all ESV citations to LSG
3. All citations automatically update with French text

#### Version Comparison
Quickly switch between translations to compare:
1. Original notes with ESV
2. `Ctrl+M` → Select NIV
3. All citations now show NIV translation
4. Can switch back or to another version anytime

#### Study Enhancement
- Start with a more literal translation (ESV, NASB)
- Switch to a more readable version (NLT, NIV)
- Compare theological nuances between versions

### Technical Details

**What Gets Changed:**
- The verse text content
- The version indicator in the citation
- The citation file reference

**What Stays the Same:**
- Your notes and comments
- The citation structure
- File organization
- Backlinks and references

**Processing:**
1. Scans document for all `[!bible-meditation-helper-citation]` callouts
2. Extracts the reference (book, chapter, verses)
3. Fetches new verses from selected version
4. Replaces old callout with new callout
5. Updates citation files if needed

### Limitations
- Only works on citations created by this plugin
- Does not modify plain text Bible references (use Feature 3 for that)
- Requires the target Bible version data to be available

---

## Feature 3: Plain Text Citation Conversion

### Description
Automatically detect Bible references in plain text and convert them to full, formatted citations with verse text.

### How to Use
1. **Trigger**: Press `Alt+M` (Windows/Linux/macOS)
2. **Select Version**: Choose the Bible version to use for citations
3. **Automatic Detection**: Plugin scans your document for Bible references
4. **Automatic Conversion**: Found references are replaced with full citations

### Detection Patterns

The plugin detects various Bible reference formats:

#### Standard Format
```
Book Chapter:Verse
```
Examples from text:
- "As it says in John 3:16..."
- "See Romans 8:28 for encouragement"
- "Read Psalm 23:1-6"

#### With Chapter Only
```
Book Chapter
```
Example:
- "Genesis 1 describes creation"
- "See Matthew 5"

#### Range Format
```
Book Chapter:Start-End
```
Example:
- "Romans 8:28-30 speaks of..."
- "Read Psalm 23:1-6"

### What Gets Converted

**Converted** (becomes full citation callout):
- `John 3:16`
- `Romans 8:28-30`
- `1 Corinthians 13:4-8`
- `Matthieu 5:3`
- `Genèse 1:1-5`

**Not Converted** (stays as-is):
- Text inside existing callouts (lines starting with `>`)
- Text in list items (lines starting with `-` or `+`)
- References that fail parsing (invalid book names, etc.)

### Use Cases

#### Note-Taking from Books
When reading a book that cites Bible verses:
1. Copy interesting quotes with Bible references into your notes
2. Run `Alt+M` and select your preferred version
3. All references become full citations automatically

Example input:
```markdown
The author references John 3:16 and Romans 8:28 to make the point that...
```

After conversion:
```markdown
The author references

>[!bible-meditation-helper-citation]  [[John 3_16|John 3:16 | ESV]]
>**16** For God so loved the world...

and

>[!bible-meditation-helper-citation]  [[Romans 8_28|Romans 8:28 | ESV]]
>**28** And we know that for those who love God...

to make the point that...
```

#### Sermon Notes Enhancement
1. Take quick notes during sermon with just references
2. Later, run conversion to get full verse text
3. Study the verses in context

#### Study Guide Preparation
1. Create outline with Bible references
2. Convert to full citations
3. Share with study group

### Error Handling

**If a reference cannot be converted:**
- The original text remains unchanged
- An error is logged to console
- Processing continues with next reference

**Common reasons for failed conversion:**
- Misspelled book name beyond Levenshtein correction
- Invalid chapter or verse numbers
- Unsupported Bible version for that book
- Malformed reference pattern

### Regex Pattern Used

The plugin uses sophisticated regex to detect references:
```regex
\b(?:[1-3]?\s?[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿa-zà-ÿ]+)*)(?:\s+\d{1,3}(?::\d{1,3})?(?:-\d{1,3})?)\b
```

This pattern matches:
- Optional book numbers (1, 2, 3)
- Book names (capitalized, with accents)
- Multi-word books (Song of Solomon, 1 Corinthians)
- Chapter numbers (1-3 digits)
- Optional verse numbers
- Optional verse ranges

---

## Feature 4: Note Translation

### Description
Translate entire notes from one language to another using AI translation services, with special handling for Bible citations.

### How to Use
1. **Trigger**: Press `Ctrl+T` (Windows/Linux) or `Cmd+T` (macOS)
2. **Configure Translation**:
   - Select translation service (ChatGPT, Claude, Gemini, DeepL, Google)
   - Choose target language
   - Select Bible version for target language
   - Optional: Add custom translation prompt
   - Optional: Select AI model
3. **Execute**: Translation runs and creates a new file with translated content

### Supported Translation Services

#### 1. ChatGPT (OpenAI)
**API Key Required**: Yes (in plugin settings)

**Available Models**:
- `gpt-3.5-turbo` - Fast, economical (4K tokens)
- `gpt-4` - Higher quality (8K tokens)
- `gpt-4-turbo-preview` - Latest GPT-4 (128K tokens)
- `gpt-4o` - Optimized GPT-4 (128K tokens)
- `o1`, `o3` - Advanced reasoning models (128K tokens)

**Best For**:
- General translation
- Natural language flow
- Cost-effective for long documents

#### 2. Claude (Anthropic)
**API Key Required**: Yes (in plugin settings)

**Available Models**:
- `claude-3-haiku` - Fast, efficient (100K tokens)
- `claude-3-sonnet` - Balanced (150K tokens)
- `claude-3-opus` - Highest quality (200K tokens)

**Best For**:
- Theological accuracy
- Nuanced translation
- Long documents (large context window)

#### 3. Gemini (Google)
**API Key Required**: Yes (in plugin settings)

**Available Models**:
- `gemini-1.0-pro` - Standard (32K tokens)
- `gemini-1.5-pro` - Advanced (1M tokens)
- `gemini-1.5-flash` - Fast (1M tokens)
- `gemma-7b`, `gemma-2b` - Lightweight models

**Best For**:
- Very long documents (huge context window)
- Multilingual translation
- Fast processing

#### 4. DeepL
**API Key Required**: Yes (in plugin settings)

**Features**:
- Professional translation quality
- Excellent for European languages
- No model selection needed

**Best For**:
- French ↔ English
- Spanish, Portuguese, German translations
- Professional-grade accuracy

#### 5. Google Translate
**API Key Required**: Yes (in plugin settings)

**Features**:
- Wide language support
- Fast translation
- Lower cost

**Best For**:
- Quick translations
- Less common language pairs
- Budget-conscious usage

### Translation Process

#### Bible Citation Handling
1. **Extraction**: Bible citations are identified and extracted
2. **Translation**: Regular text is translated using selected service
3. **Version Conversion**: Bible citations are converted to target language version
4. **Reassembly**: Translated text and converted citations are combined

Example:
```markdown
Original (English):
Jesus said in John 3:16 that God loves the world.

>[!bible-meditation-helper-citation]  [[John 3_16|John 3:16 | ESV]]
>**16** For God so loved the world...

Translated (French):
Jésus a dit dans Jean 3:16 que Dieu aime le monde.

>[!bible-meditation-helper-citation]  [[Jean 3_16|Jean 3:16 | LSG]]
>**16** Car Dieu a tant aimé le monde...
```

### Custom Translation Prompts

**Purpose**: Guide the AI to translate in a specific style or for a specific audience.

**Examples**:
- "Translate for a theological academic audience"
- "Translate in simple language for children"
- "Maintain formal theological terminology"
- "Translate poetically for devotional reading"

**Storage**: Custom prompts can be saved in plugin settings for reuse.

### Output Management

**Output Folder**: Configurable in settings (default: same as source)

**File Naming**:
- Original: `My Sermon Notes.md`
- Translated: `My Sermon Notes (Translated to fr).md`

**Content Preservation**:
- Original file remains unchanged
- New translated file created
- All formatting preserved
- Links and tags maintained

### Token Limits and Chunking

For large documents that exceed model token limits:
1. Document is automatically split into chunks
2. Each chunk translated separately
3. Chunks reassembled maintaining coherence
4. Citations handled correctly across chunks

**Token Limits by Model**:
| Model | Token Limit |
|-------|-------------|
| GPT-3.5 | 4,096 |
| GPT-4 | 8,192 |
| GPT-4 Turbo/o1/o3 | 128,000 |
| Claude Haiku | 100,000 |
| Claude Sonnet | 150,000 |
| Claude Opus | 200,000 |
| Gemini 1.5 Pro/Flash | 1,048,576 |

### Error Handling

**Common Errors**:
- Missing API key → Configure in settings
- Invalid API key → Check key validity
- Rate limit exceeded → Wait and retry
- Model unavailable → Try different model

**Notifications**:
- Success: "Translation completed for {filename}"
- Failure: "Translation failed: {error message}"

---

## Supported Bible Versions

### English Versions
- **ESV** - English Standard Version
- **NIV** - New International Version
- **KJV** - King James Version
- **NLT** - New Living Translation
- **NRSV** - New Revised Standard Version
- **RSV** - Revised Standard Version
- **NASB** - New American Standard Bible
- **ASV** - American Standard Version
- **WEB** - World English Bible
- **BBE** - Bible in Basic English
- **DARBY** - Darby Translation
- **HNV** - Hebrew Names Version
- **WBT** - Webster's Bible Translation
- **WNT** - Weymouth New Testament
- **YLT** - Young's Literal Translation

### French Versions
- **LSG** - Louis Segond
- **LSG10** - Louis Segond 1910
- **NEG** - Nouvelle Édition de Genève
- **PDV** - Parole de Vie
- **BDS** - Bible du Semeur

### Spanish Versions
- **RVR1960** - Reina-Valera 1960
- **LBLA** - La Biblia de las Américas
- **NVI** - Nueva Versión Internacional
- **RVR1977** - Reina-Valera 1977
- **RVR1995** - Reina-Valera 1995
- **TLA** - Traducción en Lenguaje Actual

### Portuguese Versions
- **ARC** - Almeida Revista e Corrigida
- **ARA** - Almeida Revista e Atualizada
- **NVI-PT** - Nova Versão Internacional (Portuguese)

---

## Citation Format Specifications

### Callout Structure
```markdown
>[!bible-meditation-helper-citation]  [[CitationFile|DisplayText]]
>**VerseNumber** Verse text...
>**VerseNumber** Verse text...
```

### Display Text Format
```
Book Chapter:Verse(s) | VERSION
```

Examples:
- `John 3:16 | ESV`
- `Romans 8:28-30 | NIV`
- `Psaumes 23:1-6 | LSG`

### Citation File Naming
Pattern: `Book Chapter_Verse(s).md`

Examples:
- `John 3_16.md`
- `Romans 8_28-30.md`
- `Psalms 23_1-6.md`

### File Storage Location
```
{Vault}/Bible-Meditation-Helper/citations/
```

All citation files are stored in this centralized location for easy management and searching.

---

## Settings Configuration

### Required Settings (for Translation)

#### OpenAI API Key
- **Required for**: ChatGPT translation
- **How to get**: https://platform.openai.com/api-keys
- **Format**: `sk-...`

#### Claude API Key
- **Required for**: Claude translation
- **How to get**: https://console.anthropic.com/
- **Format**: Anthropic API key

#### Gemini API Key
- **Required for**: Gemini translation
- **How to get**: https://makersuite.google.com/app/apikey
- **Format**: Google AI API key

#### DeepL API Key
- **Required for**: DeepL translation
- **How to get**: https://www.deepl.com/pro-api
- **Format**: DeepL authentication key

#### Google Translate API Key
- **Required for**: Google Translate
- **How to get**: Google Cloud Console
- **Format**: Google Cloud API key

### Optional Settings

#### Translations Output Folder
- **Purpose**: Where translated files are saved
- **Default**: Same folder as source file
- **Format**: Path relative to vault root

#### Custom Translation Prompts
- **Purpose**: Saved translation prompt templates
- **Usage**: Quick selection from dropdown during translation
- **Management**: Add, edit, delete in settings

---

## Keyboard Shortcuts Summary

| Shortcut | Feature | Description |
|----------|---------|-------------|
| `Ctrl+J` | Cite Bible Passage | Insert formatted Bible citation |
| `Ctrl+M` | Change Citation Version | Convert all citations to different version |
| `Alt+M` | Convert Plain Citations | Transform plain text references to citations |
| `Ctrl+T` | Translate Note | Translate entire note with AI |

(On macOS, `Ctrl` becomes `Cmd`)

---

## Best Practices

### Citation Insertion
1. Use abbreviations for faster typing
2. Include version in every citation for clarity
3. Keep citation files for backlink benefits
4. Review citations for accuracy before publishing

### Version Changing
1. Make a backup before changing versions in critical notes
2. Verify the new version has all books available
3. Check special formatting after conversion

### Plain Text Conversion
1. Review detected citations before conversion
2. Use on drafts before final formatting
3. Combine with version changing for translated content

### Translation
1. Choose appropriate AI model for your content
   - Devotional: GPT-4o or Claude Opus
   - Academic: Claude Opus
   - Quick reference: GPT-3.5 or Gemini Flash
2. Use custom prompts for consistent style
3. Proofread AI translations for theological accuracy
4. Keep original files as backups

---

## Troubleshooting

### Citation Not Inserted
- **Check**: Format includes `||` separator
- **Check**: Bible version is supported
- **Check**: Book name is recognized (try abbreviation)

### Version Change Failed
- **Check**: Target version data is available
- **Check**: Document has plugin-created citations

### Plain Text Not Detected
- **Check**: Reference follows supported patterns
- **Check**: Text is not in callout or list
- **Check**: Book name spelling

### Translation Failed
- **Check**: API key is configured in settings
- **Check**: API key is valid and has credits
- **Check**: Internet connection is active
- **Check**: Selected model is available

---

## Advanced Usage

### Building a Personal Concordance
1. Use citation files as atomic notes
2. Add personal reflections to each citation file
3. Use Obsidian's backlinks to see all references
4. Tag citations by theme or topic

### Cross-Referencing
1. Create index notes with multiple citations
2. Link related passages
3. Build thematic studies
4. Use Obsidian's graph view to visualize connections

### Multi-Language Study
1. Create English notes with ESV citations
2. Duplicate note
3. Translate one copy to French
4. Use `Ctrl+M` to convert citations to LSG
5. Compare side-by-side

### Sermon Preparation
1. Start with outline and plain text references
2. Convert references to full citations
3. Add notes and commentary
4. Translate for multilingual congregation
5. Export or present from Obsidian

---

This documentation covers all major functionalities of the Bible Meditation Helper plugin. For technical details about the implementation, see `TECHNICAL_ARCHITECTURE.md`.
