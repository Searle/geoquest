/**
 * Text-to-Speech utility using the Web Speech API
 * Handles pronunciation in different languages based on text content
 */

export interface SpeechOptions {
    /** Language code (e.g., 'de-DE', 'en-US') */
    lang?: string;
    /** Speech rate (0.1 to 10, default 1) */
    rate?: number;
    /** Speech pitch (0 to 2, default 1) */
    pitch?: number;
    /** Speech volume (0 to 1, default 1) */
    volume?: number;
}

// Cache for loaded voices by language
const voiceCache = new Map<string, SpeechSynthesisVoice | null>();
let voicesLoaded = false;

// Cache for pre-created utterances by language
const utteranceCache = new Map<string, SpeechSynthesisUtterance>();

/**
 * Get the best voice for a given language
 * @param lang - BCP 47 language code (e.g., 'de-DE', 'en-US')
 * @returns The best matching voice or null
 */
const getVoiceForLanguage = (lang: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) {
        return null;
    }

    // Check cache first
    if (voiceCache.has(lang)) {
        return voiceCache.get(lang) || null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        return null;
    }

    // Try to find a voice that matches the language exactly
    let voice = voices.find((v) => v.lang === lang);

    // If not found, try to find a voice that starts with the language code (e.g., 'de' for 'de-DE')
    if (!voice) {
        const langPrefix = lang.split('-')[0];
        voice = voices.find((v) => v.lang.startsWith(langPrefix));
    }

    // Prefer local voices over remote ones for faster response
    if (voice && !voice.localService) {
        const localVoice = voices.find((v) => v.lang.startsWith(lang.split('-')[0]) && v.localService);
        if (localVoice) {
            voice = localVoice;
        }
    }

    // Cache the result
    voiceCache.set(lang, voice || null);
    return voice || null;
};

/**
 * Initialize and pre-load voices for faster first use
 * Call this on app startup
 */
export const initializeTTS = (): Promise<void> => {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            resolve();
            return;
        }

        // Voices might load asynchronously
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voicesLoaded = true;

                // Pre-cache common languages
                getVoiceForLanguage('de-DE');
                getVoiceForLanguage('en-US');

                // Prime the speech synthesis with a silent utterance
                // This helps reduce delay on first actual use
                const utterance = new SpeechSynthesisUtterance('');
                utterance.volume = 0;
                utterance.rate = 10; // Make it fast since it's silent
                window.speechSynthesis.speak(utterance);

                resolve();
            }
        };

        // Try to load voices immediately
        loadVoices();

        // Also listen for the voiceschanged event in case they load async
        if (!voicesLoaded) {
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
            // Timeout fallback
            setTimeout(resolve, 1000);
        }
    });
};

/**
 * Speaks the given text using the Web Speech API
 * @param text - The text to speak
 * @param options - Speech options including language
 */
export const speak = (text: string, options: SpeechOptions = {}): void => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis is not supported in this browser');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply options
    if (options.lang) {
        utterance.lang = options.lang;
        // Try to set a specific voice for better performance
        const voice = getVoiceForLanguage(options.lang);
        if (voice) {
            utterance.voice = voice;
        }
    }
    if (options.rate !== undefined) {
        utterance.rate = options.rate;
    }
    if (options.pitch !== undefined) {
        utterance.pitch = options.pitch;
    }
    if (options.volume !== undefined) {
        utterance.volume = options.volume;
    }

    // Speak
    window.speechSynthesis.speak(utterance);
};

/**
 * Stops any currently playing speech
 */
export const stopSpeaking = (): void => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

/**
 * Get or create a cached utterance for a given language
 * @param lang - BCP 47 language code
 * @returns A reusable utterance for this language
 */
const getOrCreateUtterance = (lang: string): SpeechSynthesisUtterance => {
    let utterance = utteranceCache.get(lang);

    if (!utterance) {
        utterance = new SpeechSynthesisUtterance();
        utterance.lang = lang;

        const voice = getVoiceForLanguage(lang);
        if (voice) {
            utterance.voice = voice;
        }

        utteranceCache.set(lang, utterance);
    }

    return utterance;
};

/**
 * Speaks multiple text segments in sequence, each with their own language
 * @param segments - Array of { text, lang } objects to speak in order
 * @param options - Common speech options (rate, pitch, volume) applied to all segments
 */
export const speakSequence = (
    segments: Array<{ text: string; lang: string }>,
    options: Omit<SpeechOptions, 'lang'> = {},
): void => {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis is not supported in this browser');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Speak segments recursively
    const speakSegment = (index: number) => {
        if (index >= segments.length) return;

        const segment = segments[index];

        // Get cached utterance for this language
        const utterance = getOrCreateUtterance(segment.lang);

        // Update text for this segment
        utterance.text = segment.text;

        // Apply common options
        utterance.rate = options.rate ?? 1;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;

        // When this segment ends, speak the next one
        utterance.onend = () => {
            speakSegment(index + 1);
        };

        // Handle errors
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            // Try to continue with next segment even if this one fails
            speakSegment(index + 1);
        };

        window.speechSynthesis.speak(utterance);
    };

    // Start speaking from the first segment
    speakSegment(0);
};

/**
 * Determines the appropriate language code for TTS based on the translation language code
 * @param translationLang - The translation language code (e.g., 'deu', 'eng')
 * @returns BCP 47 language tag for TTS (e.g., 'de-DE', 'en-US')
 */
export const getLanguageCodeForTTS = (translationLang: string): string => {
    const languageMap: Record<string, string> = {
        deu: 'de-DE', // German
        eng: 'en-US', // English
    };

    return languageMap[translationLang] || 'en-US';
};
