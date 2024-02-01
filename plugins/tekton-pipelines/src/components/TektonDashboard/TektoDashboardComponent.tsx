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
import { Box, FormControl, Grid, InputLabel, MenuItem, Select } from '@material-ui/core';
import { useKubernetesObjects} from '@backstage/plugin-kubernetes';
import { FetchResponse } from '@backstage/plugin-kubernetes-common';
import { PipelineRun, Cluster } from '../../types';
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
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  //const pipelineRunUrlTemplate: string = entity?.metadata.annotations?.["tektonci/dashboard"];

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
                    
      cluster.pipelineRuns = flattenedPipelineRuns;
      clusters.push(cluster);
    }
    // sort 
    clusters.map((cluster) => 
    cluster.pipelineRuns.sort((pipelineA, pipelineB) =>
      pipelineA.status.startTime > pipelineB.status.startTime ? -1 : 1
    ));

    // set dashboardUrl      
    clusters.forEach((cluster) => 
      cluster.pipelineRuns.forEach((pipelineRun) => {
        const dashboardAnnotation = "tektonci." + cluster.name + "/dashboard";
        if (entity.metadata.annotations?.[dashboardAnnotation] !== undefined) {
          const dashboardUrl = entity.metadata.annotations[dashboardAnnotation] ?? "";
          const replacedUrl = dashboardUrl
          .replace(/\$namespace/g, encodeURIComponent(pipelineRun.metadata.namespace))
          .replace(/\$pipelinerun/g, encodeURIComponent(pipelineRun.metadata.name));          
          pipelineRun.pipelineRunDashboardUrl = replacedUrl;
        }      
      })
    );    
  
  }    

  const handleClusterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCluster(event.target.value as string);
  };

  return (
    <Page themeId="tool">
    <Content>
      {loading ? (
        <div className="progress-bar-container">
          <Progress />
        </div>
      ) : (
        kubernetesObjects?.items !== undefined && clusters?.length > 0 && (
          <Grid container spacing={3} direction="column">
            <Grid item>
              <FormControl fullWidth>
                <InputLabel id="cluster-select-label">Select Cluster</InputLabel>
                <Select
                  labelId="cluster-select-label"
                  id="cluster-select"
                  value={selectedCluster || ''}
                  onChange={handleClusterChange}
                >
                  {clusters.map((cluster) => (
                    <MenuItem key={cluster.name} value={cluster.name}>
                      {cluster.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedCluster && (
              <Grid item>
                <ContentHeader title={selectedCluster} textAlign="center"></ContentHeader>
                {clusters
                  .filter((cluster) => cluster.name === selectedCluster)
                  .map((cluster) =>
                    cluster.pipelineRuns !== undefined &&
                    cluster.pipelineRuns !== null &&
                    cluster.pipelineRuns.length > 0 ? (
                      <CollapsibleTable
                        key={selectedCluster}
                        clusterName={cluster.name}
                        pipelineruns={cluster.pipelineRuns}
                      />
                    ) : (
                      <Box textAlign="center" fontSize="20px">
                        No pipeline runs for the selected cluster.
                      </Box>
                    )
                  )}
              </Grid>
            )}
          </Grid>
        )
      )}
      {error !== undefined && (
        <Grid container spacing={3} direction="column">
          <Grid item>
            <ResponseErrorPanel error={new Error(error)} />;
          </Grid>
        </Grid>
      )}
    </Content>
  </Page>
);
};

function isCustomResource(n:FetchResponse) {
	 
	if(n.type === 'customresources') {
		return true;
	}
	else {
		return false;
	}
}

function isPipelineRun(n:any): n is PipelineRun {
  if (n.kind === 'PipelineRun') {
    return true;
  } else {
    return false;
  }
}