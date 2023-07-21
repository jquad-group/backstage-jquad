import { Entity } from '@backstage/catalog-model';
import {
  Content,
  ContentHeader,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';

/* ignore lint error for internal dependencies */
/* eslint-disable */
import { Box, Grid } from '@material-ui/core';
import { useKubernetesObjects} from '@backstage/plugin-kubernetes';
import { FetchResponse } from '@backstage/plugin-kubernetes-common';
import { PipelineRun, Cluster, TaskRun } from '../../types';
import { CollapsibleTable } from '../CollapsibleTable';
import React, { useEffect, useState } from 'react';

type KubernetesContentProps = {
    entity: Entity;
    refreshIntervalMs?: number;
    children?: React.ReactNode;
};

export const TektonDashboardComponent = ({
  entity,
  refreshIntervalMs,
}: KubernetesContentProps) => {
  const { kubernetesObjects, error } = useKubernetesObjects(
    entity,
    refreshIntervalMs,
  );

  const [loading, setLoading] = useState(true); // State to manage loading state

  useEffect(() => {
    // This useEffect will run whenever kubernetesObjects changes
    // If kubernetesObjects is not undefined or null, setLoading to false
    if (kubernetesObjects !== undefined && kubernetesObjects !== null) {
      setLoading(false);
    }
  }, [kubernetesObjects]);

  let clusters = new Array<Cluster>(); 
      
  if (kubernetesObjects !== undefined) {
    for (let clusterCnt = 0; clusterCnt < kubernetesObjects.items.length; clusterCnt++) {
      let cluster = {} as Cluster;
      cluster.name = kubernetesObjects?.items[clusterCnt].cluster.name;
      // get only custom resource
      let customResources = kubernetesObjects?.items[clusterCnt].resources.filter(isCustomResource); 
      
      // get pipelineruns    
      let pipelineRunsCRs = customResources?.map((r) => {
      return {...r, resources: r.resources.filter(isPipelineRun)}});

      // flatten object
      const flattenedPipelineRunsAny = pipelineRunsCRs?.flatMap(({ resources }) =>
        [...resources]
      ) ?? [];

      // cast objects to PipelineRun
      const flattenedPipelineRuns = flattenedPipelineRunsAny as PipelineRun[];
          
      //let taskRunsCRs = customResources?.filter((r)=> r.resources.some(isTaskRun) );  
      let taskRunsCRs = customResources?.map((r) => {
        return {...r, resources: r.resources.filter(isTaskRun)}});
  
      const flattenedTaskRunsAny = taskRunsCRs?.flatMap(({ resources }) =>
        [...resources]
      ) ?? [];

      const flattenedTaskRuns = flattenedTaskRunsAny as TaskRun[];
      for (const pipelineRun of flattenedPipelineRuns) {
        const taskRunsForPipelineRun: Array<TaskRun> = [];
        for (const taskRun of flattenedTaskRuns) {
          
          const pipelineRunNameLabel = taskRun.metadata.labels['tekton.dev/pipelineRun'];
          if ((String(pipelineRunNameLabel) === pipelineRun.metadata.name) && (taskRun.apiVersion === pipelineRun.apiVersion)) {
            taskRunsForPipelineRun.push(taskRun)
          }        
        }
        pipelineRun.taskRuns = taskRunsForPipelineRun
      }
          
      cluster.pipelineRuns = flattenedPipelineRuns;
      clusters.push(cluster);
    }
    // sort 
    clusters.map((cluster) => 
    cluster.pipelineRuns.sort((pipelineA, pipelineB) =>
    pipelineA.status.startTime > pipelineB.status.startTime ? -1 : 1,));
  }    

  return (
    <Page themeId="tool">
      <Content>
      {loading ? ( // Display progress bar while loading
          <div className="progress-bar-container">
            <Progress /> 
          </div>
        ) : (
        kubernetesObjects?.items !== undefined && clusters?.length > 0 && (
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
        ) 
      )}
      {error !== undefined && 
        <Grid container spacing={3} direction="column">
          <Grid item>
            <ResponseErrorPanel error={(new Error(error))} />;
          </Grid>
        </Grid>
      }
      </Content>
    </Page>
  );

};

function isCustomResource(n:FetchResponse, i?:number, arr?:FetchResponse[]) {
	 
	if(n.type === 'customresources') {
		return true;
	}
	else {
		return false;
	}
}

function isPipelineRun(n:any, i?:number, arr?:any[]): n is PipelineRun {
  if (n.kind === 'PipelineRun') {
    return true;
  } else {
    return false;
  }
}

function isTaskRun(n:any, i?:number, arr?:any[]): n is TaskRun {
  if (n.kind === 'TaskRun') {
    return true;
  } else {
    return false;
  }
}