declare namespace Workflow {
  import type { Node, Edge } from '@vue-flow/core'

  interface WorkflowComponent {
    id: string
    uuid: string
    name: string
    title: string
    remark: string
    isEnable: boolean
  }

  interface WorkflowNode {
    id: string
    uuid: string
    workflowId: string
    workflowComponentId: string
    title: string
    remark: string
    inputConfig: { user_inputs: NodeIODefinition[], ref_inputs: NodeIORefDinition[] }
    nodeConfig: NodeConfig
    outputConfig: object
    positionX: number
    positionY: number

    workflowUuid: string
    wfComponent: WorkflowComponent
    sourceHandleIds: string[]
    targetHandleIds: string[]
  }

  interface WorkflowEdge {
    id: string
    uuid: string
    workflowId: string
    sourceNodeUuid: string
    sourceHandle: string
    targetNodeUuid: string

    workflowUuid: string
  }

  // 工作流信息
  interface WorkflowInfo {
    id: string
    uuid: string
    title: string
    remark: string
    isPublic: boolean
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    userId: string
    userUuid: string
    userName: string
    createTime: string

    deleteNodes: string[]
    deleteEdges: string[]
  }

  interface WorkflowUpdateReq {
    uuid: string
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    deleteNodes: string[]
    deleteEdges: string[]
  }

  // 工作流运行时信息
  interface WorkflowRuntime {
    id: string
    uuid: string
    workflowId: string
    input: any
    output: any
    status: number
    statusRemark: string
    createTime: string
    nodes: WfRuntimeNode[]
    error: boolean
    loading: boolean

    wfUuid: string
  }

  interface WfRuntimeNode {
    id: string
    uuid: string
    workflowRuntimeId: string
    nodeId: string
    //json object
    input: any
    //json object
    output: any
    status: number
    statusRemark: string
    createTime: string

    wfRuntimeUuid: string
    nodeUuid: string
    nodeTitle: string
    error: boolean
  }

  interface WorkflowState {
    showCreateOrEditView: boolean
    createOrEditWfUuid: string
    selectedType: string
    activeWorkflowInfo: WorkflowInfo
    wfUuidToUIWorkflow: Map<string, UIWorkflow>
    activeUuid: string
    wfComponents: WorkflowComponent[]
    myWorkflows: WorkflowInfo[]
    publicWorkflows: WorkflowInfo[]
    loadingMyWorkflows: boolean,
    loadingPublicWorkflows: boolean,
    wfUuidToWfRuntimeLoading: Map<string, boolean>
    wfUuidToWfRuntimes: Map<string, WorkflowRuntime[]>
    operators: Operator[]
    submitting: boolean
  }

  interface InfoListResp {
    total: number,
    records: WorkflowInfo[]
  }

  interface WfRuntimesResp {
    total: number,
    records: WorkflowRuntime[]
  }

  interface NodeIODefinition {
    uuid: string
    type: number
    name: string
    title: string
    required: boolean

    //type === files
    limit: number
    //type === options
    multiple: boolean
  }

  //引用类型的输入输出定义
  interface NodeIORefDinition {
    uuid: string
    name: string
    node_param_name: string
    node_uuid: string
  }

  interface UserInput {
    uuid: string
    name: string
    content: UserInputContent

    required: boolean
  }

  interface UserInputContent {
    type: number
    value: any
    title: string
  }

  interface NodeIOData {
    name: string
    type: number
    value: any
  }

  interface NodeConfig {
  }

  interface NodeConfigAnswer implements NodeConfig {
    model_name: string
    prompt: string
  }

  //Classifier node
  interface NodeConfigClassifier implements NodeConfig {
    model_name: string
    categories: NodeConfigClassifierCategory[]
  }

  interface NodeConfigClassifierCategory {
    target_node_uuid: string
    category_uuid: string
    category_name: string
  }

  //Switcher node
  interface NodeConfigSwitcher implements NodeConfig {
    default_target_node_uuid: string
    cases: NodeConfigSwitcherCase[]
  }

  interface NodeConfigTemplate implements NodeConfig {
    template: string
  }

  interface NodeConfigEnd implements NodeConfig {
    result: string
  }

  interface NodeConfigSwitcherCase {
    uuid: string
    operator: string
    target_node_uuid: string
    conditions: NOdeConfigCaseCondition[]
  }

  interface NodeConfigSwitcherCaseCondition {
    uuid: string
    node_uuid: string
    node_param_name: string
    operator: string
    value: string
  }

  interface NodeConfigKeywordExtractor implements NodeConfig {
    model_name: string
    top_n: number
  }

  interface NodeIOData {
    name: string
    value: any
  }

  interface Operator {
    name: string
    desc: string
  }

  interface UIWorkflow {
    nodes: Node[]
    edges: Edge[]
  }

  interface InputLabel {
    label: string
    value: string
  }
}