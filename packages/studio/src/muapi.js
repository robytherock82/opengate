import {
  getAudioModelById,
  getI2IModelById,
  getI2VModelById,
  getLipSyncModelById,
  getModelById,
  getV2VModelById,
  getVideoModelById,
} from './models.js';
import { getKeyForProvider, getProviderClient, getProviderIdForModel } from './providers/registry.js';
import { getActiveProviderId, providerSupportsMuapiOnlyFeatures } from './providers/storage.js';
import * as muapiClient from './providers/muapiClient.js';

function clientForModel(modelInfo) {
  const providerId = getProviderIdForModel(modelInfo);
  return {
    providerId,
    client: getProviderClient(providerId),
  };
}

function keyFor(providerId, apiKey) {
  const key = getKeyForProvider(providerId, apiKey);
  if (!key) throw new Error(`${providerId === 'kie' ? 'Kie' : 'MuAPI'} API key missing. Please set it in Settings.`);
  return key;
}

async function callModel(modelInfo, apiKey, params, methodName) {
  const { providerId, client } = clientForModel(modelInfo);
  return client[methodName](keyFor(providerId, apiKey), params);
}

function requireMuapiOnly(featureName) {
  if (!providerSupportsMuapiOnlyFeatures()) {
    throw new Error(`${featureName} is only available with MuAPI because Kie does not document an equivalent endpoint.`);
  }
}

export async function generateImage(apiKey, params) {
  return callModel(getModelById(params.model), apiKey, params, 'generateImage');
}

export async function generateI2I(apiKey, params) {
  return callModel(getI2IModelById(params.model), apiKey, params, 'generateI2I');
}

export async function generateVideo(apiKey, params) {
  return callModel(getVideoModelById(params.model), apiKey, params, 'generateVideo');
}

export async function generateI2V(apiKey, params) {
  return callModel(getI2VModelById(params.model), apiKey, params, 'generateI2V');
}

export async function processV2V(apiKey, params) {
  return callModel(getV2VModelById(params.model), apiKey, params, 'processV2V');
}

export async function processLipSync(apiKey, params) {
  return callModel(getLipSyncModelById(params.model), apiKey, params, 'processLipSync');
}

export async function generateAudio(apiKey, params) {
  const modelId = params._modelId || params.model;
  return callModel(getAudioModelById(modelId), apiKey, { ...params, model: modelId }, 'generateAudio');
}

export async function generateMarketingStudioAd(apiKey, params) {
  return getProviderClient(getActiveProviderId()).generateMarketingStudioAd(keyFor(getActiveProviderId(), apiKey), params);
}

export function uploadFile(apiKey, file, onProgress) {
  const providerId = getActiveProviderId();
  return getProviderClient(providerId).uploadFile(keyFor(providerId, apiKey), file, onProgress);
}

export async function getUserBalance(apiKey) {
  const providerId = getActiveProviderId();
  return getProviderClient(providerId).getUserBalance(keyFor(providerId, apiKey));
}

export async function runClipping(apiKey, params) {
  return getProviderClient(getActiveProviderId()).runClipping(keyFor(getActiveProviderId(), apiKey), params);
}

export async function runMotionGraphics(apiKey, params) {
  return getProviderClient(getActiveProviderId()).runMotionGraphics(keyFor(getActiveProviderId(), apiKey), params);
}

export async function runMotionGraphicsEdit(apiKey, params) {
  return getProviderClient(getActiveProviderId()).runMotionGraphicsEdit(keyFor(getActiveProviderId(), apiKey), params);
}

export async function getTemplateWorkflows(apiKey) {
  requireMuapiOnly('Workflows');
  return muapiClient.getTemplateWorkflows(keyFor('muapi', apiKey));
}

export async function getUserWorkflows(apiKey) {
  requireMuapiOnly('Workflows');
  return muapiClient.getUserWorkflows(keyFor('muapi', apiKey));
}

export async function getPublishedWorkflows(apiKey) {
  requireMuapiOnly('Workflows');
  return muapiClient.getPublishedWorkflows(keyFor('muapi', apiKey));
}

export async function getTemplateAgents(apiKey) {
  requireMuapiOnly('Agents');
  return muapiClient.getTemplateAgents(keyFor('muapi', apiKey));
}

export async function getUserAgents(apiKey) {
  requireMuapiOnly('Agents');
  return muapiClient.getUserAgents(keyFor('muapi', apiKey));
}

export async function getPublishedAgents(apiKey) {
  requireMuapiOnly('Agents');
  return muapiClient.getPublishedAgents(keyFor('muapi', apiKey));
}

export async function getUserConversations(apiKey) {
  requireMuapiOnly('Agents');
  return muapiClient.getUserConversations(keyFor('muapi', apiKey));
}

export async function createWorkflow(apiKey, payload) {
  requireMuapiOnly('Workflows');
  return muapiClient.createWorkflow(keyFor('muapi', apiKey), payload);
}

export async function updateWorkflowName(apiKey, workflowId, name) {
  requireMuapiOnly('Workflows');
  return muapiClient.updateWorkflowName(keyFor('muapi', apiKey), workflowId, name);
}

export async function deleteWorkflow(apiKey, workflowId) {
  requireMuapiOnly('Workflows');
  return muapiClient.deleteWorkflow(keyFor('muapi', apiKey), workflowId);
}

export async function getWorkflowInputs(apiKey, workflowId) {
  requireMuapiOnly('Workflows');
  return muapiClient.getWorkflowInputs(keyFor('muapi', apiKey), workflowId);
}

export async function executeWorkflow(apiKey, workflowId, inputs) {
  requireMuapiOnly('Workflows');
  return muapiClient.executeWorkflow(keyFor('muapi', apiKey), workflowId, inputs);
}

export async function getAllNodeSchemas(apiKey, workflowId) {
  requireMuapiOnly('Workflows');
  return muapiClient.getAllNodeSchemas(keyFor('muapi', apiKey), workflowId);
}

export async function getWorkflowData(apiKey, workflowId) {
  requireMuapiOnly('Workflows');
  return muapiClient.getWorkflowData(keyFor('muapi', apiKey), workflowId);
}

export async function getNodeSchemas(apiKey, workflowId) {
  requireMuapiOnly('Workflows');
  return muapiClient.getNodeSchemas(keyFor('muapi', apiKey), workflowId);
}

export async function runSingleNode(apiKey, workflowId, nodeId, payload) {
  requireMuapiOnly('Workflows');
  return muapiClient.runSingleNode(keyFor('muapi', apiKey), workflowId, nodeId, payload);
}

export async function deleteNodeRun(apiKey, nodeRunId) {
  requireMuapiOnly('Workflows');
  return muapiClient.deleteNodeRun(keyFor('muapi', apiKey), nodeRunId);
}

export async function getNodeStatus(apiKey, runId) {
  requireMuapiOnly('Workflows');
  return muapiClient.getNodeStatus(keyFor('muapi', apiKey), runId);
}

export async function handleProxyRequest(...args) {
  return muapiClient.handleProxyRequest(...args);
}

export async function handleServerSideProxy(...args) {
  return muapiClient.handleServerSideProxy(...args);
}

export async function calculateDynamicCost(apiKey, taskName, payload) {
  requireMuapiOnly('Apps');
  return muapiClient.calculateDynamicCost(keyFor('muapi', apiKey), taskName, payload);
}

export async function registerAppInterest(apiKey, appName) {
  requireMuapiOnly('Apps');
  return muapiClient.registerAppInterest(keyFor('muapi', apiKey), appName);
}

export async function getAppInterests(apiKey) {
  requireMuapiOnly('Apps');
  return muapiClient.getAppInterests(keyFor('muapi', apiKey));
}

export {
  getActiveProviderId,
  getProvider,
  getProviderList,
  getProviderKey,
  providerSupportsMuapiOnlyFeatures,
  setActiveProviderId,
  setProviderKey,
} from './providers/storage.js';
