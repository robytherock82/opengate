import * as kieClient from './kieClient.js';
import * as muapiClient from './muapiClient.js';
import { getActiveProviderId, getProviderKey } from './storage.js';

export const providerClients = {
  muapi: muapiClient,
  kie: kieClient,
};

export function getProviderClient(providerId = getActiveProviderId()) {
  return providerClients[providerId] || providerClients.muapi;
}

export function getKeyForProvider(providerId, fallbackKey) {
  return fallbackKey || getProviderKey(providerId);
}

export function getProviderIdForModel(modelInfo) {
  return modelInfo?.provider || getActiveProviderId();
}
