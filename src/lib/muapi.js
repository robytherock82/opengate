import {
    generateI2I,
    generateI2V,
    generateImage,
    generateVideo,
    processLipSync,
    processV2V,
    uploadFile,
} from 'studio/src/muapi.js';
import { pollForResult as pollMuapiForResult } from 'studio/src/providers/muapiClient.js';
import { getActiveProviderId, getProviderKey } from 'studio/src/providers/storage.js';

export class MuapiClient {
    getKey() {
        const providerId = getActiveProviderId();
        const key = window.__MUAPI_KEY__ || getProviderKey(providerId);
        if (!key) throw new Error(`${providerId === 'kie' ? 'Kie' : 'MuAPI'} API Key missing. Please set it in Settings.`);
        return key;
    }

    async generateImage(params) {
        return generateImage(this.getKey(), params);
    }

    async generateVideo(params) {
        return generateVideo(this.getKey(), params);
    }

    async generateI2I(params) {
        return generateI2I(this.getKey(), params);
    }

    async generateI2V(params) {
        return generateI2V(this.getKey(), params);
    }

    async uploadFile(file, onProgress) {
        return uploadFile(this.getKey(), file, onProgress);
    }

    async processV2V(params) {
        return processV2V(this.getKey(), params);
    }

    async processLipSync(params) {
        return processLipSync(this.getKey(), params);
    }

    async pollForResult(requestId, key, maxAttempts = 900, interval = 2000) {
        if (getActiveProviderId() !== 'muapi') {
            throw new Error('Pending job resume is not available for Kie jobs yet. Start a new generation instead.');
        }
        return pollMuapiForResult(requestId, key || this.getKey(), maxAttempts, interval);
    }

    getDimensionsFromAR(ar) {
        switch (ar) {
            case '1:1': return [1024, 1024];
            case '16:9': return [1280, 720];
            case '9:16': return [720, 1280];
            case '4:3': return [1152, 864];
            case '3:2': return [1216, 832];
            case '21:9': return [1536, 640];
            default: return [1024, 1024];
        }
    }
}

export const muapi = new MuapiClient();
