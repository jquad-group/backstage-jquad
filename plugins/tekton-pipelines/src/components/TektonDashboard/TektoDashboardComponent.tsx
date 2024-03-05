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

const getTaskRunsForCluster = async (clusterName: string, tektonApi: string, labelSelector: string, k8s: KubernetesApi): Promise<Array<TaskRun>> => {

  const url = `/apis/tekton.dev/${tektonApi}/taskruns?labelSelector=${labelSelector}&limit=500`

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

const getPipelineRunsForCluster = async (clusterName: string, tektonApi: string, labelSelector: string, k8s: KubernetesApi): Promise<Array<PipelineRun>> => {

  const url = `/apis/tekton.dev/${tektonApi}/pipelineruns?labelSelector=${labelSelector}&limit=500`

  try {
    const response = await k8s.proxy({
      clusterName: clusterName,
      path: url,
    });

    if (response && response.status === 200) {
      const responseData = await response.json();
      if (responseData && responseData.items) {
        const pipelineRuns: Array<PipelineRun> = responseData.items;
        return pipelineRuns;
      }
    }

    return []

  } catch (error) {
    console.error(`Error fetching PipelineRuns:`, error);
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
  const [fetchingData, setFetchingData] = useState(false); // State to manage fetching data state
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
  }, []);

  useEffect(() => {
    // This useEffect will run whenever kubernetesObjects changes
    const loadedCluster = kubernetesObjects?.items.find(obj => obj.cluster.name === selectedCluster);
    if (loadedCluster === undefined && selectedCluster) {
      setFetchingData(true);
    }    
    if (loadedCluster !== undefined && selectedCluster !== null) {
      const fetchTaskRuns = async () => {                
        // Create a copy of the clusters array
        const updatedClusters = [...clusters];

        // Find the selected cluster in the array
        const selectedClusterIndex = updatedClusters.findIndex(cluster => cluster.name === selectedCluster);

        if (loadedCluster.errors.length === 0) {            
          // create tmpCluster
          const tmpCluster = {} as Cluster;
          tmpCluster.name = loadedCluster.cluster.name;

          // get all PipelineRuns   
          let pipelineRunsPromise: Promise<PipelineRun[]>;
          if (entity?.metadata?.annotations?.["tektonci/api"]) {
              const tektonApi = entity?.metadata?.annotations?.["tektonci/api"];
              if (entity?.metadata?.annotations?.["backstage.io/kubernetes-label-selector"]) {
                pipelineRunsPromise = getPipelineRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-label-selector"], k8s);
              } else if (entity?.metadata?.annotations?.["backstage.io/kubernetes-namespace"]) {
                pipelineRunsPromise = getPipelineRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-namespace"], k8s);
              } else {
                pipelineRunsPromise = getPipelineRunsForCluster(tmpCluster.name, tektonApi, "", k8s);
              }         
          } else {
            const tektonApi = "v1";
            if (entity?.metadata?.annotations?.["backstage.io/kubernetes-label-selector"]) {
              pipelineRunsPromise = getPipelineRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-label-selector"], k8s);
            } else if (entity?.metadata?.annotations?.["backstage.io/kubernetes-namespace"]) {
              pipelineRunsPromise = getPipelineRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-namespace"], k8s);
            } else {
              pipelineRunsPromise = getPipelineRunsForCluster(tmpCluster.name, tektonApi, "", k8s);
            }
          }          


          // get all taskruns
          let taskRunsPromise: Promise<TaskRun[]>;
          if (entity?.metadata?.annotations?.["tektonci/api"]) {
            const tektonApi = entity?.metadata?.annotations?.["tektonci/api"];
            if (entity?.metadata?.annotations?.["backstage.io/kubernetes-label-selector"]) {
              taskRunsPromise = getTaskRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-label-selector"], k8s);
            } else if (entity?.metadata?.annotations?.["backstage.io/kubernetes-namespace"]) {
              taskRunsPromise = getTaskRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-namespace"], k8s);
            } else {
              taskRunsPromise = getTaskRunsForCluster(tmpCluster.name, tektonApi, "", k8s);
            }
          } else {
            const tektonApi = "v1";
            if (entity?.metadata?.annotations?.["backstage.io/kubernetes-label-selector"]) {
              taskRunsPromise = getTaskRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-label-selector"], k8s);
            } else if (entity?.metadata?.annotations?.["backstage.io/kubernetes-namespace"]) {
              taskRunsPromise = getTaskRunsForCluster(tmpCluster.name, tektonApi, entity.metadata.annotations["backstage.io/kubernetes-namespace"], k8s);
            } else {
              taskRunsPromise = getTaskRunsForCluster(tmpCluster.name, tektonApi, "", k8s);
            }            
          }

          const [allPipelineRuns, allTaskRuns] = await Promise.all([pipelineRunsPromise, taskRunsPromise]);
          tmpCluster.pipelineRuns = allPipelineRuns;

          for (const pipelineRun of tmpCluster.pipelineRuns) {
            const dashboardAnnotation = "tektonci." + tmpCluster.name + "/dashboard";
            // set dashboardUrl      
            if (entity.metadata.annotations?.[dashboardAnnotation] !== undefined) {
              const dashboardUrl = entity.metadata.annotations[dashboardAnnotation] ?? "";
              const replacedUrl = dashboardUrl
                .replace(/\$namespace/g, encodeURIComponent(pipelineRun.metadata.namespace))
                .replace(/\$pipelinerun/g, encodeURIComponent(pipelineRun.metadata.name));
              pipelineRun.pipelineRunDashboardUrl = replacedUrl;
            }
            // assign the taskruns to the relevant pipelineruns
            const taskRunsForPipelineRun: Array<TaskRun> = [];
            for (const taskRun of allTaskRuns) {
              const pipelineRunNameLabel = taskRun.metadata.labels['tekton.dev/pipelineRun'];
              if ((String(pipelineRunNameLabel) === pipelineRun.metadata.name) && (taskRun.apiVersion === pipelineRun.apiVersion)) {
                taskRunsForPipelineRun.push(taskRun)
              }
            }
            // sort the taskruns associated to a pipelinerun based on start time
            taskRunsForPipelineRun.sort((taskRunA, taskRunB) =>
              (taskRunA?.status?.startTime ?? 0) > (taskRunB?.status?.startTime ?? 0) ? -1 : 1
            );
            pipelineRun.taskRuns = taskRunsForPipelineRun;
          }

          // sort the pipelineruns       
          tmpCluster.pipelineRuns.sort((pipelineA, pipelineB) =>
            (pipelineA?.status?.startTime ?? 0) > (pipelineB?.status?.startTime ?? 0) ? -1 : 1
          );
          
          updatedClusters[selectedClusterIndex] = {
            ...updatedClusters[selectedClusterIndex],
            pipelineRuns: tmpCluster.pipelineRuns,
          };         

          setClusters(updatedClusters);        
          setFetchingData(false);
        } else if (loadedCluster && loadedCluster.errors.length > 0) {
          const tmpCluster = {} as Cluster;
          tmpCluster.name = loadedCluster.cluster.name;
          tmpCluster.error = loadedCluster.errors[0].errorType; // + ":" + JSON.stringify(kubernetesObject.errors[0], null, 2);
          updatedClusters[selectedClusterIndex] = tmpCluster;
          setClusters(updatedClusters);
          setFetchingData(false);
        } else {
          updatedClusters[selectedClusterIndex] = {
            ...updatedClusters[selectedClusterIndex],
            pipelineRuns: [],
          };         
          setClusters(updatedClusters);   
        }                  
      };
      fetchTaskRuns()
    }

  //}, [kubernetesObjects?.items.find(obj => obj.cluster.name === selectedCluster), selectedCluster]);
}, [kubernetesObjects, selectedCluster]);

  const handleClusterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if (selectedCluster !== null) {
      setFetchingData(true);
    }
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
              <Grid>
                <Grid item>
                {fetchingData && selectedCluster && (
                    <div className="progress-bar-container">
                      <Progress />
                    </div>
                  ) 
                }
                </Grid>
              </Grid>
              {!fetchingData && selectedCluster && kubernetesObjects?.items !== undefined && (
                <Grid item>
                  <ContentHeader title={selectedCluster} textAlign="center"></ContentHeader>
                  {clusters
                    .filter((cluster) => cluster.name === selectedCluster)
                    .map((cluster) => {
                      if (cluster.error) {
                        return (
                          <Box key={selectedCluster} textAlign="center" fontSize="20px">
                            {`Error fetching data for cluster ${cluster.name}: ${cluster.error}`}
                          </Box>
                        );
                      } else if (
                        cluster.pipelineRuns !== undefined &&
                        cluster.pipelineRuns !== null &&
                        cluster.pipelineRuns.length > 0
                      ) {
                        return (
                          <CollapsibleTable
                            key={selectedCluster}
                            clusterName={cluster.name}
                            pipelineruns={cluster.pipelineRuns}
                          />
                        );
                      } else if (!fetchingData && (cluster.pipelineRuns === undefined || cluster.pipelineRuns.length === 0)) {
                        return (
                          <Box key={selectedCluster} textAlign="center" fontSize="20px">
                            No pipeline runs for the selected cluster.
                          </Box>
                        );
                      } else {
                        return null;
                      }
                    })}
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
}