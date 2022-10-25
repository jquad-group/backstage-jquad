/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Config } from '@backstage/config'
import { getMicroservicePipelineRuns } from './pipelinerun';
import { PipelineRun } from './pipelinerun';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  const router = Router();
  router.use(express.json());

  logger.info('Initializing tekton backend')
  const tektonConfig: Config[] = config.getConfigArray('tekton')
    router.get('/pipelineruns', async (request, response) => {
      const namespace: any = request.query.namespace
      const selector: any = request.query.selector

      const result: Array<PipelineRun> = []
      for(const currentConfig of tektonConfig) {
    
        const baseUrl: string = currentConfig.getString('baseUrl')
        const authorizationBearerToken: string = currentConfig.getString('authorizationBearerToken')
        const dashboardBaseUrl: string = currentConfig.getString('dashboardBaseUrl')
    
        const pipelineruns = await getMicroservicePipelineRuns(
          baseUrl,
          authorizationBearerToken,
          namespace,
          selector,
          dashboardBaseUrl,
        )
        
        for (const pipelineRun of pipelineruns) {
          result.push(pipelineRun)
        }
               
      }
      response.send(result)
    })
  
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
