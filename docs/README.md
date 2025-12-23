# Bible Meditation Helper - Documentation Index

Welcome to the comprehensive documentation for the Bible Meditation Helper Obsidian plugin.

## Documentation Files

This documentation suite consists of four main documents:

### 1. [Development History](DEVELOPMENT_HISTORY.md)
**Purpose**: Traces the complete development journey of the plugin from inception to current state.

**Contents**:
- Project timeline from February 2025 to October 2025
- Detailed commit history analysis
- Evolution of features through versions
- Bug fixes and challenges overcome
- Release history and milestones

**Who should read this**:
- Developers interested in the project's evolution
- Contributors wanting to understand past decisions
- Users curious about how features were developed

---

### 2. [Functionalities](FUNCTIONALITIES.md)
**Purpose**: Complete user guide for all plugin features and capabilities.

**Contents**:
- Detailed explanation of all 4 main features
- Step-by-step usage instructions
- Supported Bible versions and languages
- Citation format specifications
- Settings and configuration guide
- Troubleshooting and best practices

**Who should read this**:
- New users getting started with the plugin
- Existing users wanting to maximize functionality
- Anyone needing reference for features and shortcuts

---

### 3. [Technical Architecture](TECHNICAL_ARCHITECTURE.md)
**Purpose**: Deep dive into the technical implementation and codebase structure.

**Contents**:
- System architecture overview
- Module-by-module breakdown
- Data structures and algorithms
- API integration details
- Type system documentation
- Build and deployment processes
- Performance and security considerations

**Who should read this**:
- Developers wanting to contribute
- Technical users interested in how the plugin works
- Anyone extending or customizing the plugin

---

### 4. [README](README.md) (This File)
**Purpose**: Navigation hub for all documentation.

---

## Quick Navigation by Topic

### For Users

**Getting Started**:
- Installation: See main [README.md](../README.md)
- Basic Usage: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Overview section
- Keyboard Shortcuts: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Shortcuts summary

**Features**:
- Bible Citations: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Feature 1
- Version Changing: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Feature 2
- Plain Text Conversion: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Feature 3
- Translation: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Feature 4

**Configuration**:
- Settings Guide: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Settings section
- Supported Versions: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Supported Bible Versions

**Troubleshooting**:
- Common Issues: [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Troubleshooting section

---

### For Developers

**Understanding the Code**:
- Project Structure: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Project Structure
- Core Modules: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Core Modules
- Data Architecture: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Data Architecture

**Development**:
- Build Process: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Build and Deployment
- Type System: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Type System
- API Integration: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - API Integration

**Contributing**:
- Development History: [DEVELOPMENT_HISTORY.md](DEVELOPMENT_HISTORY.md)
- Architecture Patterns: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - System Overview
- Extension Points: [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Extension Points

---

## Feature Summary

### Core Capabilities

1. **Bible Citation Insertion** (Ctrl+J)
   - Insert formatted Bible passages with full verse text
   - Support for 30+ Bible versions in 4 languages
   - Automatic typo correction for book names
   - Creates citation files for backlinks and notes

2. **Citation Version Changing** (Ctrl+M)
   - Convert all citations in a document to different Bible version
   - Preserves structure and formatting
   - Useful for translation workflows

3. **Plain Text Citation Conversion** (Alt+M)
   - Automatically detect Bible references in plain text
   - Convert to full formatted citations
   - Great for processing notes from books or sermons

4. **AI-Powered Note Translation** (Ctrl+T)
   - Translate entire notes using ChatGPT, Claude, Gemini, DeepL, or Google Translate
   - Automatically converts Bible citations to target language version
   - Supports custom translation prompts
   - Multiple AI models available

---

## Supported Languages and Versions

### Languages
- **English**: 15+ versions (ESV, NIV, KJV, NLT, NASB, etc.)
- **French**: 5 versions (LSG, LSG10, NEG, PDV, BDS)
- **Spanish**: 6 versions (RVR1960, NVI, LBLA, etc.)
- **Portuguese**: 3 versions (ARC, ARA, NVI-PT)

For complete list, see [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Supported Bible Versions

---

## Technology Stack

- **Language**: TypeScript 4.7.4
- **Runtime**: Node.js
- **Build Tool**: esbuild 0.17.3
- **Framework**: Obsidian Plugin API

**Key Dependencies**:
- OpenAI SDK (ChatGPT integration)
- Google Cloud Translate API
- Anthropic Claude API
- js-levenshtein (typo correction)
- axios, cheerio, puppeteer (web scraping)

For details, see [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - System Overview

---

## Version History

| Version | Date | Key Features |
|---------|------|--------------|
| 1.0.0 | Mar 3, 2025 | Initial release - Basic Bible citations |
| 1.0.1 | Mar 4, 2025 | Bug fixes for chapter parsing and version display |
| 1.0.2 | Mar 6, 2025 | Single verse citation support |
| 1.0.4 | Jun 14, 2025 | Version changing, plain text conversion, translation |

For detailed timeline, see [DEVELOPMENT_HISTORY.md](DEVELOPMENT_HISTORY.md)

---

## Project Information

**Author**: AGBALENYO Komi Barthélémy Elvis
**Repository**: https://github.com/Elvis-codeur/Bible-Meditation-Helper
**License**: MIT
**Current Version**: 1.0.4
**Minimum Obsidian Version**: 0.15.0

---

## Documentation Maintenance

### Last Updated
- DEVELOPMENT_HISTORY.md: December 23, 2025
- FUNCTIONALITIES.md: December 23, 2025
- TECHNICAL_ARCHITECTURE.md: December 23, 2025
- README.md: December 23, 2025

### Contributing to Documentation
If you find errors or want to improve the documentation:
1. Open an issue on GitHub
2. Submit a pull request with improvements
3. Contact the author

---

## Getting Help

### Resources
1. **User Questions**: Read [FUNCTIONALITIES.md](FUNCTIONALITIES.md)
2. **Technical Questions**: Read [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
3. **Bug Reports**: GitHub Issues
4. **Feature Requests**: GitHub Issues

### Common Questions

**Q: How do I add a new Bible version?**
A: See [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Extension Points

**Q: What Bible citation formats are supported?**
A: See [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Citation Format Specifications

**Q: How does the translation feature work?**
A: See [FUNCTIONALITIES.md](FUNCTIONALITIES.md) - Feature 4: Note Translation

**Q: Can I customize the citation display format?**
A: See [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Extension Points

---

## Acknowledgments

This documentation was created to provide comprehensive guidance for both users and developers of the Bible Meditation Helper plugin. Special thanks to the Obsidian community for the excellent plugin ecosystem.

---

## License

This documentation is part of the Bible Meditation Helper plugin and is licensed under the MIT License.

---

**Happy Bible Studying! 📖✨**
