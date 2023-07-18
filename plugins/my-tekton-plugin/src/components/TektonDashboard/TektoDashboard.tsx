import { Entity } from '@backstage/catalog-model';
import {
  Content,
  ContentHeader,
  Page,
  Progress,
} from '@backstage/core-components';

/* ignore lint error for internal dependencies */
/* eslint-disable */
import { Box, Grid, Typography } from '@material-ui/core';
import { DetectedError, detectErrors } from '@backstage/plugin-kubernetes';
import { DetectedErrorsContext, ErrorPanel, ErrorReporting} from '@backstage/plugin-kubernetes';
import logger from '../../logging/logger';
import { useKubernetesObjects} from '@backstage/plugin-kubernetes';
import { PipelineRun, Cluster, TaskRun } from '../../types';
import { CollapsibleTable } from '../CollapsibleTable';
import React from 'react';
import { Label } from '@jquad-group/plugin-tekton-pipelines-common';

type KubernetesContentProps = {
    entity: Entity;
    refreshIntervalMs?: number;
    children?: React.ReactNode;
};
  
export const TektonDashboard = ({
  entity,
  refreshIntervalMs,
}: KubernetesContentProps) => {
  const { kubernetesObjects, error } = useKubernetesObjects(
    entity,
    refreshIntervalMs,
  );

  
  const clustersWithErrors =
    kubernetesObjects?.items.filter(r => r.errors.length > 0) ?? [];

  const detectedErrors =
    kubernetesObjects !== undefined
      ? detectErrors(kubernetesObjects)
      : new Map<string, DetectedError[]>();

  let taskRuns = new Array<TaskRun>
  let clusters = new Array<Cluster>

  if (kubernetesObjects !== undefined) {
    for (let i = 0; i < kubernetesObjects.items.length; i++) {
      let cluster = {} as Cluster;
      cluster.name = kubernetesObjects.items[i].cluster.name;
      clusters.push(cluster);      
      for (let q = 0; q < kubernetesObjects.items[i].resources.length; q++) {
        if (kubernetesObjects.items[i].resources[q].type === 'customresources') {        
          for (let crCnt = 0; crCnt < kubernetesObjects.items[i].resources[q].resources.length; crCnt++) {
            // get all taskruns
            if ((kubernetesObjects.items[i].resources[q].resources[crCnt].kind === 'TaskRun') && isPipelinePartOfMicroservice(entity, kubernetesObjects.items[i].resources[q].resources[crCnt])){
              let tR: TaskRun; 
              tR = kubernetesObjects.items[i].resources[q].resources[crCnt]                
              taskRuns.push(tR)
            }
            //logger.info("CHECKING IS PIPELINERUN: " + isPipelinePartOfMicroservice(entity, kubernetesObjects.items[i].resources[q].resources[crCnt]));
            // get all pipelineruns
            logger.info("CHECKING PIPELINERUN: " + kubernetesObjects.items[i].resources[q].resources[crCnt]);
            logger.info("THE LABELS:" + kubernetesObjects.items[i].resources[q].resources[crCnt].metadata.labels);
            logger.info("IS TRUE: " + String(isPipelinePartOfMicroservice(entity, kubernetesObjects.items[i].resources[q].resources[crCnt])));
            if ((kubernetesObjects.items[i].resources[q].resources[crCnt].kind === 'PipelineRun') && isPipelinePartOfMicroservice(entity, kubernetesObjects.items[i].resources[q].resources[crCnt])) {
              logger.info("FOUND PIPELINE: " + kubernetesObjects.items[i].resources[q].resources[crCnt].metadata.name);
              let pR: PipelineRun;
              pR = kubernetesObjects.items[i].resources[q].resources[crCnt]
              pR.taskRuns = new Array<TaskRun>
              pR.status.childReferences = kubernetesObjects.items[i].resources[q].resources[crCnt].status.childReferences
              if (cluster.pipelineRuns === undefined) { 
                cluster.pipelineRuns = new Array<PipelineRun>     
              }
              cluster.pipelineRuns.push(pR)
            }
          }                        
        }
      }
    }
  for (const cluster of clusters) {
    if (cluster.pipelineRuns !== undefined) {
      for (const pipelineRun of cluster.pipelineRuns) {
        const taskRunsForPipelineRun: Array<TaskRun> = [];
        for (const taskRun of taskRuns) {
          
          const pipelineRunNameLabel = taskRun.metadata.labels['tekton.dev/pipelineRun'];
          if ((String(pipelineRunNameLabel) === pipelineRun.metadata.name) && (taskRun.apiVersion === pipelineRun.apiVersion)) {
            taskRunsForPipelineRun.push(taskRun)
          }        
        }
        pipelineRun.taskRuns = taskRunsForPipelineRun
      }
    }
  }
  }

  return (
    <Page themeId="tool">
      <Content>
        {kubernetesObjects?.items !== undefined && clusters?.length > 0 && (
          clusters.map((cluster) => 
            <Grid container spacing={3} direction="column">
            <ContentHeader title={cluster.name} textAlign="center"></ContentHeader>
            { cluster.pipelineRuns !== undefined && cluster.pipelineRuns !== null && cluster.pipelineRuns.length > 0 && (
            <Grid item>
              <CollapsibleTable clusterName={cluster.name} pipelineruns={cluster.pipelineRuns} />
            </Grid>           
            )}
            { cluster.error !== undefined && (
            <Grid item>
              <Box textAlign="center" fontSize="20px">{cluster.error}</Box>
            </Grid>                      
            )}
            </Grid>         
          )
        )}
      </Content>
    </Page>
  );

};

function isPipelinePartOfMicroservice(entity: Entity, cr: TaskRun | PipelineRun): boolean {
  let result: boolean;
  result = false;
  if (entity.metadata.annotations !== undefined) {
    if (entity.metadata.annotations["tektonci/build-namespace"] === cr.metadata.namespace) {
      result = true;
    }
  
    if (entity.metadata.annotations["tektonci/pipeline-label-selector"] !== undefined) {      
      if (isRecordContained(entity.metadata.annotations, cr.metadata.labels)) {
        result = true;
      }
      result = false;
    }
    return result;
  }
  return result;
}

function isRecordContained(recordA: Record<string, string>, recordB: Record<string, string>): boolean {
  let recordC = {} as Record<string, string>;
  let labels: string[];
  labels = recordA["tektonci/pipeline-label-selector"].split(",");
  
  for(let labelCnt = 0; labelCnt < labels.length; labelCnt++) {
    let tempStr: string[];
    tempStr = labels[labelCnt].split("=");
    recordC[tempStr[0]]= tempStr[1];
  }

  for (const key in recordC) {        
      if (!(key in recordB) || recordB[key] !== recordC[key]) {
        return false;
      }
  }
  return true;
}