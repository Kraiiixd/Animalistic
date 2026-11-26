/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const cache = new Map();

const MESSAGES = {
    sharp: 'sharp is an optional dependency. Install it with: npm i sharp',
    'fluent-ffmpeg': 'fluent-ffmpeg is an optional dependency. Install it with: npm i fluent-ffmpeg'
};

const isMissingModule = (error, name) => {
    const code = error?.code;
    if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') {
        return false;
    }
    const message = String(error?.message ?? '');
    return message.includes(`'${name}'`) || message.includes(`"${name}"`);
};

const loadOptional = async (name) => {
    if (!cache.has(name)) {
        try {
            const loaded = await import(name);
            cache.set(name, loaded?.default ?? loaded);
        } catch (error) {
            try {
                // CommonJS fallback if import fails in certain environments
                const loaded = require(name);
                cache.set(name, loaded?.default ?? loaded);
            } catch (err2) {
                cache.delete(name);
                if (isMissingModule(error, name) || isMissingModule(err2, name)) {
                    throw new Error(MESSAGES[name] ?? `${name} is an optional dependency. Install it with: npm i ${name}`);
                }
                throw error;
            }
        }
    }
    return cache.get(name);
};

export const loadSharp = () => loadOptional('sharp');

export const loadFfmpeg = () => loadOptional('fluent-ffmpeg');

export const hasOptionalMedia = async (name) => {
    try {
        await loadOptional(name);
        return true;
    } catch {
        return false;
    }
};
