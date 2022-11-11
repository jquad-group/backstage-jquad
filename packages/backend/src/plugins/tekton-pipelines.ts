
/* ignore lint error for internal dependencies */
/* eslint-disable */
import { createRouter } from '@jquad-group/plugin-tekton-pipelines-backend';
/* eslint-enable */
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  // Here is where you will add all of the required initialization code that
  // your backend plugin needs to be able to start!

  // The env contains a lot of goodies, but our router currently only
  // needs a logger
  return await createRouter({
    logger: env.logger,
    config: env.config,
  });
}