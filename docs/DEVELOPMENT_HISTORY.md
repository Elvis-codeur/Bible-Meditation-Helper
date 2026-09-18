# Bible Meditation Helper - Development History

## Project Overview
**Plugin Name**: Bible Meditation Helper
**Author**: AGBALENYO Komi Barthélémy Elvis
**Repository**: https://github.com/Elvis-codeur/Bible-Meditation-Helper
**Current Version**: 1.0.4
**Initial Commit**: February 15, 2025
**Latest Update**: October 6, 2025

## Project Purpose
The Bible Meditation Helper is an Obsidian plugin designed to facilitate Bible meditation and study by providing tools to cite Bible passages, manage translations, and convert plain text citations into rich, formatted Bible references across multiple languages and versions.

---

## Development Timeline

### Phase 1: Foundation (February 15-25, 2025)

#### Feb 15, 2025 - Initial Setup
- **Commit**: `cd5c8aa` - Initial commit
- **Commit**: `991eae5` - First tests
- Project scaffolding created using Obsidian plugin template
- Basic TypeScript configuration established
- Dependencies: Node.js, TypeScript, esbuild for bundling

#### Feb 17, 2025 - File Reading Capability
- **Commit**: `870a151` - Commit 1 du 17-02-2025
- Implemented ability to read Bible text files from the data directory
- Established file structure for storing Bible versions by book and chapter
- Data structure: `data/Bible/{language}/{version}/by_chapter/{book}/Chapter_{number}.md`

#### Feb 18, 2025 - File Reading Functional
- **Commit**: `0c710f7` - Commit 1 du 18-02-2025: lecture de fichier fonctionnelle
- Successfully implemented file reading functionality
- Able to load specific chapters from the local Bible data

#### Feb 21, 2025 - Initial Citation Ability
- **Commit**: `5788c0e` - Commit du 21-02-2025. Capacité de citer des versets. problème avec les psaumes
- First working implementation of verse citation
- Known issue: Problems with Psalms citations
- Parser implementation for Bible references (Book Chapter:Verse format)

#### Feb 24-25, 2025 - Citation Capability Established
- **Commit**: `7207690` - Commit 1 du 24-02-2025
- **Commit**: `b5dd7fd` - Commit 1 du 25-02-2025. Capacité de citation opérationnelle
- **Commit**: `f835e0f` - Commit 2 du 25-02-2025
- Citation functionality became operational
- Basic UI for inserting Bible citations in Obsidian notes

---

### Phase 2: Version 1.0.0 Release (March 2025)

#### March 3-4, 2025 - Version 1.0.0
- **Commit**: `a3fff8f` - Commit de la version 1.0.0 du plugin
- First official release of the plugin
- Core features:
  - Bible citation insertion (Ctrl+J)
  - Support for ESV, KJV, LSG10 versions initially
  - Basic citation parsing and display

#### March 4, 2025 - Critical Bug Fixes
- **Issue #3**: `f7276f6` - Closes #3 - Fix the chapter greater than 10 citation problem
  - Fixed issue where chapters with numbers > 9 were not being properly parsed
  - Updated chapter numbering logic to handle two-digit chapters

- **Issue #2**: `ba775ca` - Closes #2 - Fix the problem with the adding of the bible version used in the citation
  - Fixed Bible version not being displayed in citations
  - Ensured version information is stored and displayed correctly

#### March 4, 2025 - Version 1.0.1
- **Commit**: `9f3d3fb` - Commit qui cimente la version 1.0.1
- Updated manifest.json and versions.json
- Consolidated bug fixes from Issues #2 and #3

---

### Phase 3: Enhanced Citation Features (March 2025)

#### March 6, 2025 - Single Verse Citations & Release Preparation
- **Issue #6**: `81d718a` - Closes #6 - Possibilité de citer un seul verset
  - Added ability to cite individual verses (not just ranges)
  - Parser now handles: `Book Chapter:Verse` format
  - Previously only supported: `Book Chapter:VerseStart-VerseEnd`

- **Commit**: `7a9eda3` - Résolution du problème de citation des versets
  - Fixed verse citation issues
  - Changed from line-by-line citations to proper verse-by-verse citations

- **Commit**: `59bd7f7` - Commit final avant release de la version 1.0.2
  - Final preparations for v1.0.2 release

- **Commit**: `d55f1f6` - COmmit avec ajout de fichier .gitattributes
  - Added .gitattributes for proper release packaging

#### March 7, 2025 - Bug Fixes
- **Issue #10**: `5ac9474` - resolve #10
  - Details not specified in commit message

- **Issue #9**: `376bbca` - resolve #9
  - Details not specified in commit message

#### March 15, 2025
- **Issue #12**: `35ef856` - closed #12
  - Bug fix (details not specified)

#### March 24, 2025
- **Issue #13**: `ea9cf2e` - solved #13
  - Bug fix (details not specified)

---

### Phase 4: Version Changing Feature (March-April 2025)

#### March 31, 2025 - Version Change Development
- **Issue #16**: `d3c207e` - Test failed
  - Attempted to implement citation version changing
  - Could load new citations in targeted Bible version
  - Could not successfully change existing citations
  - Issue remained unresolved at this point

#### April 21, 2025
- **Issue #17**: `450a674` - Solved #17
  - Bug fix (details not specified)

---

### Phase 5: Major Feature Additions (June 2025)

#### June 14, 2025 - Plain Text Citation Conversion
- **Issue #16**: `296e389` - Commit with #16 solved
  - Successfully implemented citation version changing
  - Users can now change all citations in a document to a different Bible version
  - Command: Ctrl+M to choose desired Bible version

- **Issue #15**: `db9c54a` - Commit with #15 solved
  - Implemented plain text citation to plugin citation conversion
  - Automatically detects Bible references in plain text
  - Converts them to full formatted Bible citations
  - Command: Alt+M to choose desired Bible version

- **Commit**: `478d2f1` - Version 1.0.4 ready to be published
  - Major version update with two new features

- **Commit**: `bc8bb3c` - Solve bug with the case where the file contains no bible callouts before
  - Fixed edge case when document has no existing Bible callouts

#### June 14-15, 2025 - Translation Feature Development
- **Issue #19**: `2b5e090` - Ongoing #19
  - Started implementing note translation functionality
  - Integration with AI translation services

- **Commit**: `9b72511` - Bug fix for callout handling
  - Fixed issue where text before callouts and after them was lost
  - Related to functionality #15

- **Issue #19**: `6d6fac5` - Almost finished #19
  - Near completion of translation feature

- **Issue #21**: `1580c2b` - Solve #21. Finished #19
  - Completed translation functionality
  - Integrated ChatGPT for translation
  - Command: Ctrl+T to access translator

#### June 15, 2025
- **Issue #23**: `6476c23` - Solved #23
  - Bug fix (details not specified)

#### June 16, 2025 - Translation Improvements
- **Issue #16**: `a123f94` - Bug fix for excessive newlines
  - Fixed issue causing many \n to be added when replacing plain citations

- **Issue #24**: `3b0e77c` - First version #24
  - Additional translation-related feature

- **Commit**: `0c6bfe7` - Solve bugs related to the execution of #15 and test #16
  - Bug fixes for citation conversion features

#### June 17, 2025
- **Commit**: `961fd75` - Commit modification readme
  - Updated README with new features documentation

---

### Phase 6: Bug Fixes and Refinements (June 2025)

#### June 22, 2025
- **Issue #26**: `cb6803c` - Solve #26
  - Bug fix (details not specified)

- **Commit**: `c756038` - Bug fix for failed conversions
  - Fixed issue where lines that failed citation conversion were not added back to final string

#### June 24, 2025
- **Issue #28**: `db22c5b` - Solve #28
  - Bug fix (details not specified)

#### June 25, 2025
- **Issue #30**: `b504736` - solved #30
  - Bug fix (details not specified)

- **Commit**: `7857217` - solve error in previous commit
  - Fixed error introduced in commit #b504736
  - Related to issue #30

- **Commit**: `4c13293` - Solve space around WIKILINK placeholders
  - Fixed spacing issues with Obsidian wikilinks in citations

---

### Phase 7: Recent Updates (October 2025)

#### October 2, 2025
- **Issue #32**: `7d90cc0` - Solved #32
  - Bug fix (details not specified)

- **Issue #31**: `43c9910` - Solved #31
  - Bug fix (details not specified)

#### October 6, 2025
- **Issue #35**: `9a0e461` - #35 solved
  - Most recent bug fix
  - Current state of the plugin

---

## Architecture Evolution

### Initial Architecture (v1.0.0)
- Simple file-based Bible text storage
- Basic citation parser
- Direct file manipulation for citation insertion

### Enhanced Architecture (v1.0.2-1.0.4)
- Citation file system with wiki links
- Callout-based citation display
- Multi-version support with language mapping
- Levenshtein distance for typo correction in book names

### Current Architecture (v1.0.4)
- Modular TypeScript codebase
- Separation of concerns:
  - `main.ts`: Plugin entry point and command registration
  - `bible_citation_getter.ts`: Citation fetching and formatting
  - `translate_not.ts`: Translation functionality
  - `text_manipulations.ts`: Text processing utilities
  - `constants.ts`: Bible mappings and configurations
  - `prompt_modals.ts`: UI modal components
  - `settings-tab.ts`: Plugin settings interface

---

## Feature Development Summary

### Core Features (In Order of Implementation)
1. **Bible Citation Insertion** (Feb-Mar 2025)
   - Hotkey: Ctrl+J
   - Parse citation format: `Book Chapter:Verse || VERSION`
   - Display as formatted callout block

2. **Citation Version Changing** (Jun 2025)
   - Hotkey: Ctrl+M
   - Convert all citations in document to different Bible version
   - Preserves citation structure

3. **Plain Text Citation Conversion** (Jun 2025)
   - Hotkey: Alt+M
   - Automatically detect and convert plain Bible references
   - Regex-based pattern matching

4. **Note Translation** (Jun 2025)
   - Hotkey: Ctrl+T
   - Integration with multiple translation services:
     - ChatGPT (OpenAI)
     - Claude (Anthropic)
     - Gemini (Google)
     - DeepL
     - Google Translate
   - Custom translation prompts support

### Technical Improvements
- Levenshtein distance for book name typo correction
- Support for book abbreviations (English and French)
- Multi-language Bible version support:
  - English: ESV, KJV, NIV, NLT, NASB, etc.
  - French: LSG, LSG10, NEG, PDV, BDS
  - Spanish: RVR1960, NVI, LBLA
  - Portuguese: ARC, ARA, NVI-PT
- Citation file management system
- Callout-based rendering using Obsidian's native callouts

---

## Challenges Overcome

1. **Chapter Number Parsing** (Issue #3)
   - Challenge: Two-digit chapter numbers not recognized
   - Solution: Updated number parsing logic

2. **Verse-by-Verse Citations** (Mar 2025)
   - Challenge: Citations were line-based instead of verse-based
   - Solution: Rewrote citation splitter using numbered pattern detection

3. **Single Verse Citations** (Issue #6)
   - Challenge: Parser only handled verse ranges
   - Solution: Added conditional logic for single verse format

4. **Version Changing** (Issue #16)
   - Challenge: Could not modify existing citations
   - Solution: Implemented citation extraction with regex and replacement logic

5. **Callout Text Preservation** (Jun 2025)
   - Challenge: Text around callouts was lost during conversion
   - Solution: Improved text splitting and reassembly algorithm

6. **Wikilink Spacing** (Jun 2025)
   - Challenge: Improper spacing around wikilink placeholders
   - Solution: Fixed string concatenation logic

---

## Code Quality Improvements

### Testing Milestones
- Feb 15: Initial tests
- Mar 31: Failed test for Issue #16 (version changing)
- Jun 16: Test execution for Issues #15 and #16

### Documentation Updates
- Jun 17: README updated with all four main functionalities
- Inline code documentation added throughout development
- Type definitions formalized in `type_definitions.ts`

---

## Dependencies Evolution

### Initial Dependencies
- Obsidian API
- TypeScript
- esbuild

### Added Dependencies (by version)
- **v1.0.4**:
  - OpenAI SDK (translation)
  - @google-cloud/translate (Google Translate)
  - axios (HTTP requests)
  - cheerio (HTML parsing)
  - cors, express (server capabilities)
  - puppeteer (web scraping)
  - iconv-lite (character encoding)
  - js-levenshtein (typo correction)

---

## Future Development Indicators

Based on the codebase structure, potential future features may include:
- More Bible versions and languages
- Inline citation style (currently only callout-based)
- Different quote styles (English quotes vs French guillemets)
- Citation table generation (`table_of_citations.ts` exists but usage unclear)
- Enhanced translation prompt customization

---

## Release History

| Version | Date | Key Features |
|---------|------|--------------|
| 1.0.0 | Mar 3, 2025 | Initial release with basic citation |
| 1.0.1 | Mar 4, 2025 | Bug fixes for chapter parsing and version display |
| 1.0.2 | Mar 6, 2025 | Single verse citation support |
| 1.0.4 | Jun 14, 2025 | Version changing, plain text conversion, translation |

---

## Development Patterns

### Commit Message Patterns
- French and English mixed (developer is French-speaking)
- Issue tracking: "#N solved" or "Closes #N"
- Descriptive commits include functionality description
- Regular commit frequency during active development periods

### Development Cycles
1. **Sprint-like bursts**: Feb 15-25, Mar 3-7, Jun 14-17
2. **Maintenance periods**: Individual bug fixes between sprints
3. **Testing phases**: Evident from "test failed" and "solve bugs" commits

---

## Conclusion

The Bible Meditation Helper has evolved from a simple Bible citation tool to a comprehensive Bible study assistant with multi-language support, intelligent text conversion, and AI-powered translation capabilities. Development has been iterative with clear focus on user functionality and bug resolution.
