import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Config } from '@backstage/config'
import { getMicroservicePipelineRuns, getLogs } from './pipelinerun';
/* ignore lint error for internal dependencies */
/* eslint-disable */
import { PipelineRun } from '@jquad-group/plugin-tekton-pipelines-common';
/* eslint-enable */
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

    router.get('/logs', async (request, response) => {
      const namespace: any = request.query.namespace
      const taskRunPodName: any = request.query.taskRunPodName
      const stepContainer: any = request.query.stepContainer

      const baseUrl: string = tektonConfig[0].getString('baseUrl')
      const authorizationBearerToken: string = tektonConfig[0].getString('authorizationBearerToken')

      const logs = await getLogs(
        baseUrl,
        authorizationBearerToken,
        namespace,
        taskRunPodName,
        stepContainer,
      )
      console.log("LISTING LOGS FROM BACKEND")
      console.log(logs)
      response.send(logs)
    })    
  
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.send({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}
