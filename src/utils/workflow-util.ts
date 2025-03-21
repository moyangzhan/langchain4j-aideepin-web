import { v4 as uuidv4 } from 'uuid'
import { emptyWorkflowNode } from './functions'
import { useAppStore } from '@/store'

export function createNewNode(
  workflow: Workflow.WorkflowInfo,
  uiWorkflow: Workflow.UIWorkflow,
  component: Workflow.WorkflowComponent,
  position: { x: number; y: number },
) {
  const newWfNode = emptyWorkflowNode()
  newWfNode.uuid = uuidv4().replace(/-/g, '')
  newWfNode.title = component.title
  newWfNode.workflowId = workflow.id
  newWfNode.workflowUuid = workflow.uuid
  newWfNode.wfComponent = component
  newWfNode.workflowComponentId = component.id
  newWfNode.inputConfig = { user_inputs: [], ref_inputs: [] }
  newWfNode.nodeConfig = {}
  newWfNode.outputConfig = {}
  newWfNode.positionX = position.x
  newWfNode.positionY = position.y
  if (component.name === 'Classifier')
    createClassifierNode(newWfNode)
  else if (component.name === 'Answer')
    createAnswer(newWfNode)
  else if (component.name === 'Switcher')
    createSwitcherNode(workflow, newWfNode)
  else if (component.name === 'KeywordExtractor')
    createKeywordExtractor(newWfNode)

  workflow.nodes.push(newWfNode)
  uiWorkflow.nodes.push(wfNodeToUiNode(newWfNode))
}

export function createNewEdge(params: {
  workflow: Workflow.WorkflowInfo
  uiWorkflow: Workflow.UIWorkflow
  source: string
  sourceHandle: string
  target: string
},
) {
  const wfEdge = {
    id: '',
    uuid: uuidv4().replace(/-/g, ''),
    workflowId: params.workflow.id,
    sourceNodeUuid: params.source,
    sourceHandle: params.sourceHandle,
    targetNodeUuid: params.target,
    workflowUuid: params.workflow.uuid,
  }
  params.workflow.edges.push(wfEdge)
  if (params.target) {
    const uiEdge = {
      id: wfEdge.uuid,
      source: wfEdge.sourceNodeUuid,
      target: wfEdge.targetNodeUuid,
      type: 'special',
      animated: true,
      sourceHandle: params.sourceHandle ? params.sourceHandle : undefined,
    }
    params.uiWorkflow.edges.push(uiEdge)
  }
}

export function updateEdgeBySourceHandle(params:
{
  workflow: Workflow.WorkflowInfo
  uiWorkflow: Workflow.UIWorkflow
  source: string
  sourceHandle: string
  target: string
},
) {
  const wfEdge = params.workflow.edges.find(item => item.sourceHandle === params.sourceHandle)
  if (!wfEdge) {
    console.warn('no edge found for sourceHandle')
    return
  }
  wfEdge.targetNodeUuid = params.target
  const idx = params.uiWorkflow.edges.findIndex(item => item.source === params.source && item.sourceHandle === params.sourceHandle)
  if (idx > -1)
    params.uiWorkflow.edges.splice(idx, 1)

  const uiEdge = {
    id: wfEdge.uuid,
    source: wfEdge.sourceNodeUuid,
    target: wfEdge.targetNodeUuid,
    animated: true,
    sourceHandle: params.sourceHandle,
  }
  params.uiWorkflow.edges.push(uiEdge)
}

export function deleteEdgesBySource(
  workflow: Workflow.WorkflowInfo,
  uiWorkflow: Workflow.UIWorkflow,
  source: string,
) {
  const edges = workflow.edges.filter(edge => edge.sourceNodeUuid === source)
  edges.forEach((element) => {
    const edgeIndex = workflow.edges.findIndex((edge) => {
      const hit = edge.uuid === element.uuid
      if (hit)
        workflow.deleteEdges.push(edge.uuid)

      return hit
    })
    if (edgeIndex !== -1)
      workflow.edges.splice(edgeIndex, 1)

    const uiEdgeIndex = uiWorkflow.edges.findIndex(edge => edge.uuid === element.uuid)
    if (uiEdgeIndex !== -1)
      uiWorkflow.edges.splice(edgeIndex, 1)
  })
}

export function deleteEdgesBySourceHandle(
  workflow: Workflow.WorkflowInfo,
  uiWorkflow: Workflow.UIWorkflow,
  source: string,
  sourceHandle: string,
) {
  const edgeIndex = workflow.edges.findIndex((edge) => {
    const hit = edge.sourceNodeUuid === source && edge.sourceHandle === sourceHandle
    if (hit)
      workflow.deleteEdges.push(edge.uuid)

    return hit
  })
  if (edgeIndex !== -1)
    workflow.edges.splice(edgeIndex, 1)

  const uiEdgeIndex = uiWorkflow.edges.findIndex(edge => edge.sourceNodeUuid === source && edge.sourceHandle === sourceHandle)
  if (uiEdgeIndex !== -1)
    uiWorkflow.edges.splice(edgeIndex, 1)
}

function wfNodeToUiNode(node: Workflow.WorkflowNode) {
  const newNode = {
    id: node.uuid,
    type: node.wfComponent.name.toLowerCase(),
    data: node,
    position: {
      x: node.positionX,
      y: node.positionY,
    },
  }
  return newNode
}

function createSwitcherNode(workflow: Workflow.WorkflowInfo, node: Workflow.WorkflowNode) {
  const startNode = workflow.nodes.find(item => item.wfComponent.name === 'Start')
  if (!startNode)
    throw new Error('Start node not found')

  const firstInput = startNode.inputConfig.user_inputs[0]
  node.nodeConfig = {
    default_target_node_uuid: '',
    cases: [
      {
        operator: 'and',
        target_node_uuid: '',
        conditions:
          [
            { node_uuid: startNode.uuid, node_param_name: firstInput.name, operator: 'contains', value: '' },
          ],
      },
      {
        operator: 'and',
        target_node_uuid: '',
        conditions:
          [
            { node_uuid: startNode.uuid, node_param_name: firstInput.name, operator: 'contains', value: '' },
          ],
      },
    ],
  }
}

function createClassifierNode(node: Workflow.WorkflowNode) {
  const appStore = useAppStore()
  node.nodeConfig = {
    model_name: appStore.getFirstLLM().modelName,
    categories: [
      {
        category_uuid: 'and',
        category_name: '',
        target_node_uuid: '',
      },
      {
        category_uuid: 'and',
        category_name: '',
        target_node_uuid: '',
      },
    ],
  }
}

function createAnswer(node: Workflow.WorkflowNode) {
  const appStore = useAppStore()
  node.nodeConfig = {
    prompt: '',
    model_name: appStore.getFirstLLM().modelName,
  }
}

function createKeywordExtractor(node: Workflow.WorkflowNode) {
  const appStore = useAppStore()
  node.nodeConfig = {
    top_n: 5,
    model_name: appStore.getFirstLLM().modelName,
  }
}

export function getInputLabelFromParamName(workflow: Workflow.WorkflowInfo, nodeUuid: string, nodeParamName: string) {
  const node = workflow.nodes.find(node => node.uuid === nodeUuid)
  if (!node)
    return ''

  if (node.wfComponent.name === 'Start') {
    const inputConfig = node.inputConfig
    const input = inputConfig.user_inputs.find(input => input.name === nodeParamName)
    if (input)
      return input.title
  } else {
    return node.title
  }
}

export function getNameByInputType(type: number) {
  switch (type) {
    case 1:
      return '文本'
    case 2:
      return '数字'
    case 3:
      return '下拉选项'
    case 4:
      return '文件列表'
    default:
      return 'Unknown'
  }
}

export function getIconByComponentName(name: string) {
  switch (name.toLowerCase()) {
    case 'answer':
      return 'carbon:question-answering'
    case 'classifier':
      return 'carbon:type-pattern'
    case 'knowledgeretrieval':
      return 'carbon:connect-target'
    case 'documentextractor':
      return 'carbon:ibm-knowledge-catalog-standard'
    case 'keywordextractor':
      return 'carbon:api-key'
    case 'switcher':
      return 'oui:logstash-if'
    case 'template':
      return 'carbon:prompt-template'
    case 'draw':
      return 'solar:pallete-2-linear'
    case 'google':
      return 'ri:google-line'
    case 'end':
      return 'carbon:closed-caption'
    case 'start':
      return 'material-symbols:not-started-outline-rounded'
    default:
      return ''
  }
}

export function getIconClassByComponentName(name: string) {
  switch (name.toLowerCase()) {
    case 'answer':
      return 'text-green-800'
    case 'classifier':
      return 'text-violet-900'
    case 'knowledgeretrieval':
      return 'text-stone-900'
    case 'documentextractor':
      return 'text-rose-900'
    case 'keywordextractor':
      return 'text-cyan-900'
    case 'switcher':
      return 'text-yellow-900'
    case 'template':
      return 'text-sky-800'
    case 'draw':
      return 'text-fuchsia-700'
    case 'google':
      return 'text-emerald-900'
    case 'end':
      return 'text-orange-800'
    case 'start':
      return 'text-blue-900'
    default:
      return ''
  }
}
