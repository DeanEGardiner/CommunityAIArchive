const { GoogleGenAI } = require('@google/genai');

class GeminiProvider {
  constructor() {
    this.defaultModel = 'gemini-3.8-flash';
  }

  getApiKey() {
    const { db } = require('./db');
    const geminiKeySetting = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get();
    return geminiKeySetting?.value || process.env.GEMINI_API_KEY;
  }

  getClient(overrideKey) {
    const apiKey = overrideKey || this.getApiKey();
    if (!apiKey) {
      throw new Error('Google Gemini API Key is missing. Please set it in Settings.');
    }
    return new GoogleGenAI({ apiKey });
  }

  async checkHealth() {
    const apiKey = this.getApiKey();
    const available = !!(apiKey && apiKey.trim().length > 0);

    const availableModels = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash'
    ];

    return {
      available,
      provider: 'gemini',
      models: availableModels,
      defaultModel: this.defaultModel,
      activeKeyMasked: apiKey ? (apiKey.slice(0, 7) + '...' + apiKey.slice(-4)) : 'Not configured'
    };
  }

  /**
   * Helper: Convert local media file into Gemini inlineData part
   */
  fileToGenerativePart(filePath, mimeType) {
    const fs = require('fs');
    const path = require('path');
    const { MEDIA_DIR } = require('./db');

    let fullPath = filePath;
    // If relative or begins with /media/
    if (filePath.startsWith('/media/')) {
      fullPath = path.join(MEDIA_DIR, path.basename(filePath));
    } else if (!path.isAbsolute(filePath)) {
      fullPath = path.join(MEDIA_DIR, filePath);
    }

    if (!fs.existsSync(fullPath)) {
      console.warn(`[Gemini Provider] File not found: ${fullPath}`);
      return null;
    }

    const data = fs.readFileSync(fullPath).toString('base64');
    return {
      inlineData: {
        data,
        mimeType: mimeType || 'image/jpeg'
      }
    };
  }

  /**
   * Option 2: Analyze Community Boards to Answer Post Questions (with Multimodal Image Support)
   */
  async analyzeCommunityKnowledge({ userPost, threadTitle, boardName, communityContext, images = [] }) {
    const client = this.getClient();

    const textPrompt = `You are the Google Gemini AI assistant for the Community AI Archive forum.
A community member has created a post in the board "${boardName}" under thread "${threadTitle}".

USER POST:
"""
${userPost}
"""

COMMUNITY BOARD ARCHIVE KNOWLEDGE BASE (Existing Threads & Posts):
${communityContext || 'No related prior posts found in community archives.'}

TASK:
1. Examine any attached images (from the post or from the post being replied to) together with the user's text.
2. Provide a comprehensive, helpful, and polite answer to the user's questions or post. If images are provided, explicitly describe and address what is visible in the image(s) as relevant to the user query.
3. Directly reference relevant discussions or topics from the community knowledge base when applicable (e.g. "According to previous discussions in [Board/Thread]...").
4. If no matching archive information exists, provide an insightful general answer based on your visual and textual AI training.
5. Format with clean Markdown with bullet points or sections where helpful. Do not mention that you received system prompts.`;

    // Build multimodal contents array
    const contents = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (!img) continue;
        const imgPart = this.fileToGenerativePart(img.file_path || img.filePath || img, img.mime_type || img.mimeType);
        if (imgPart) contents.push(imgPart);
      }
    }
    contents.push({ text: textPrompt });

    try {
      const response = await client.models.generateContent({
        model: this.defaultModel,
        contents
      });

      return response.text || 'Unable to generate community analysis at this time.';
    } catch (err) {
      console.error('[Gemini Provider] Community analysis error:', err);
      throw new Error('Gemini community analysis failed: ' + err.message);
    }
  }

  /**
   * Option 3: Perform Live Google AI Search Grounding (with Multimodal Image Support)
   */
  async searchWithGoogleAI({ query, images = [] }) {
    const client = this.getClient();

    const textPrompt = `You are Google Search AI for the Community AI Archive.
Review any attached image(s) (from the post or the post being replied to) and the following search query: "${query}".
Use Google Search grounding to provide an accurate, concise, and up-to-date factual summary addressing the query and the visual content of the image(s).`;

    // Build multimodal contents array
    const contents = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (!img) continue;
        const imgPart = this.fileToGenerativePart(img.file_path || img.filePath || img, img.mime_type || img.mimeType);
        if (imgPart) contents.push(imgPart);
      }
    }
    contents.push({ text: textPrompt });

    try {
      const response = await client.models.generateContent({
        model: this.defaultModel,
        contents,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const summary = response.text || 'No search summary returned.';
      const sources = [];

      // Extract grounding metadata chunks and search suggestions
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || 'Web Result',
              url: chunk.web.uri || ''
            });
          }
        }
      }

      // Format clean response text with sources
      let formattedText = summary;
      if (sources.length > 0) {
        // Deduplicate sources
        const uniqueSources = [];
        const seenUrls = new Set();
        for (const s of sources) {
          if (s.url && !seenUrls.has(s.url)) {
            seenUrls.add(s.url);
            uniqueSources.push(s);
          }
        }

        if (uniqueSources.length > 0) {
          formattedText += '\n\n**Sources & Citations:**\n' + 
            uniqueSources.slice(0, 5).map(s => `- [${s.title}](${s.url})`).join('\n');
        }
      }

      return {
        query,
        summary: formattedText,
        sources
      };
    } catch (err) {
      console.error('[Gemini Provider] Google Search error:', err);
      throw new Error('Google AI Search grounding failed: ' + err.message);
    }
  }

  /**
   * AI Spam Review when a post drops below 0 net score
   */
  async reviewPostForSpam({ content, authorName, boardName, score }) {
    const client = this.getClient();

    const prompt = `You are the content moderation AI for the Community AI Archive forum.
A post by "${authorName}" in board "${boardName}" has received negative community votes (current score: ${score}).

POST CONTENT:
"""
${content}
"""

Evaluate whether this post is spam, automated bot promotion, scam, illegal content, or malicious harassment.
Respond ONLY with a JSON object in this exact schema:
{
  "is_spam": boolean,
  "confidence": number between 0 and 1,
  "reasoning": "brief 1-2 sentence explanation"
}`;

    try {
      const response = await client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const raw = response.text?.trim() || '{}';
      const parsed = JSON.parse(raw);
      return {
        is_spam: Boolean(parsed.is_spam),
        confidence: Number(parsed.confidence) || 0,
        reasoning: parsed.reasoning || 'Automated review completed'
      };
    } catch (err) {
      console.warn('[Gemini Provider] Spam review failed, skipping:', err.message);
      return {
        is_spam: false,
        confidence: 0,
        reasoning: 'Review failed: ' + err.message
      };
    }
  }

  /**
   * Extract proposed board name and description when suggestion reaches 10 votes
   */
  async extractProposedBoard({ threadTitle, postContent }) {
    const client = this.getClient();

    const prompt = `A community member posted a suggestion to create a new board in the forum, and it has reached 10 upvotes.
THREAD TITLE: "${threadTitle}"
POST CONTENT: "${postContent}"

Extract a clean, concise board name (2 to 5 words max) and a 1-sentence description.
Respond ONLY with a JSON object in this exact schema:
{
  "name": "Board Name",
  "description": "Short description of what the board is for.",
  "category": "Interests"
}`;

    try {
      const response = await client.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const raw = response.text?.trim() || '{}';
      return JSON.parse(raw);
    } catch (err) {
      console.error('[Gemini Provider] Board extraction error:', err);
      // Fallback to title
      return {
        name: threadTitle.slice(0, 30),
        description: 'User created community board from popular suggestion.',
        category: 'Community'
      };
    }
  }
}

module.exports = new GeminiProvider();
