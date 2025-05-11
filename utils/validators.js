const isValidUrl = (url) => {
    try {
        new URL(url);
        return url.includes('youtube.com') || url.includes('youtu.be');
    } catch {
        return false;
    }
};

const isValidFormat = (format) => {
    // Common format patterns: best, worst, format_id, or format code
    return /^(best|worst|\d+|[a-zA-Z0-9_-]+)$/.test(format);
};

const isValidLanguage = (lang) => {
    // ISO 639-1 language codes
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(lang);
};

module.exports = {
    isValidUrl,
    isValidFormat,
    isValidLanguage
}; 