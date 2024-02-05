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
import { KubernetesApi, kubernetesApiRef, useKubernetesObjects } from '@backstage/plugin-kubernetes';
import { FetchResponse } from '@backstage/plugin-kubernetes-common';
import { PipelineRun, Cluster, TaskRun } from '../../types';
import { CollapsibleTable } from '../CollapsibleTable';
import React, { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';

type KubernetesContentProps = {
  entity: Entity;
  refreshIntervalMs?: number;
  children?: React.ReactNode;
};

/*
const getTaskRunsForPipelineRun = async (clusterName: string, pipelineRun: PipelineRun, k8s: KubernetesApi): Promise<Array<TaskRun>> => {
  const namespace = pipelineRun.metadata.namespace;
  const pipelineRunName = pipelineRun.metadata.name;
  const url = `/apis/tekton.dev/v1/namespaces/${namespace}/taskruns?labelSelector=tekton.dev/pipelineRun=${pipelineRunName}`

  try {
    const response = await k8s.proxy({
      clusterName: clusterName,
      path: url,
    });


    if (response && response.status === 200) {
      const responseData = await response.json();
      if (responseData && responseData.items) {
        const taskRuns: Array<TaskRun> = responseData.items;
        return taskRuns;
      }
    }

    return []

  } catch (error) {
    console.error(`Error fetching TaskRuns for PipelineRun ${pipelineRunName}:`, error);
    return []
    // throw error; // Rethrow the error to be caught by the calling function
  }
};
*/

const fetchClusterNames = async (k8s: KubernetesApi): Promise<Array<Cluster>> => {
  const clusters: Array<Cluster> = [];
  for (const cluster of await k8s.getClusters()) {
    let tmpCluster = {} as Cluster;
    tmpCluster.name = cluster.name;
    clusters.push(tmpCluster);
  }   
   
  return clusters;   
};

const getAllTaskRuns = async (clusterName: string, labelSelector: string, k8s: KubernetesApi): Promise<Array<TaskRun>> => {

  const url = `/apis/tekton.dev/v1/taskruns?labelSelector=${labelSelector}&limit=500`

  try {
    const response = await k8s.proxy({
      clusterName: clusterName,
      path: url,
    });

    if (response && response.status === 200) {
      const responseData = await response.json();
      if (responseData && responseData.items) {
        const taskRuns: Array<TaskRun> = responseData.items;
        return taskRuns;
      }
    }

    return []

  } catch (error) {
    console.error(`Error fetching TaskRuns:`, error);
    return []
  }
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
  const [clusters, setClusters] = useState<Array<Cluster>>([]);
  const k8s = useApi(kubernetesApiRef);
  
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const fetchedClusters = await fetchClusterNames(k8s);
        setClusters(fetchedClusters);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cluster names:', error);
      }
    };

    fetchClusters();
  }, [k8s]);

  useEffect(() => {
    // This useEffect will run whenever kubernetesObjects changes
    // If kubernetesObjects is not undefined or null, setLoading to false
    if (kubernetesObjects !== undefined && kubernetesObjects !== null) {
      const fetchTaskRuns = async () => {

        let updatedClusters: Array<Cluster> = [];

        for (const cluster of clusters) {
          // Find the KubernetesObject that corresponds to the current cluster
          const kubernetesObject = kubernetesObjects.items.find(
            obj => obj.cluster.name === cluster.name,
          );

          if (kubernetesObject) {
            // get only custom resource      
            let customResources = kubernetesObject?.resources.filter(isCustomResource);

            // get pipelineruns    
            let pipelineRunsCRs = customResources?.map((r) => {
              return { ...r, resources: r.resources.filter(isPipelineRun) }
            });

            // flatten object
            const flattenedPipelineRunsAny = pipelineRunsCRs?.flatMap(({ resources }) =>
              [...resources]
            ) ?? [];

            // cast objects to PipelineRun
            const flattenedPipelineRuns = flattenedPipelineRunsAny as PipelineRun[];
            cluster.pipelineRuns = flattenedPipelineRuns;

            // get all taskruns
            let allTaskRuns: Array<TaskRun> = [];
            if (entity?.metadata?.annotations?.["backstage.io/kubernetes-label-selector"]) {
              allTaskRuns = await getAllTaskRuns(cluster.name, entity.metadata.annotations["backstage.io/kubernetes-label-selector"], k8s);
            } else if (entity?.metadata?.annotations?.["backstage.io/kubernetes-namespace"]) {
              allTaskRuns = await getAllTaskRuns(cluster.name, entity.metadata.annotations["backstage.io/kubernetes-namespace"], k8s);
            } else {
              allTaskRuns = await getAllTaskRuns(cluster.name, "", k8s);
            }

            for (const pipelineRun of flattenedPipelineRuns) {
              const dashboardAnnotation = "tektonci." + cluster.name + "/dashboard";
              // set dashboardUrl      
              if (entity.metadata.annotations?.[dashboardAnnotation] !== undefined) {
                const dashboardUrl = entity.metadata.annotations[dashboardAnnotation] ?? "";
                const replacedUrl = dashboardUrl
                  .replace(/\$namespace/g, encodeURIComponent(pipelineRun.metadata.namespace))
                  .replace(/\$pipelinerun/g, encodeURIComponent(pipelineRun.metadata.name));
                pipelineRun.pipelineRunDashboardUrl = replacedUrl;
              }

              const taskRunsForPipelineRun: Array<TaskRun> = [];
              for (const taskRun of allTaskRuns) {
                const pipelineRunNameLabel = taskRun.metadata.labels['tekton.dev/pipelineRun'];
                if ((String(pipelineRunNameLabel) === pipelineRun.metadata.name) && (taskRun.apiVersion === pipelineRun.apiVersion)) {
                  taskRunsForPipelineRun.push(taskRun)
                }
              }
              // sort taskRunsForPipelineRun based on start time if needed
              taskRunsForPipelineRun.sort((taskRunA, taskRunB) =>
                (taskRunA?.status?.startTime ?? 0) > (taskRunB?.status?.startTime ?? 0) ? -1 : 1
              );
              pipelineRun.taskRuns = taskRunsForPipelineRun;
            }

            // sort           
            cluster.pipelineRuns.sort((pipelineA, pipelineB) =>
              (pipelineA?.status?.startTime ?? 0) > (pipelineB?.status?.startTime ?? 0) ? -1 : 1
            );

            updatedClusters.push(cluster);
          }
        }

        setClusters(updatedClusters);
      };
      fetchTaskRuns()
    }

  }, [kubernetesObjects]);

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
          clusters?.length > 0 && (
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
              {selectedCluster && kubernetesObjects?.items !== undefined && (
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

function isCustomResource(n: FetchResponse) {

  if (n.type === 'customresources') {
    return true;
  }
  else {
    return false;
  }
}

function isPipelineRun(n: any): n is PipelineRun {
  if (n.kind === 'PipelineRun') {
    return true;
  } else {
    return false;
  }
}