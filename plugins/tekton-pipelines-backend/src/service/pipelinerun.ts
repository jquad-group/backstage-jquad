import fetch from 'node-fetch'

export interface PipelineRun {
    metadata: {
      name: string; 
      namespace: string;
      labels: Record<string, Label>;
    }
    pipelineRunDashboardUrl: string;
    taskRuns: Array<TaskRun>
    status: {
      conditions: [
        Condition
      ]
      startTime: Date
      completionTime: Date
      duration: number
      durationString: string
    }
}

interface TaskRun {
  metadata: {
    name: string; 
    namespace: string;
    labels: Record<string, Label>;
  }
  status: {
    conditions: [
      Condition
    ],
    podName: string;
    steps: Array<Step>;
    startTime: Date;
    completionTime: Date;
    duration: number;
    durationString: string;
  }
}

interface Label {
  key: string;
  value: string;
}

interface Step {
  container: string;
  name: string;
  terminated: Terminated;
  log: string;
}

interface Terminated {
  startedAt: Date
  finishedAt: Date
  duration: number
  durationString: string  
  reason: string
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
    const prs: Array<PipelineRun> = []
    if (response.items) {

      const trs: Array<TaskRun> = [];
      
      (response.items as PipelineRun[]).forEach(item => {
        const pr: PipelineRun = {
          metadata: {
            name: item.metadata.name,
            namespace: item.metadata.namespace,
            labels: item.metadata.labels,
          },
          pipelineRunDashboardUrl: `${dashboardBaseUrl}#/namespaces/${namespace}/pipelineruns/${item.metadata.name}`,
          taskRuns: trs,
          status: {
            conditions: [
              item.status.conditions[0]
            ],
            startTime: new Date(item.status.startTime),
            completionTime: new Date(item.status.completionTime),
            duration: (new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000,            
            durationString: new Date(((new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000) * 1000).toISOString().slice(11, 19)
          },
        }
        
        prs.push(pr)
      })      
    }
    return prs
} 

const getTaskRunsForMicroservice = async (baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string): Promise<TaskRun[]> => {

  let url: string
  if (selector) {
    url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/taskruns?labelSelector=${selector}&limit=500`
  } else {
    url = `${baseUrl}/apis/tekton.dev/v1beta1/namespaces/${namespace}/taskruns`
  }

  const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authorizationBearerToken}`,
      },
    }).then((res: { json: () => any }) => res.json())
  const taskRuns: Array<TaskRun> = []
  
  if (response.items) {      
    (response.items as TaskRun[]).forEach(item => {
      const taskRun: TaskRun = {
        metadata: {
          name: item.metadata.name,
          namespace: item.metadata.namespace,
          labels: item.metadata.labels,
        },
        status: {
          conditions: [
            item.status.conditions[0]
          ],
          steps: item.status.steps,
          podName: item.status.podName,
          startTime: new Date(item.status.startTime),
          completionTime: new Date(item.status.completionTime),
          duration: (new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000,            
          durationString: new Date(((new Date(item.status.completionTime).getTime() - new Date(item.status.startTime).getTime()) / 1000) * 1000).toISOString().slice(11, 19)
        },
      }
      taskRuns.push(taskRun)
    })      
  }
  return taskRuns
} 

const getLogsForTaskRun = async (baseUrl: string, authorizationBearerToken: string, namespace: string, taskRun: TaskRun): Promise<void> => {
  
  for(const currentStep of taskRun.status.steps) {
    const url = `${baseUrl}/api/v1/namespaces/${namespace}/pods/${taskRun.status.podName}/log?container=${currentStep.container}`
    const response = await fetch(url, {
        headers: {
          'Content-Type': 'plain/text',
          Authorization: `Bearer ${authorizationBearerToken}`,
        },
      })
    currentStep.terminated.durationString = new Date(((new Date(currentStep.terminated.finishedAt).getTime() - new Date(currentStep.terminated.startedAt).getTime()) / 1000) * 1000).toISOString().slice(11, 19);
    currentStep.terminated.startedAt = new Date(currentStep.terminated.startedAt);
    const decoded = await response.text() 
    currentStep.log = decoded
  }

}

export async function getMicroservicePipelineRuns(baseUrl: string, authorizationBearerToken: string, namespace: string, selector: string, dashboardBaseUrl: string): Promise<PipelineRun[]> {  
      const [pipelineRuns, taskRuns] = await Promise.all([getPipelineRuns(baseUrl, authorizationBearerToken, namespace, selector, dashboardBaseUrl), getTaskRunsForMicroservice(baseUrl, authorizationBearerToken, namespace, selector)])
 
      for (const pipelineRun of pipelineRuns) {
        const taskRunsForPipelineRun: Array<TaskRun> = [];
        for (const taskRun of taskRuns) {
          const pipelineRunNameLabel = taskRun.metadata.labels["tekton.dev/pipelineRun"]          
          if (String(pipelineRunNameLabel) == pipelineRun.metadata.name) {
            await getLogsForTaskRun(baseUrl, authorizationBearerToken, namespace, taskRun)
            taskRunsForPipelineRun.push(taskRun);
          }
        }
        const taskRunsSorted = taskRunsForPipelineRun.sort(
          (taskRunA, taskRunB) => taskRunA.status.startTime.getTime() - taskRunB.status.startTime.getTime(),
        );        
        pipelineRun.taskRuns = taskRunsSorted

        }
      
      return pipelineRuns
}