# OpenGate Fork Notes

This repository is a fork of the original Open Generative AI project:

- Upstream project: https://github.com/Anil-matcha/Open-Generative-AI
- Fork owner: https://github.com/robytherock82/opengate
- Main goal of this fork: keep the original generative studios, but make the cloud generation layer provider-aware and add Kie.ai as a full cloud provider.

This file documents the changes made by this fork without replacing the original upstream README. Keeping fork-specific notes separate makes it easier to compare with upstream, sync future updates, and understand what was intentionally changed.

## What Changed

The original project was built around MuAPI as the primary cloud provider. This fork adds a provider registry so the app can route generation calls through different providers while preserving the existing public API used by the app.

Implemented providers:

- `muapi`: preserved for backward compatibility and for MuAPI-only product areas.
- `kie`: added as a full provider for documented Kie Market model families, file upload, polling, and credit balance.

The existing imports from `muapi.js` still work. Internally, those functions now resolve the active provider and call the correct provider client.

## Provider Architecture

New provider layer:

- `packages/studio/src/providers/storage.js`: active provider, API key storage, and migration from legacy `muapi_key`.
- `packages/studio/src/providers/registry.js`: provider lookup and client resolution.
- `packages/studio/src/providers/muapiClient.js`: moved MuAPI implementation.
- `packages/studio/src/providers/kieClient.js`: Kie submit, upload, poll, credit, and result normalization.
- `packages/studio/src/providers/modelCatalog.kie.js`: Kie model catalog grouped by app capability.

Compatibility wrappers:

- `packages/studio/src/muapi.js`
- `src/lib/muapi.js`

These wrappers keep old call sites working while routing to the active provider.

## Kie Support

Kie support uses the documented Kie APIs:

- Market task creation and polling:
  - `POST https://api.kie.ai/api/v1/jobs/createTask`
  - `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...`
- Runway-specific Kie endpoints:
  - `POST /api/v1/runway/generate`
  - `GET /api/v1/runway/record-detail`
- Veo-specific Kie endpoints:
  - `POST /api/v1/veo/generate`
  - `GET /api/v1/veo/record-info`
- File upload:
  - `https://kieai.redpandaai.co/api/file-stream-upload`
- Account credits:
  - `GET https://api.kie.ai/api/v1/chat/credit`

The app normalizes provider responses to this shape:

```js
{
  url,
  outputs,
  request_id,
  provider,
  raw
}
```

## Kie Model Catalog

The fork adds a broad Kie catalog covering the documented Kie Market families available at implementation time, grouped into the app's existing studio capabilities:

- Image: Seedream, Google Imagen/Nano Banana, Flux, Grok Imagine, GPT Image, Topaz, Recraft, Ideogram, Qwen, Wan image models.
- Video: Grok Imagine Video, Kling, Bytedance/Seedance, Hailuo, Wan, Topaz, Runway, HappyHorse, Gemini Omni, Veo.
- Video editing and transformation: upscale, extend, video-to-video, reference-to-video, motion-control where documented.
- Audio and music: ElevenLabs, Suno, Gemini Omni audio, and documented audio utilities.
- Lipsync/avatar: Kling avatar, OmniHuman, Volcengine lipsync, Wan speech/audio-driven video, and related documented models.

The catalog lives in:

```txt
packages/studio/src/providers/modelCatalog.kie.js
```

Kie updates its Market frequently, so this file should be reviewed when Kie adds, renames, or changes models.

## UI Changes

The settings/auth flow now supports provider selection:

- Provider selector: MuAPI / Kie.
- Separate API key storage per provider.
- Legacy `muapi_key` is migrated into the new provider-key storage.
- Balance display uses MuAPI balance when MuAPI is active and Kie credits when Kie is active.

Files:

- `components/StandaloneShell.js`
- `components/ApiKeyModal.js`

## MuAPI-Only Areas

Some original tabs call proprietary MuAPI endpoints that do not have documented Kie equivalents in this fork:

- Workflows
- Agents
- Apps
- Design Agent
- AI Clipping
- Vibe Motion

These areas remain behind MuAPI compatibility. When Kie is the active provider, provider capability checks prevent the app from pretending Kie supports unsupported MuAPI-only APIs.

## Next.js Proxy Routes

Browser calls to Kie are routed through local Next.js API proxy routes to avoid browser/CORS issues:

- `app/api/kie/[[...path]]/route.js`
- `app/api/kie-upload/[[...path]]/route.js`

The Kie client automatically uses these local proxy paths when running in the browser.

## Lint and Build Configuration

The fork adds:

- `eslint.config.mjs`: explicit Next.js ESLint flat config. Legacy unused-variable and empty-block issues are warnings, not build blockers.
- `next.config.mjs`: `outputFileTracingRoot` is set to this project root so Next does not infer a parent directory because of other lockfiles on the machine.

The remaining lint warnings are legacy cleanup warnings and do not block production build output.

## Verification Performed

The following checks passed before pushing the provider migration:

```bash
node --test tests\*.test.js tests\*.test.mjs
npm run build:studio
npm run build:packages
npm run build
```

Added tests:

- `tests/kieProviderCatalog.test.js`

The tests verify the Kie catalog shape and that the Kie client uses documented auth and endpoint paths.

## Known Limitations

- Live Kie generation was not smoke-tested in this environment because it requires a valid Kie API key and account credits.
- The Kie catalog is based on the documented Market/docs available at implementation time. It should be maintained as Kie changes the Market.
- MuAPI-only tabs remain MuAPI-only until Kie exposes equivalent documented APIs.
- API keys are stored in `localStorage`, matching the existing app behavior.
- Two submodules were updated to reachable upstream `main` commits during build setup because the previously recorded commits were not fetchable.

## How To Configure Kie

1. Open the app.
2. Go to Settings or the API key modal.
3. Select `Kie` as the provider.
4. Paste a Kie API key.
5. Use Image, Video, Audio, LipSync, Cinema, or Marketing studios with Kie-supported models.

To return to MuAPI, select `MuAPI` again and save a MuAPI key.

## Maintaining This Fork

Recommended workflow when syncing upstream:

```bash
git remote add upstream https://github.com/Anil-matcha/Open-Generative-AI.git
git fetch upstream
git checkout main
git merge upstream/main
npm install
npm run build:packages
npm run build
```

When resolving conflicts, keep these fork-specific boundaries intact:

- Provider registry and storage under `packages/studio/src/providers/`.
- Public compatibility facade in `packages/studio/src/muapi.js`.
- Legacy compatibility class in `src/lib/muapi.js`.
- Provider-aware model helpers in `packages/studio/src/models.js`.
- Kie proxy routes under `app/api/kie*`.

## Commit Notes

The provider migration was committed with the Lore commit protocol used in this workspace. The key commit is:

```txt
3247fad Enable provider choice for cloud generation
```
