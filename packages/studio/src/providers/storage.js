export const ACTIVE_PROVIDER_KEY = 'active_provider';
export const PROVIDER_KEYS_KEY = 'provider_keys_v1';
export const LEGACY_MUAPI_KEY = 'muapi_key';

export const PROVIDERS = {
  muapi: {
    id: 'muapi',
    name: 'MuAPI',
    keyLabel: 'MuAPI API Key',
    keyUrl: 'https://muapi.ai/access-keys',
    supportsMuapiOnlyFeatures: true,
  },
  kie: {
    id: 'kie',
    name: 'Kie.ai',
    keyLabel: 'Kie API Key',
    keyUrl: 'https://kie.ai/api-key',
    supportsMuapiOnlyFeatures: false,
  },
};

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export function getProviderList() {
  return Object.values(PROVIDERS);
}

export function getProvider(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.muapi;
}

export function getActiveProviderId() {
  if (!canUseStorage()) return 'muapi';
  return localStorage.getItem(ACTIVE_PROVIDER_KEY) || 'muapi';
}

export function setActiveProviderId(providerId) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACTIVE_PROVIDER_KEY, PROVIDERS[providerId] ? providerId : 'muapi');
}

export function readProviderKeys() {
  if (!canUseStorage()) return {};
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(PROVIDER_KEYS_KEY) || '{}') || {};
  } catch (error) {
    parsed = {};
  }

  const legacy = localStorage.getItem(LEGACY_MUAPI_KEY);
  if (legacy && !parsed.muapi) {
    parsed.muapi = legacy;
    localStorage.setItem(PROVIDER_KEYS_KEY, JSON.stringify(parsed));
  }
  return parsed;
}

export function getProviderKey(providerId = getActiveProviderId()) {
  const keys = readProviderKeys();
  if (providerId === 'muapi') return keys.muapi || (canUseStorage() ? localStorage.getItem(LEGACY_MUAPI_KEY) : null);
  return keys[providerId] || null;
}

export function setProviderKey(providerId, key) {
  if (!canUseStorage()) return;
  const keys = readProviderKeys();
  const trimmed = (key || '').trim();
  if (trimmed) keys[providerId] = trimmed;
  else delete keys[providerId];
  localStorage.setItem(PROVIDER_KEYS_KEY, JSON.stringify(keys));
  if (providerId === 'muapi') {
    if (trimmed) localStorage.setItem(LEGACY_MUAPI_KEY, trimmed);
    else localStorage.removeItem(LEGACY_MUAPI_KEY);
  }
}

export function clearProviderKey(providerId) {
  setProviderKey(providerId, '');
}

export function getActiveProviderKey() {
  return getProviderKey(getActiveProviderId());
}

export function providerSupportsMuapiOnlyFeatures(providerId = getActiveProviderId()) {
  return !!getProvider(providerId).supportsMuapiOnlyFeatures;
}
