import consola from "consola"
import fs from "node:fs"

import { CACHE } from "./lib/cache"
import { PATHS } from "./lib/paths"
import { TOKENS } from "./lib/tokens"
import { server } from "./server"
import { getModels } from "./services/copilot/get-models/service"
import { getCopilotToken } from "./services/copilot/get-token/copilot-token"
import { getGitHubToken } from "./services/copilot/get-token/github-token"

async function initializeGithubToken() {
  const EIGHT_HOURS = 8 * 60 * 60 * 1000
  const cachedGithubToken = await CACHE.get("github-token")

  // If exists and at most 8 hours old
  if (
    cachedGithubToken &&
    Date.now() - cachedGithubToken.createdAt < EIGHT_HOURS
  ) {
    return cachedGithubToken.value
  }

  const newToken = await getGitHubToken()
  await CACHE.set("github-token", newToken)
  return newToken
}

async function initializeCopilotToken() {
  const { token, refresh_in } = await getCopilotToken()
  TOKENS.COPILOT_TOKEN = token

  // refresh_in is in minutes
  // we're refreshing 100 minutes early
  const refreshInterval = (refresh_in - 100) * 60 * 1000

  setInterval(async () => {
    consola.start("Refreshing copilot token")
    const { token: newToken } = await getCopilotToken()
    TOKENS.COPILOT_TOKEN = newToken
  }, refreshInterval)

  return token
}

async function initializeCache() {
  if (!fs.existsSync(PATHS.PATH_CACHE_FILE)) {
    fs.mkdirSync(PATHS.DIR_CACHE, { recursive: true })
    await CACHE._write({})
  }
}

async function logAvailableModels() {
  const models = await getModels()
  consola.info(
    `Available models: \n${models.data.map((model) => `- ${model.id}`).join("\n")}`,
  )
}

async function initialize() {
  await initializeCache()

  // Initialize tokens
  TOKENS.GITHUB_TOKEN = await initializeGithubToken()
  await initializeCopilotToken()

  // Log available models
  await logAvailableModels()
}

// Initialize the application
await initialize()

export default server
