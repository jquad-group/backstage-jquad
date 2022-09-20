import fetch from 'node-fetch'

interface PipelineRun {
    metadata: {
      name: string; 
      namespace: string;
      labels: Array<string>;
    }
    pipelineRunDashboardUrl: string;
    taskRuns: Array<TaskRun>
    status: {
      conditions: [
        Condition
      ]
    }
}

interface TaskRun {
  metadata: {
    name: string; 
    namespace: string;
    labels: Array<string>;
  }
  status: {
    conditions: [
      Condition
    ]
    startTime: Date
  }
}

interface Condition {
  reason: string;
  type: string;
  status: string;
  message: string;
}


const getPipelineRuns = async (baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string, dashboardBaseUrl: string): Promise<PipelineRun[]> => {
    let url: string
    if (selector) {
      url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/pipelineruns?labelSelector=${selector}`
    } else {
      url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/pipelineruns`
    }
    const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authorizationBearerToken}`,
        },
      }).then((res: { json: () => any }) => res.json())
    let prs: Array<PipelineRun> = []
    if (response.items) {
      const labels: Array<string> = response.items.map(
        (currentLabel: any) => currentLabel.metadata.labels
      );
      let trs: Array<TaskRun> = [];
      
      (response.items as PipelineRun[]).forEach(item => {
        const pr: PipelineRun = {
          metadata: {
            name: item.metadata.name,
            namespace: item.metadata.namespace,
            labels: labels,
          },
          pipelineRunDashboardUrl: `${dashboardBaseUrl}#/namespaces/${namespace}/pipelineruns/${item.metadata.name}`,
          taskRuns: trs,
          status: {
            conditions: [
              item.status.conditions[0]
            ],
          },
        }
        
        prs.push(pr)
      })      
    }
    return prs
} 

const getTaskRunsForPipelineRun = async (baseUrl: string, authorizationBearerToken: string, namespace: string, pipelineRunName: string): Promise<TaskRun[]> => {

  const url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/taskruns?labelSelector=tekton.dev%2FpipelineRun%3D${pipelineRunName}&limit=500`
  const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorizationBearerToken}`,
      },
    }).then((res: { json: () => any }) => res.json())
  let taskRuns: Array<TaskRun> = []
  if (response.items) {      
    const labels: Array<string> = response.items.map(
      (currentLabel: any) => currentLabel.metadata.labels
    );    
    (response.items as TaskRun[]).forEach(item => {
      const taskRun: TaskRun = {
        metadata: {
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          labels: labels
        },
        status: {
          conditions: [
            item.status.conditions[0]
          ],
          startTime: new Date(item.status.startTime)
        },
      }
      taskRuns.push(taskRun)
    })      
  }
  return taskRuns
} 


export async function getMicroservicePipelineRuns(baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string, dashboardBaseUrl: string): Promise<PipelineRun[]> {  
      const pipelineRuns = await getPipelineRuns(baseUrl, authorizationBearerToken, namespace, selector, dashboardBaseUrl)
      for (const pipelineRun of pipelineRuns) {
        const taskRuns = await getTaskRunsForPipelineRun(baseUrl, authorizationBearerToken, namespace, pipelineRun.metadata.name)
        const taskRunsSorted = taskRuns.sort(
          (taskRunA, taskRunB) => taskRunA.status.startTime.getTime() - taskRunB.status.startTime.getTime(),
        );        
        pipelineRun.taskRuns = taskRunsSorted
      }
      return pipelineRuns
}