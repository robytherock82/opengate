const imageRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '21:9'];
const videoRatios = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'];

const promptInput = { type: 'string', title: 'Prompt', name: 'prompt', description: 'Generation prompt.' };
const aspectInput = (values, fallback) => ({
  enum: values,
  title: 'Aspect Ratio',
  name: 'aspect_ratio',
  type: 'string',
  description: 'Output aspect ratio.',
  default: fallback,
});
const durationInput = (values = [5, 10], fallback = 5) => ({
  enum: values,
  title: 'Duration',
  name: 'duration',
  type: 'int',
  description: 'Output duration in seconds.',
  default: fallback,
});
const qualityInput = (values = ['720p', '1080p'], fallback = '720p') => ({
  enum: values,
  title: 'Quality',
  name: 'quality',
  type: 'string',
  description: 'Output quality.',
  default: fallback,
});
const resolutionInput = (values = ['720p', '1080p'], fallback = '720p') => ({
  enum: values,
  title: 'Resolution',
  name: 'resolution',
  type: 'string',
  description: 'Output resolution.',
  default: fallback,
});

function kieModel({ id, name, model, capability, family, strategy = 'market', imageField, videoField, maxImages, lastImageField, defaults = {}, inputs = {} }) {
  const cleanInputs = Object.fromEntries(
    Object.entries({
      prompt: promptInput,
      ...inputs,
    }).filter(([, value]) => value)
  );
  return {
    id,
    name,
    endpoint: model,
    provider: 'kie',
    family,
    capability,
    imageField,
    videoField,
    maxImages,
    lastImageField,
    required: ['prompt'],
    inputs: cleanInputs,
    kie: {
      strategy,
      model,
      defaults,
      imageField,
      videoField,
      maxImages,
      lastImageField,
    },
  };
}

function t2i(id, name, model, family, defaults = {}) {
  return kieModel({
    id,
    name,
    model,
    family,
    capability: 't2i',
    defaults,
    inputs: {
      aspect_ratio: aspectInput(imageRatios, defaults.aspect_ratio || '1:1'),
      quality: defaults.quality ? { enum: ['basic', 'standard', 'hd'], title: 'Quality', name: 'quality', type: 'string', default: defaults.quality } : undefined,
      resolution: defaults.resolution ? { enum: ['1K', '2K', '4K'], title: 'Resolution', name: 'resolution', type: 'string', default: defaults.resolution } : undefined,
    },
  });
}

function i2i(id, name, model, family, imageField = 'input_urls', maxImages = 4, defaults = {}) {
  return kieModel({
    id,
    name,
    model,
    family,
    capability: 'i2i',
    imageField,
    maxImages,
    defaults,
    inputs: {
      aspect_ratio: aspectInput(imageRatios, defaults.aspect_ratio || '1:1'),
      resolution: defaults.resolution ? { enum: ['1K', '2K', '4K'], title: 'Resolution', name: 'resolution', type: 'string', default: defaults.resolution } : undefined,
    },
  });
}

function t2v(id, name, model, family, defaults = {}) {
  return kieModel({
    id,
    name,
    model,
    family,
    capability: 't2v',
    strategy: defaults.strategy || 'market',
    defaults,
    inputs: {
      aspect_ratio: aspectInput(videoRatios, defaults.aspect_ratio || '16:9'),
      duration: durationInput(defaults.durations || [5, 10], defaults.duration || 5),
      quality: qualityInput(defaults.qualities || ['720p', '1080p'], defaults.quality || '720p'),
      resolution: resolutionInput(defaults.resolutions || ['720p', '1080p'], defaults.resolution || '720p'),
      mode: defaults.modes ? { enum: defaults.modes, title: 'Mode', name: 'mode', type: 'string', default: defaults.modes[0] } : undefined,
    },
  });
}

function i2v(id, name, model, family, imageField = 'image_urls', maxImages = 1, defaults = {}) {
  return kieModel({
    id,
    name,
    model,
    family,
    capability: 'i2v',
    strategy: defaults.strategy || 'market',
    imageField,
    maxImages,
    lastImageField: defaults.lastImageField,
    defaults,
    inputs: {
      aspect_ratio: aspectInput(videoRatios, defaults.aspect_ratio || '16:9'),
      duration: durationInput(defaults.durations || [5, 10], defaults.duration || 5),
      quality: qualityInput(defaults.qualities || ['720p', '1080p'], defaults.quality || '720p'),
      resolution: resolutionInput(defaults.resolutions || ['720p', '1080p'], defaults.resolution || '720p'),
      mode: defaults.modes ? { enum: defaults.modes, title: 'Mode', name: 'mode', type: 'string', default: defaults.modes[0] } : undefined,
    },
  });
}

function v2v(id, name, model, family, videoField = 'video_url', defaults = {}) {
  return kieModel({
    id,
    name,
    model,
    family,
    capability: 'v2v',
    strategy: defaults.strategy || 'market',
    videoField,
    imageField: defaults.imageField,
    maxImages: defaults.maxImages,
    defaults,
    inputs: {
      prompt: { ...promptInput, description: 'Optional edit prompt.' },
      aspect_ratio: aspectInput(videoRatios, defaults.aspect_ratio || '16:9'),
      quality: qualityInput(defaults.qualities || ['720p', '1080p'], defaults.quality || '720p'),
      mode: defaults.modes ? { enum: defaults.modes, title: 'Mode', name: 'mode', type: 'string', default: defaults.modes[0] } : undefined,
    },
  });
}

function lipsync(id, name, model, family, category = 'image', defaults = {}) {
  return {
    ...kieModel({
      id,
      name,
      model,
      family,
      capability: 'lipsync',
      imageField: category === 'image' ? 'image_url' : undefined,
      videoField: category === 'video' ? 'video_url' : undefined,
      defaults,
      inputs: {
        resolution: resolutionInput(defaults.resolutions || ['720p', '1080p'], defaults.resolution || '720p'),
      },
    }),
    category,
    hasPrompt: true,
  };
}

function audio(id, name, model, family, defaults = {}) {
  return kieModel({
    id,
    name,
    model,
    family,
    capability: 'audio',
    defaults,
    inputs: {
      prompt: promptInput,
      duration: durationInput(defaults.durations || [30, 60, 120], defaults.duration || 30),
      style: { type: 'string', title: 'Style', name: 'style', description: 'Music or voice style.' },
    },
  });
}

export const kieT2IModels = [
  t2i('kie-seedream-3-t2i', 'Kie Seedream 3.0', 'seedream', 'seedream'),
  t2i('kie-seedream-4-t2i', 'Kie Seedream 4.0', 'seedream/4.0-text-to-image', 'seedream'),
  t2i('kie-seedream-4-5-t2i', 'Kie Seedream 4.5', 'seedream/4.5-text-to-image', 'seedream', { quality: 'basic' }),
  t2i('kie-seedream-5-lite-t2i', 'Kie Seedream 5.0 Lite', 'seedream/5-lite-text-to-image', 'seedream'),
  t2i('kie-z-image', 'Kie Z-Image', 'z-image', 'z-image'),
  t2i('kie-google-imagen4-fast', 'Kie Google Imagen 4 Fast', 'google/imagen4-fast', 'google'),
  t2i('kie-google-imagen4', 'Kie Google Imagen 4', 'google/imagen4', 'google'),
  t2i('kie-google-imagen4-ultra', 'Kie Google Imagen 4 Ultra', 'google/imagen4-ultra', 'google'),
  t2i('kie-google-nano-banana', 'Kie Google Nano Banana', 'google/nano-banana', 'google'),
  t2i('kie-google-nano-banana-pro', 'Kie Google Nano Banana Pro', 'nano-banana-pro', 'google', { resolution: '1K' }),
  t2i('kie-google-nano-banana-2', 'Kie Google Nano Banana 2', 'google/nano-banana-2', 'google'),
  t2i('kie-flux-2-t2i', 'Kie Flux 2', 'flux-2/text-to-image', 'flux-2'),
  t2i('kie-flux-2-pro-t2i', 'Kie Flux 2 Pro', 'flux-2/pro-text-to-image', 'flux-2'),
  t2i('kie-grok-imagine-t2i', 'Kie Grok Imagine Text to Image', 'grok-imagine/text-to-image', 'grok-imagine'),
  t2i('kie-gpt-image-1-5-t2i', 'Kie GPT Image 1.5', 'gpt-image/1.5-text-to-image', 'gpt-image'),
  t2i('kie-gpt-image-2-t2i', 'Kie GPT Image 2', 'gpt-image/2-text-to-image', 'gpt-image'),
  t2i('kie-ideogram-v3-t2i', 'Kie Ideogram V3', 'ideogram/v3-text-to-image', 'ideogram'),
  t2i('kie-qwen-t2i', 'Kie Qwen Text to Image', 'qwen/text-to-image', 'qwen'),
  t2i('kie-qwen2-t2i', 'Kie Qwen2 Text to Image', 'qwen2/text-to-image', 'qwen'),
];

export const kieI2IModels = [
  i2i('kie-seedream-4-edit', 'Kie Seedream 4.0 Edit', 'seedream/4.0-edit', 'seedream', 'image_urls'),
  i2i('kie-seedream-4-5-edit', 'Kie Seedream 4.5 Edit', 'seedream/4.5-edit', 'seedream', 'image_urls'),
  i2i('kie-seedream-5-lite-i2i', 'Kie Seedream 5.0 Lite I2I', 'seedream/5-lite-image-to-image', 'seedream', 'image_urls'),
  i2i('kie-google-nano-banana-edit', 'Kie Google Nano Banana Edit', 'google/nano-banana-edit', 'google', 'image_urls'),
  i2i('kie-google-nano-banana-pro-i2i', 'Kie Google Nano Banana Pro I2I', 'nano-banana-pro', 'google', 'image_input', 8, { resolution: '1K' }),
  i2i('kie-flux-2-i2i', 'Kie Flux 2 Image to Image', 'flux-2/flex-image-to-image', 'flux-2', 'input_urls', 4),
  i2i('kie-flux-2-pro-i2i', 'Kie Flux 2 Pro Image to Image', 'flux-2/pro-image-to-image', 'flux-2', 'input_urls', 4),
  i2i('kie-grok-imagine-i2i', 'Kie Grok Imagine Image to Image', 'grok-imagine/image-to-image', 'grok-imagine', 'image_urls'),
  i2i('kie-gpt-image-1-5-i2i', 'Kie GPT Image 1.5 I2I', 'gpt-image/1.5-image-to-image', 'gpt-image', 'input_urls'),
  i2i('kie-gpt-image-2-i2i', 'Kie GPT Image 2 I2I', 'gpt-image/2-image-to-image', 'gpt-image', 'input_urls'),
  i2i('kie-recraft-remove-bg', 'Kie Recraft Remove Background', 'recraft/remove-background', 'recraft', 'image_urls', 1),
  i2i('kie-recraft-crisp-upscale', 'Kie Recraft Crisp Upscale', 'recraft/crisp-upscale', 'recraft', 'image_urls', 1),
  i2i('kie-topaz-image-upscale', 'Kie Topaz Image Upscale', 'topaz/image-upscale', 'topaz', 'image_urls', 1),
  i2i('kie-ideogram-v3-edit', 'Kie Ideogram V3 Edit', 'ideogram/v3-edit', 'ideogram', 'image_urls', 1),
  i2i('kie-ideogram-v3-remix', 'Kie Ideogram V3 Remix', 'ideogram/v3-remix', 'ideogram', 'image_urls', 1),
  i2i('kie-ideogram-character', 'Kie Ideogram Character', 'ideogram/character', 'ideogram', 'image_urls', 4),
  i2i('kie-ideogram-character-edit', 'Kie Ideogram Character Edit', 'ideogram/character-edit', 'ideogram', 'image_urls', 4),
  i2i('kie-ideogram-character-remix', 'Kie Ideogram Character Remix', 'ideogram/character-remix', 'ideogram', 'image_urls', 4),
  i2i('kie-qwen-i2i', 'Kie Qwen Image to Image', 'qwen/image-to-image', 'qwen', 'image_urls'),
  i2i('kie-qwen-image-edit', 'Kie Qwen Image Edit', 'qwen/image-edit', 'qwen', 'image_urls'),
  i2i('kie-qwen2-image-edit', 'Kie Qwen2 Image Edit', 'qwen2/image-edit', 'qwen', 'image_urls'),
  i2i('kie-wan-2-7-image', 'Kie Wan 2.7 Image', 'wan/2.7-image', 'wan', 'image_urls'),
  i2i('kie-wan-2-7-image-pro', 'Kie Wan 2.7 Image Pro', 'wan/2.7-image-pro', 'wan', 'image_urls'),
];

export const kieT2VModels = [
  t2v('kie-grok-imagine-t2v', 'Kie Grok Imagine Text to Video', 'grok-imagine/text-to-video', 'grok-imagine'),
  t2v('kie-kling-2-6-t2v', 'Kie Kling 2.6 Text to Video', 'kling-2.6/text-to-video', 'kling'),
  t2v('kie-kling-2-5-turbo-t2v-pro', 'Kie Kling 2.5 Turbo T2V Pro', 'kling/v2.5-turbo-text-to-video-pro', 'kling'),
  t2v('kie-kling-2-1-master-t2v', 'Kie Kling 2.1 Master Text to Video', 'kling/v2-1-master-text-to-video', 'kling'),
  t2v('kie-kling-2-1-pro', 'Kie Kling 2.1 Pro', 'kling/v2-1-pro', 'kling'),
  t2v('kie-kling-2-1-standard', 'Kie Kling 2.1 Standard', 'kling/v2-1-standard', 'kling'),
  t2v('kie-kling-3-0', 'Kie Kling 3.0', 'kling/3.0', 'kling', { modes: ['standard', 'pro'] }),
  t2v('kie-kling-v3-turbo-t2v', 'Kie Kling V3 Turbo T2V', 'kling/v3-turbo-text-to-video', 'kling'),
  t2v('kie-bytedance-seedance-2', 'Kie Bytedance Seedance 2.0', 'bytedance/seedance-2', 'bytedance'),
  t2v('kie-bytedance-seedance-2-fast', 'Kie Bytedance Seedance 2.0 Fast', 'bytedance/seedance-2-fast', 'bytedance'),
  t2v('kie-bytedance-seedance-2-mini', 'Kie Bytedance Seedance 2.0 Mini', 'bytedance/seedance-2-mini', 'bytedance'),
  t2v('kie-bytedance-seedance-1-5-pro', 'Kie Bytedance Seedance 1.5 Pro', 'bytedance/seedance-1.5-pro', 'bytedance'),
  t2v('kie-bytedance-v1-pro-t2v', 'Kie Bytedance V1 Pro Text to Video', 'bytedance/v1-pro-text-to-video', 'bytedance'),
  t2v('kie-bytedance-v1-lite-t2v', 'Kie Bytedance V1 Lite Text to Video', 'bytedance/v1-lite-text-to-video', 'bytedance'),
  t2v('kie-hailuo-pro-t2v', 'Kie Hailuo Pro Text to Video', 'hailuo/pro-text-to-video', 'hailuo'),
  t2v('kie-hailuo-standard-t2v', 'Kie Hailuo Standard Text to Video', 'hailuo/standard-text-to-video', 'hailuo'),
  t2v('kie-wan-t2v', 'Kie Wan Text to Video', 'wan/text-to-video', 'wan'),
  t2v('kie-wan-2-6-t2v', 'Kie Wan 2.6 Text to Video', 'wan/2.6-text-to-video', 'wan'),
  t2v('kie-wan-2-7-t2v', 'Kie Wan 2.7 Text to Video', 'wan/2.7-text-to-video', 'wan'),
  t2v('kie-runway-generate', 'Kie Runway Generate Video', 'runway/generate', 'runway', { strategy: 'runway' }),
  t2v('kie-happyhorse-t2v', 'Kie HappyHorse Text to Video', 'happyhorse/text-to-video', 'happyhorse'),
  t2v('kie-happyhorse-1-1-t2v', 'Kie HappyHorse 1.1 Text to Video', 'happyhorse-1-1/text-to-video', 'happyhorse'),
  t2v('kie-gemini-omni-video', 'Kie Gemini Omni Video', 'gemini-omni-video', 'gemini-omni'),
  t2v('kie-veo-3-1-quality', 'Kie Veo 3.1 Quality', 'veo3_quality', 'veo', { strategy: 'veo', generationType: 'TEXT_2_VIDEO' }),
  t2v('kie-veo-3-1-fast', 'Kie Veo 3.1 Fast', 'veo3_fast', 'veo', { strategy: 'veo', generationType: 'TEXT_2_VIDEO' }),
  t2v('kie-veo-3-1-lite', 'Kie Veo 3.1 Lite', 'veo3_lite', 'veo', { strategy: 'veo', generationType: 'TEXT_2_VIDEO' }),
];

export const kieI2VModels = [
  i2v('kie-grok-imagine-i2v', 'Kie Grok Imagine Image to Video', 'grok-imagine/image-to-video', 'grok-imagine', 'image_urls'),
  i2v('kie-kling-2-6-i2v', 'Kie Kling 2.6 Image to Video', 'kling-2.6/image-to-video', 'kling', 'image_urls'),
  i2v('kie-kling-2-5-turbo-i2v-pro', 'Kie Kling 2.5 Turbo I2V Pro', 'kling/v2.5-turbo-image-to-video-pro', 'kling', 'image_urls'),
  i2v('kie-kling-2-1-master-i2v', 'Kie Kling 2.1 Master Image to Video', 'kling/v2-1-master-image-to-video', 'kling', 'image_urls'),
  i2v('kie-kling-v3-turbo-i2v', 'Kie Kling V3 Turbo I2V', 'kling/v3-turbo-image-to-video', 'kling', 'image_urls'),
  i2v('kie-bytedance-v1-pro-i2v-fast', 'Kie Bytedance V1 Pro Fast I2V', 'bytedance/v1-pro-fast-image-to-video', 'bytedance', 'image_urls'),
  i2v('kie-bytedance-v1-pro-i2v', 'Kie Bytedance V1 Pro I2V', 'bytedance/v1-pro-image-to-video', 'bytedance', 'image_urls'),
  i2v('kie-bytedance-v1-lite-i2v', 'Kie Bytedance V1 Lite I2V', 'bytedance/v1-lite-image-to-video', 'bytedance', 'image_urls'),
  i2v('kie-hailuo-2-3-pro-i2v', 'Kie Hailuo 2.3 Pro I2V', 'hailuo/2.3-pro-image-to-video', 'hailuo', 'image_urls'),
  i2v('kie-hailuo-2-3-standard-i2v', 'Kie Hailuo 2.3 Standard I2V', 'hailuo/2.3-standard-image-to-video', 'hailuo', 'image_urls'),
  i2v('kie-hailuo-pro-i2v', 'Kie Hailuo Pro I2V', 'hailuo/pro-image-to-video', 'hailuo', 'image_urls'),
  i2v('kie-hailuo-standard-i2v', 'Kie Hailuo Standard I2V', 'hailuo/standard-image-to-video', 'hailuo', 'image_urls'),
  i2v('kie-wan-i2v', 'Kie Wan Image to Video', 'wan/image-to-video', 'wan', 'image_urls'),
  i2v('kie-wan-2-6-i2v', 'Kie Wan 2.6 Image to Video', 'wan/2.6-image-to-video', 'wan', 'image_urls'),
  i2v('kie-wan-2-6-flash-i2v', 'Kie Wan 2.6 Flash I2V', 'wan/2.6-flash-image-to-video', 'wan', 'image_urls'),
  i2v('kie-wan-2-5-i2v', 'Kie Wan 2.5 Image to Video', 'wan/2.5-image-to-video', 'wan', 'image_urls'),
  i2v('kie-wan-2-7-i2v', 'Kie Wan 2.7 Image to Video', 'wan/2.7-image-to-video', 'wan', 'image_urls'),
  i2v('kie-wan-2-7-reference-to-video', 'Kie Wan 2.7 Reference to Video', 'wan/2.7-reference-to-video', 'wan', 'image_urls', 4),
  i2v('kie-happyhorse-i2v', 'Kie HappyHorse Image to Video', 'happyhorse/image-to-video', 'happyhorse', 'image_urls'),
  i2v('kie-happyhorse-reference-to-video', 'Kie HappyHorse Reference to Video', 'happyhorse/reference-to-video', 'happyhorse', 'image_urls', 4),
  i2v('kie-happyhorse-1-1-i2v', 'Kie HappyHorse 1.1 Image to Video', 'happyhorse-1-1/image-to-video', 'happyhorse', 'image_urls'),
  i2v('kie-happyhorse-1-1-reference-to-video', 'Kie HappyHorse 1.1 Reference to Video', 'happyhorse-1-1/reference-to-video', 'happyhorse', 'image_urls', 4),
  i2v('kie-gemini-omni-character', 'Kie Gemini Omni Character', 'gemini-omni-character', 'gemini-omni', 'image_urls', 4),
  i2v('kie-veo-3-1-fast-i2v', 'Kie Veo 3.1 Fast I2V', 'veo3_fast', 'veo', 'imageUrls', 2, { strategy: 'veo', generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO' }),
  i2v('kie-veo-3-1-lite-i2v', 'Kie Veo 3.1 Lite I2V', 'veo3_lite', 'veo', 'imageUrls', 2, { strategy: 'veo', generationType: 'FIRST_AND_LAST_FRAMES_2_VIDEO' }),
];

export const kieV2VModels = [
  v2v('kie-grok-imagine-video-upscale', 'Kie Grok Imagine Video Upscale', 'grok-imagine/video-upscale', 'grok-imagine', 'video_url'),
  v2v('kie-grok-imagine-video-extend', 'Kie Grok Imagine Video Extend', 'grok-imagine/video-extend', 'grok-imagine', 'video_url'),
  v2v('kie-grok-imagine-video-1-5-preview', 'Kie Grok Imagine Video 1.5 Preview', 'grok-imagine/video-1.5-preview', 'grok-imagine', 'video_url'),
  v2v('kie-kling-2-6-motion-control', 'Kie Kling 2.6 Motion Control', 'kling-2.6/motion-control', 'kling', 'video_urls', { imageField: 'input_urls', maxImages: 1 }),
  v2v('kie-kling-3-motion-control', 'Kie Kling 3.0 Motion Control', 'kling-3.0/motion-control', 'kling', 'video_urls', { imageField: 'input_urls', maxImages: 1 }),
  v2v('kie-wan-animate-move', 'Kie Wan Animate Move', 'wan/animate-move', 'wan', 'video_url', { imageField: 'image_urls' }),
  v2v('kie-wan-animate-replace', 'Kie Wan Animate Replace', 'wan/animate-replace', 'wan', 'video_url', { imageField: 'image_urls' }),
  v2v('kie-wan-2-6-v2v', 'Kie Wan 2.6 Video to Video', 'wan/2.6-video-to-video', 'wan', 'video_url'),
  v2v('kie-wan-2-6-flash-v2v', 'Kie Wan 2.6 Flash Video to Video', 'wan/2.6-flash-video-to-video', 'wan', 'video_url'),
  v2v('kie-wan-2-7-video-edit', 'Kie Wan 2.7 Video Edit', 'wan/2.7-video-edit', 'wan', 'video_url'),
  v2v('kie-topaz-video-upscale', 'Kie Topaz Video Upscale', 'topaz/video-upscale', 'topaz', 'video_url'),
  v2v('kie-happyhorse-video-edit', 'Kie HappyHorse Video Edit', 'happyhorse/video-edit', 'happyhorse', 'video_url'),
  v2v('kie-happyhorse-1-1-video-edit', 'Kie HappyHorse 1.1 Video Edit', 'happyhorse-1-1/video-edit', 'happyhorse', 'video_url'),
  v2v('kie-veo-3-1-extend', 'Kie Veo 3.1 Extend', 'veo3_extend', 'veo', 'video_url', { strategy: 'veoExtend' }),
];

export const kieLipSyncModels = [
  lipsync('kie-kling-avatar-standard', 'Kie Kling AI Avatar Standard', 'kling/ai-avatar-standard', 'kling', 'image'),
  lipsync('kie-kling-avatar-pro', 'Kie Kling AI Avatar Pro', 'kling/ai-avatar-pro', 'kling', 'image'),
  lipsync('kie-wan-2-2-speech-to-video', 'Kie Wan 2.2 Speech to Video Turbo', 'wan/2.2-a14b-speech-to-video-turbo', 'wan', 'image'),
  lipsync('kie-infinitalk-from-audio', 'Kie Infinitalk From Audio', 'infinitalk/from-audio', 'infinitalk', 'video'),
  lipsync('kie-omnihuman-1-5', 'Kie OmniHuman 1.5', 'omnihuman/1.5', 'omnihuman', 'image'),
  lipsync('kie-omnihuman-human-identification', 'Kie OmniHuman Human Identification', 'omnihuman/1.5-human-identification', 'omnihuman', 'image'),
  lipsync('kie-omnihuman-subject-detection', 'Kie OmniHuman Subject Detection', 'omnihuman/1.5-subject-detection', 'omnihuman', 'image'),
  lipsync('kie-volcengine-video-lipsync', 'Kie Volcengine Video Lip Sync', 'volcengine/video-to-video-lip-sync', 'volcengine', 'video'),
];

export const kieAudioModels = [
  audio('kie-elevenlabs-audio-isolation', 'Kie ElevenLabs Audio Isolation', 'elevenlabs/audio-isolation', 'elevenlabs'),
  audio('kie-elevenlabs-text-to-dialogue-v3', 'Kie ElevenLabs Text to Dialogue V3', 'elevenlabs/text-to-dialogue-v3', 'elevenlabs'),
  audio('kie-elevenlabs-tts-multilingual-v2', 'Kie ElevenLabs TTS Multilingual V2', 'elevenlabs/text-to-speech-multilingual-v2', 'elevenlabs'),
  audio('kie-elevenlabs-tts-turbo-2-5', 'Kie ElevenLabs TTS Turbo 2.5', 'elevenlabs/text-to-speech-turbo-2-5', 'elevenlabs'),
  audio('kie-suno-generate-music', 'Kie Suno Generate Music', 'suno/generate-music', 'suno'),
  audio('kie-suno-extend-music', 'Kie Suno Extend Music', 'suno/extend-music', 'suno'),
  audio('kie-suno-upload-cover-audio', 'Kie Suno Upload and Cover Audio', 'suno/upload-and-cover-audio', 'suno'),
  audio('kie-suno-upload-extend-audio', 'Kie Suno Upload and Extend Audio', 'suno/upload-and-extend-audio', 'suno'),
  audio('kie-suno-add-instrumental', 'Kie Suno Add Instrumental', 'suno/add-instrumental', 'suno'),
  audio('kie-suno-add-vocals', 'Kie Suno Add Vocals', 'suno/add-vocals', 'suno'),
  audio('kie-suno-generate-cover', 'Kie Suno Generate Cover', 'suno/generate-cover', 'suno'),
  audio('kie-suno-replace-section', 'Kie Suno Replace Music Section', 'suno/replace-music-section', 'suno'),
  audio('kie-suno-generate-persona', 'Kie Suno Generate Persona', 'suno/generate-persona', 'suno'),
  audio('kie-suno-mashup', 'Kie Suno Mashup Music', 'suno/mashup-music', 'suno'),
  audio('kie-suno-generate-lyrics', 'Kie Suno Generate Lyrics', 'suno/generate-lyrics', 'suno'),
  audio('kie-suno-convert-wav', 'Kie Suno Convert to WAV', 'suno/convert-to-wav', 'suno'),
  audio('kie-suno-vocal-separation', 'Kie Suno Vocal and Instrument Separation', 'suno/vocal-instrument-separation', 'suno'),
  audio('kie-suno-generate-midi', 'Kie Suno Generate MIDI', 'suno/generate-midi', 'suno'),
  audio('kie-suno-create-music-video', 'Kie Suno Create Music Video', 'suno/create-music-video', 'suno'),
  audio('kie-suno-generate-sounds', 'Kie Suno Generate Sounds', 'suno/generate-sounds', 'suno'),
  audio('kie-suno-create-custom-voice', 'Kie Suno Create Custom Voice', 'suno/create-custom-voice', 'suno'),
];

export const kieCatalogByCapability = {
  t2i: kieT2IModels,
  i2i: kieI2IModels,
  t2v: kieT2VModels,
  i2v: kieI2VModels,
  v2v: kieV2VModels,
  lipsync: kieLipSyncModels,
  audio: kieAudioModels,
};

export const allKieModels = Object.values(kieCatalogByCapability).flat();
