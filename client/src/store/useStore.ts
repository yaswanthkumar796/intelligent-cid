import { create } from 'zustand';

interface Pipeline {
  _id: string;
  name: string;
  repository: string;
  branch?: string;
  language: string;
  status: string;
  steps?: any[];
}

interface Execution {
  _id: string;
  pipelineId: Pipeline | string;
  status: string;
  logs: string;
  createdAt?: string;
  errorCategory?: string;
  aiSuggestion?: string;
  aiConfidence?: number;
  retryCount: number;
  healingSteps?: { action: string; timestamp: string; logs: string }[];
  rootCause?: string;
  recoveryStrategy?: string;
  recoveryDuration?: number;
  wasAutoHealed?: boolean;
}

interface AppState {
  pipelines: Pipeline[];
  executions: Execution[];
  activeExecution: Execution | null;
  setPipelines: (pipelines: Pipeline[]) => void;
  addPipeline: (pipeline: Pipeline) => void;
  setExecutions: (executions: Execution[]) => void;
  addOrUpdateExecution: (execution: Execution) => void;
  setActiveExecution: (execution: Execution | null) => void;
  updateExecutionStatus: (id: string, status: string, errorCategory?: string, wasAutoHealed?: boolean) => void;
  appendLog: (id: string, log: string) => void;
  updateAIInsight: (id: string, insight: any) => void;
}

export const useStore = create<AppState>((set) => ({
  pipelines: [],
  executions: [],
  activeExecution: null,
  setPipelines: (pipelines) => set({ pipelines }),
  addPipeline: (pipeline) => set((state) => ({ pipelines: [pipeline, ...state.pipelines] })),
  setExecutions: (executions) => set({ executions }),
  addOrUpdateExecution: (execution) => set((state) => {
    const exists = state.executions.find(e => e._id === execution._id);
    if (exists) {
      return { executions: state.executions.map(e => e._id === execution._id ? execution : e) };
    }
    return { executions: [execution, ...state.executions] };
  }),
  setActiveExecution: (execution) => set({ activeExecution: execution }),
  
  updateExecutionStatus: (id, status, errorCategory, wasAutoHealed) => set((state) => {
    const newExecutions = state.executions.map(ex => 
      ex._id === id ? { ...ex, status, ...(errorCategory && { errorCategory }), ...(wasAutoHealed !== undefined && { wasAutoHealed }) } : ex
    );
    const newActive = state.activeExecution?._id === id 
      ? { ...state.activeExecution, status, ...(errorCategory && { errorCategory }), ...(wasAutoHealed !== undefined && { wasAutoHealed }) } 
      : state.activeExecution;
    
    return { executions: newExecutions, activeExecution: newActive };
  }),

  appendLog: (id, log) => set((state) => {
    if (state.activeExecution?._id === id) {
      return {
        activeExecution: {
          ...state.activeExecution,
          logs: (state.activeExecution.logs || '') + log
        }
      };
    }
    return state;
  }),

  updateAIInsight: (id, insight) => set((state) => {
    const updates = {
      errorCategory: insight.category,
      aiSuggestion: insight.suggestion,
      aiConfidence: insight.confidence
    };
    
    const newExecutions = state.executions.map(ex => 
      ex._id === id ? { ...ex, ...updates } : ex
    );
    
    const newActive = state.activeExecution?._id === id 
      ? { ...state.activeExecution, ...updates } 
      : state.activeExecution;
      
    return { executions: newExecutions, activeExecution: newActive };
  })
}));
