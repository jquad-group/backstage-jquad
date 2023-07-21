export interface Cluster {
    name: string;
    pipelineRuns: PipelineRun[];
    error: string;
  }
  
  export interface PipelineRun {
    apiVersion: string;
    kind: string;
    metadata: {
      name: string;
      namespace: string;
      labels: Record<string, string>;
    };
    pipelineRunDashboardUrl: string;
    taskRuns: Array<TaskRun>;
    status: {
      childReferences: Array<ChildReferences>
      conditions: [Condition];
      startTime: string;
      completionTime: string;
      duration: number;
      durationString: string;
    };
  }
  
  export interface ChildReferences {
    apiVersion: string;
    kind: string;
    name: string;
    pipelineTaskName: string;
  }

  export interface TaskRun {
    apiVersion: string;
    kind: string;
    metadata: {
      name: string;
      namespace: string;
      labels: Record<string, string>;
    };
    status: {
      conditions: [Condition];
      podName: string;
      steps: Array<Step>;
      startTime: string;
      completionTime: string;
      duration: number;
      durationString: string;
    };
  }
  
  export interface Label {
    key: string;
    value: string;
  }
  
  export interface Step {
    container: string;
    name: string;
    terminated: Terminated;
    log: string;
  }
  
  export interface Terminated {
    startedAt: string;
    finishedAt: string;
    duration: number;
    durationString: string;
    reason: string;
  }
  
  export interface Condition {
    reason: string;
    type: string;
    status: string;
    message: string;
  }
  