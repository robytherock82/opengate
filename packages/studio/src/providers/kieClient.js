import {
  getAudioModelById,
  getI2IModelById,
  getI2VModelById,
  getLipSyncModelById,
  getModelById,
  getV2VModelById,
  getVideoModelById,
} from '../models.js';

const isHttpBrowser = typeof window !== 'undefined' && window.location?.protocol?.startsWith('http');
const KIE_API_BASE = isHttpBrowser ? '/api/kie' : 'https://api.kie.ai';
const KIE_UPLOAD_BASE = isHttpBrowser ? '/api/kie-upload' : 'https://kieai.redpandaai.co';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function authHeaders(apiKey, extra = {}) {
  if (!apiKey) throw new Error('Kie API key missing. Please set it in Settings.');
  return {
    ...extra,
    Authorization: `Bearer ${apiKey}`,
  };
}

async function readError(response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.msg || json.message || json.error || text;
  } catch (error) {
    return text;
  }
}

function parseJsonMaybe(value) {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

function firstUrlFrom(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find(Boolean) || null;
  return (
    firstUrlFrom(value.resultUrls) ||
    firstUrlFrom(value.fullResultUrls) ||
    firstUrlFrom(value.originUrls) ||
    firstUrlFrom(value.urls) ||
    firstUrlFrom(value.outputs) ||
    firstUrlFrom(value.output) ||
    value.url ||
    value.videoUrl ||
    value.imageUrl ||
    value.audioUrl ||
    value.fileUrl ||
    value.downloadUrl ||
    null
  );
}

function normalizeCompletedResult(raw, taskId) {
  const data = raw?.data || raw;
  const resultJson = parseJsonMaybe(data?.resultJson);
  const response = data?.response || data?.videoInfo || data?.audioInfo || resultJson || data;
  const url = firstUrlFrom(response) || firstUrlFrom(resultJson) || firstUrlFrom(data);
  const outputs = Array.isArray(response?.resultUrls)
    ? response.resultUrls
    : Array.isArray(resultJson?.resultUrls)
      ? resultJson.resultUrls
      : url ? [url] : [];

  return {
    ...data,
    url,
    outputs,
    request_id: taskId || data?.taskId,
    provider: 'kie',
    raw,
  };
}

function isMarketComplete(data) {
  const state = (data?.state || data?.status || '').toString().toLowerCase();
  return ['success', 'completed', 'succeeded'].includes(state);
}

function isMarketFailed(data) {
  const state = (data?.state || data?.status || '').toString().toLowerCase();
  return ['fail', 'failed', 'error'].includes(state);
}

async function pollMarketTask(taskId, apiKey, maxAttempts = 900, interval = 2000) {
  const url = `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(interval);
    const response = await fetch(url, { headers: authHeaders(apiKey) });
    if (!response.ok) {
      if (response.status >= 500) continue;
      throw new Error(`Kie poll failed: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
    }
    const raw = await response.json();
    const data = raw.data || raw;
    if (isMarketComplete(data)) return normalizeCompletedResult(raw, taskId);
    if (isMarketFailed(data)) throw new Error(`Kie generation failed: ${data.failMsg || data.error || data.msg || 'Unknown error'}`);
  }
  throw new Error('Kie generation timed out after polling.');
}

async function pollRunwayTask(taskId, apiKey, maxAttempts = 900, interval = 2000) {
  const url = `${KIE_API_BASE}/api/v1/runway/record-detail?taskId=${encodeURIComponent(taskId)}`;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(interval);
    const response = await fetch(url, { headers: authHeaders(apiKey) });
    if (!response.ok) {
      if (response.status >= 500) continue;
      throw new Error(`Kie Runway poll failed: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
    }
    const raw = await response.json();
    const data = raw.data || raw;
    if (isMarketComplete(data)) return normalizeCompletedResult(raw, taskId);
    if (isMarketFailed(data)) throw new Error(`Kie Runway generation failed: ${data.failMsg || data.error || 'Unknown error'}`);
  }
  throw new Error('Kie Runway generation timed out after polling.');
}

async function pollVeoTask(taskId, apiKey, maxAttempts = 900, interval = 2000) {
  const url = `${KIE_API_BASE}/api/v1/veo/record-info?taskId=${encodeURIComponent(taskId)}`;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(interval);
    const response = await fetch(url, { headers: authHeaders(apiKey) });
    if (!response.ok) {
      if (response.status >= 500) continue;
      throw new Error(`Kie Veo poll failed: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
    }
    const raw = await response.json();
    const data = raw.data || raw;
    if (data.successFlag === 1) return normalizeCompletedResult(raw, taskId);
    if (data.successFlag === 2 || data.successFlag === 3) {
      throw new Error(`Kie Veo generation failed: ${data.errorMessage || data.errorCode || 'Unknown error'}`);
    }
  }
  throw new Error('Kie Veo generation timed out after polling.');
}

function addIfPresent(target, key, value) {
  if (value !== undefined && value !== null && value !== '') target[key] = value;
}

function normalizeDuration(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function buildMarketInput(modelInfo, params = {}) {
  const input = { ...(modelInfo?.kie?.defaults || {}) };
  addIfPresent(input, 'prompt', params.prompt);
  addIfPresent(input, 'aspect_ratio', params.aspect_ratio);
  addIfPresent(input, 'duration', params.duration);
  addIfPresent(input, 'quality', params.quality);
  addIfPresent(input, 'resolution', params.resolution);
  addIfPresent(input, 'mode', params.mode);
  addIfPresent(input, 'seed', params.seed !== -1 ? params.seed : undefined);
  addIfPresent(input, 'name', params.name);
  addIfPresent(input, 'audio_url', params.audio_url);

  const imageField = modelInfo?.kie?.imageField || modelInfo?.imageField || 'image_urls';
  const videoField = modelInfo?.kie?.videoField || modelInfo?.videoField || 'video_url';
  const images = params.images_list?.length ? params.images_list : params.image_url ? [params.image_url] : [];
  const videos = params.video_files?.length ? params.video_files : params.video_url ? [params.video_url] : [];

  if (images.length) {
    if (imageField.endsWith('s') || imageField === 'input_urls' || imageField === 'image_input') input[imageField] = images;
    else input[imageField] = images[0];
  }
  if (params.last_image) {
    if (!input[imageField] || !Array.isArray(input[imageField])) input[imageField] = images.slice(0, 1);
    input[imageField].push(params.last_image);
  }
  if (videos.length) {
    if (videoField.endsWith('s')) input[videoField] = videos;
    else input[videoField] = videos[0];
  }

  for (const [key, value] of Object.entries(params)) {
    if (['model', '_modelId', 'onRequestId', 'image_url', 'images_list', 'last_image', 'video_url', 'video_files'].includes(key)) continue;
    addIfPresent(input, key, value);
  }
  return input;
}

function buildRunwayPayload(params = {}) {
  return {
    prompt: params.prompt,
    imageUrl: params.image_url || params.images_list?.[0],
    duration: normalizeDuration(params.duration || 5),
    quality: params.quality || params.resolution || '720p',
    aspectRatio: params.aspect_ratio || '16:9',
    waterMark: params.waterMark || params.watermark || '',
  };
}

function buildVeoPayload(modelInfo, params = {}) {
  const images = params.images_list?.length ? params.images_list : params.image_url ? [params.image_url] : [];
  return {
    prompt: params.prompt,
    imageUrls: images,
    model: modelInfo?.kie?.model || modelInfo?.endpoint || params.model,
    watermark: params.watermark || params.waterMark || '',
    aspect_ratio: params.aspect_ratio || '16:9',
    enableFallback: params.enableFallback ?? false,
    enableTranslation: params.enableTranslation ?? true,
    generationType: modelInfo?.kie?.defaults?.generationType || (images.length ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'TEXT_2_VIDEO'),
  };
}

async function submitMarket(modelInfo, apiKey, params = {}, maxAttempts = 900) {
  const payload = {
    model: modelInfo?.kie?.model || modelInfo?.endpoint || params.model,
    input: buildMarketInput(modelInfo, params),
  };
  const response = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: authHeaders(apiKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Kie request failed: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
  const data = await response.json();
  const taskId = data?.data?.taskId || data?.taskId || data?.id;
  if (!taskId) return normalizeCompletedResult(data);
  if (params.onRequestId) params.onRequestId(taskId);
  return pollMarketTask(taskId, apiKey, maxAttempts);
}

async function submitRunway(apiKey, params = {}) {
  const response = await fetch(`${KIE_API_BASE}/api/v1/runway/generate`, {
    method: 'POST',
    headers: authHeaders(apiKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(buildRunwayPayload(params)),
  });
  if (!response.ok) throw new Error(`Kie Runway request failed: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
  const data = await response.json();
  const taskId = data?.data?.taskId || data?.taskId || data?.id;
  if (!taskId) return normalizeCompletedResult(data);
  if (params.onRequestId) params.onRequestId(taskId);
  return pollRunwayTask(taskId, apiKey);
}

async function submitVeo(modelInfo, apiKey, params = {}) {
  const response = await fetch(`${KIE_API_BASE}/api/v1/veo/generate`, {
    method: 'POST',
    headers: authHeaders(apiKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(buildVeoPayload(modelInfo, params)),
  });
  if (!response.ok) throw new Error(`Kie Veo request failed: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
  const data = await response.json();
  const taskId = data?.data?.taskId || data?.taskId || data?.id;
  if (!taskId) return normalizeCompletedResult(data);
  if (params.onRequestId) params.onRequestId(taskId);
  return pollVeoTask(taskId, apiKey);
}

async function generateWithModel(modelInfo, apiKey, params, maxAttempts = 900) {
  const strategy = modelInfo?.kie?.strategy || modelInfo?.kie?.defaults?.strategy || 'market';
  if (strategy === 'runway') return submitRunway(apiKey, params);
  if (strategy === 'veo') return submitVeo(modelInfo, apiKey, params);
  if (strategy === 'veoExtend') return submitVeo(modelInfo, apiKey, params);
  return submitMarket(modelInfo, apiKey, params, maxAttempts);
}

export async function generateImage(apiKey, params) {
  return generateWithModel(getModelById(params.model), apiKey, params, 900);
}

export async function generateI2I(apiKey, params) {
  return generateWithModel(getI2IModelById(params.model), apiKey, params, 900);
}

export async function generateVideo(apiKey, params) {
  return generateWithModel(getVideoModelById(params.model), apiKey, params, 900);
}

export async function generateI2V(apiKey, params) {
  return generateWithModel(getI2VModelById(params.model), apiKey, params, 900);
}

export async function processV2V(apiKey, params) {
  return generateWithModel(getV2VModelById(params.model), apiKey, params, 900);
}

export async function processLipSync(apiKey, params) {
  return generateWithModel(getLipSyncModelById(params.model), apiKey, params, 900);
}

export async function generateAudio(apiKey, params) {
  const modelId = params._modelId || params.model;
  return generateWithModel(getAudioModelById(modelId), apiKey, { ...params, model: modelId }, 900);
}

export async function generateMarketingStudioAd(apiKey, params) {
  const modelInfo = getVideoModelById('kie-bytedance-seedance-2') || getVideoModelById('kie-runway-generate');
  return generateWithModel(modelInfo, apiKey, {
    ...params,
    model: modelInfo?.id,
    images_list: params.images_list || [],
    video_files: params.video_files || [],
  }, 900);
}

export async function runClipping() {
  throw new Error('Kie provider does not expose a documented AI clipping endpoint in the current catalog. Switch to MuAPI for AI Clipping.');
}

export async function runMotionGraphics() {
  throw new Error('Kie provider does not expose a documented Vibe Motion endpoint in the current catalog. Switch to MuAPI for Vibe Motion.');
}

export async function runMotionGraphicsEdit() {
  throw new Error('Kie provider does not expose a documented Vibe Motion edit endpoint in the current catalog. Switch to MuAPI for Vibe Motion.');
}

export function uploadFile(apiKey, file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadPath', file?.type?.startsWith('video/') ? 'videos/user-uploads' : file?.type?.startsWith('audio/') ? 'audios/user-uploads' : 'images/user-uploads');
    if (file?.name) formData.append('fileName', file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${KIE_UPLOAD_BASE}/api/file-stream-upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const url = data?.data?.fileUrl || data?.data?.downloadUrl || data?.fileUrl || data?.downloadUrl;
          if (!url) reject(new Error('No URL returned from Kie file upload'));
          else resolve(url);
        } catch (error) {
          reject(new Error('Failed to parse Kie upload response'));
        }
      } else {
        reject(new Error(`Kie file upload failed: ${xhr.status} - ${xhr.responseText?.slice(0, 160) || xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during Kie file upload'));
    xhr.send(formData);
  });
}

export async function getUserBalance(apiKey) {
  const response = await fetch(`${KIE_API_BASE}/api/v1/chat/credit`, {
    headers: authHeaders(apiKey),
  });
  if (!response.ok) throw new Error(`Failed to fetch Kie credits: ${response.status} - ${(await readError(response)).slice(0, 160)}`);
  const data = await response.json();
  return {
    balance: data?.data ?? data?.balance ?? data?.credits ?? 0,
    provider: 'kie',
    raw: data,
  };
}
