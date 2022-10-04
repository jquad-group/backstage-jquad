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
    labels: Array<string>;
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
      const pipelineRuns = await getPipelineRuns(baseUrl, authorizationBearerToken, namespace, selector, dashboardBaseUrl)
      for (const pipelineRun of pipelineRuns) {
        const taskRuns = await getTaskRunsForPipelineRun(baseUrl, authorizationBearerToken, namespace, pipelineRun.metadata.name)
        for (const taskRun of taskRuns) {
          await getLogsForTaskRun(baseUrl, authorizationBearerToken, namespace, taskRun)
        }
        const taskRunsSorted = taskRuns.sort(
          (taskRunA, taskRunB) => taskRunA.status.startTime.getTime() - taskRunB.status.startTime.getTime(),
        );        
        pipelineRun.taskRuns = taskRunsSorted
      }
      return pipelineRuns
}