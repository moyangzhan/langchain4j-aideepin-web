import { defineStore } from 'pinia'
import { emptyWorkflowInfo } from '@/utils/functions'
import { router } from '@/router'

export const useWfStore = defineStore('wf-store', {
  state: (): Workflow.WorkflowState => {
    return {
      showCreateOrEditView: false,
      createOrEditWfUuid: '',
      selectedType: 'mine',
      activeWorkflowInfo: emptyWorkflowInfo(),
      activeUuid: 'default',
      wfComponents: [],
      wfUuidToUIWorkflow: new Map<string, Workflow.UIWorkflow>(),
      myWorkflows: [],
      publicWorkflows: [],
      loadingMyWorkflows: false,
      loadingPublicWorkflows: false,
      wfUuidToWfRuntimeLoading: new Map<string, boolean>(), // is loading workflow instances
      wfUuidToWfRuntimes: new Map<string, Workflow.WorkflowRuntime[]>(),
      operators: [],
      submitting: false,
    }
  },

  getters: {
    getWfRuntimes(state: Workflow.WorkflowState) {
      return (wfUuid: string) => {
        const records = state.wfUuidToWfRuntimes.get(wfUuid)
        if (records)
          return records

        return []
      }
    },
    getOneNode(state: Workflow.WorkflowState) {
      return (wfUuid: string) => {
        const wf = this.getWorkflowInfo(wfUuid)
        if (!wf)
          return undefined
        const start = wf.nodes.find(item => item.wfComponent.name === 'Start')
        if (start)
          return start

        return wf.nodes[0]
      }
    },
    getStartNode(state: Workflow.WorkflowState) {
      return (wfUuid: string) => {
        const wf = this.getWorkflowInfo(wfUuid)
        if (!wf)
          return undefined
        return wf.nodes.find(item => item.wfComponent && item.wfComponent.name === 'Start')
      }
    },
    getStartNodeByWfId(state: Workflow.WorkflowState) {
      return (wfId: string) => {
        const wf = this.getWorkflowInfoById(wfId)
        if (!wf)
          return undefined
        return wf.nodes.find(item => item.wfComponent.name === 'Start')
      }
    },
    getWorkflowInfo(state: Workflow.WorkflowState) {
      return (wfUuid: string) => {
        const wf = state.myWorkflows.find(item => item.uuid === wfUuid)
        if (wf)
          return wf
        return state.publicWorkflows.find(item => item.uuid === wfUuid)
      }
    },
    getWorkflowInfoById(state: Workflow.WorkflowState) {
      return (id: string) => {
        const wf = state.myWorkflows.find(item => item.id === id)
        if (wf)
          return wf
        return state.publicWorkflows.find(item => item.id === id)
      }
    },
    getWfComponent(state: Workflow.WorkflowState) {
      return (name: string) => {
        return state.wfComponents.find(item => item.name === name)
      }
    },
    getOperatorDesc(state: Workflow.WorkflowState) {
      return (name: string) => {
        return state.operators.find(item => item.name === name)?.desc || ''
      }
    },
    getWfRuntime(state: Workflow.WorkflowState) {
      return (wfRuntimeUuid: string) => {
        let wfRuntime = null
        for (const rts of state.wfUuidToWfRuntimes.values()) {
          wfRuntime = rts.find((item: { uuid: string }) => item.uuid === wfRuntimeUuid)
          if (wfRuntime)
            break
        }
        if (!wfRuntime) {
          console.log(`wfRuntime not found: ${wfRuntimeUuid}`)
          return null
        }
        return wfRuntime
      }
    },
    getRuntimeNode(state: Workflow.WorkflowState) {
      return (wfRuntimeUuid: string, runtimeNodeUuid: string) => {
        const wfRuntime = this.getWfRuntime(wfRuntimeUuid)
        if (!wfRuntime)
          return null

        const runtimeNode = wfRuntime.nodes.find((item: { uuid: string }) => item.uuid === runtimeNodeUuid)
        if (!runtimeNode)
          console.log(`runtimeNode not found: ${runtimeNodeUuid}`)

        return runtimeNode
      }
    },
  },

  actions: {
    setShowCreateView(status: boolean, wfUuid: string) {
      this.showCreateOrEditView = status
      this.createOrEditWfUuid = wfUuid
    },
    setOperators(operators: Workflow.Operator[]) {
      this.operators = operators
    },
    setActive(wfUuid: string) {
      this.activeUuid = wfUuid
      const selected = this.getWorkflowInfo(wfUuid)
      if (selected)
        this.activeWorkflowInfo = selected
      else
        console.log(`setActive: ${wfUuid} workflow not found`)
    },
    setActiveAndGo(wfUuid: string, defaultViewType?: string) {
      this.setActive(wfUuid)
      this.reloadRoute(wfUuid, defaultViewType)
    },
    setLoadingMyWorkflows(status: boolean) {
      this.loadingMyWorkflows = status
    },
    setLoadingPublicWorkflows(status: boolean) {
      this.loadingPublicWorkflows = status
    },
    setLoadingRuntimes(currKbUuid: string, status: boolean) {
      this.wfUuidToWfRuntimeLoading.set(currKbUuid, status)
    },
    setWorkflowComponents(components: Workflow.WorkflowComponent[]) {
      this.wfComponents = components
    },
    addWorkflowAndActive(info: Workflow.WorkflowInfo) {
      this.myWorkflows.unshift(info)
      this.setActiveAndGo(info.uuid, 'workflowDefine')
    },
    appendWorkflows(infos: Workflow.WorkflowInfo[], isMine: boolean) {
      const workflows = isMine ? this.myWorkflows : this.publicWorkflows
      infos.forEach((workflow) => {
        if (workflows.findIndex(wf => wf.uuid === workflow.uuid) !== -1)
          return
        workflows.push(workflow)
        workflow.nodes.forEach((node) => {
          node.workflowUuid = workflow.uuid
          node.sourceHandleIds = []
          const wfComponent = this.wfComponents.find(component => component.id === node.workflowComponentId)
          if (wfComponent)
            node.wfComponent = wfComponent

          if (!node.inputConfig)
            node.inputConfig = { user_inputs: [], ref_inputs: [] }
        })
        workflow.edges.forEach((edge) => {
          edge.workflowUuid = workflow.uuid
        })
        workflow.deleteEdges = []
        workflow.deleteNodes = []
      })
    },
    updateWfNodeTitle(wfUuid: string, nodeUuid: string, newNodeTitle: string) {
      this.getWorkflowInfo(wfUuid)?.nodes.forEach((node) => {
        if (node.uuid === nodeUuid)
          node.title = newNodeTitle
      })
    },
    addRefInputToNode(wfUuid: string, nodeUuid: string, newInput: Workflow.NodeIORefDinition) {
      this.getWorkflowInfo(wfUuid)?.nodes.forEach((node) => {
        if (node.uuid === nodeUuid)
          node.inputConfig.ref_inputs.push(newInput)
      })
    },
    addUserInputToNode(wfUuid: string, nodeUuid: string, newInput: Workflow.NodeIODefinition) {
      this.getWorkflowInfo(wfUuid)?.nodes.forEach((node) => {
        if (node.uuid === nodeUuid)
          node.inputConfig.user_inputs.push(newInput)
      })
    },
    deleteRefInput(wfUuid: string, nodeUuid: string, idx: number) {
      this.getWorkflowInfo(wfUuid)?.nodes.forEach((node) => {
        if (node.uuid === nodeUuid)
          node.inputConfig.ref_inputs.splice(idx, 1)
      })
    },
    deleteUserInput(wfUuid: string, nodeUuid: string, idx: number) {
      this.getWorkflowInfo(wfUuid)?.nodes.forEach((node) => {
        if (node.uuid === nodeUuid)
          node.inputConfig.user_inputs.splice(idx, 1)
      })
    },
    initWfRuntime(wfRuntime: Workflow.WorkflowRuntime) {
      if (!wfRuntime.input)
        wfRuntime.input = {}

      if (!wfRuntime.output)
        wfRuntime.output = {}
    },
    setWfRuntimes(wfUuid: string, wfRuntimes: Workflow.WorkflowRuntime[]) {
      wfRuntimes.forEach((wfRuntime) => {
        this.initWfRuntime(wfRuntime)
      })
      this.wfUuidToWfRuntimes.set(wfUuid, wfRuntimes.reverse())
    },
    unshiftWfRuntimes(wfUuid: string, wfRuntimes: Workflow.WorkflowRuntime[]) {
      wfRuntimes.forEach((wfRuntime) => {
        this.initWfRuntime(wfRuntime)
        console.log('appendWfRuntime', wfRuntime)
      })
      const records = this.wfUuidToWfRuntimes.get(wfUuid)
      if (records)
        records.unshift(...wfRuntimes.reverse())
      else
        this.wfUuidToWfRuntimes.set(wfUuid, wfRuntimes.reverse())
    },
    appendWfRuntimes(wfUuid: string, wfRuntimes: Workflow.WorkflowRuntime[]) {
      wfRuntimes.forEach((wfRuntime) => {
        this.initWfRuntime(wfRuntime)
        console.log('appendWfRuntime', wfRuntime)
      })
      const records = this.wfUuidToWfRuntimes.get(wfUuid)
      if (records)
        records.push(...wfRuntimes.reverse())
      else
        this.wfUuidToWfRuntimes.set(wfUuid, wfRuntimes.reverse())
    },
    // 增加节点运行时信息
    appendRuntimeNode(wfRuntimeUuid: string, runtimeNode: Workflow.WfRuntimeNode) {
      const wfRuntime = this.getWfRuntime(wfRuntimeUuid)
      if (!wfRuntime)
        return

      const wfNode = this.getWorkflowInfoById(wfRuntime.workflowId)?.nodes.find(node => node.id === runtimeNode.nodeId)
      if (wfNode) {
        runtimeNode.nodeUuid = wfNode.uuid
        runtimeNode.nodeTitle = wfNode.title
      } else {
        console.log(`wfNode not found: ${runtimeNode.nodeId}`)
      }
      runtimeNode.wfRuntimeUuid = wfRuntime.uuid
      if (!runtimeNode.input)
        runtimeNode.input = {}

      if (!runtimeNode.output)
        runtimeNode.output = {}

      wfRuntime.nodes.push(runtimeNode)
    },
    appendInputToRuntimeNode(wfRuntimeUuid: string, runtimeNodeUuid: string, inputJson: string) {
      const runtimeNode = this.getRuntimeNode(wfRuntimeUuid, runtimeNodeUuid)
      if (runtimeNode) {
        // inputJson: {"name": "input1", "content":{"value": "input1", type: 1}}
        const obj = JSON.parse(inputJson)
        runtimeNode.input[obj.name] = obj.content
      }
    },
    appendOutputToRuntimeNode(wfRuntimeUuid: string, runtimeNodeUuid: string, outputJson: string) {
      const runtimeNode = this.getRuntimeNode(wfRuntimeUuid, runtimeNodeUuid)
      if (runtimeNode) {
        const obj = JSON.parse(outputJson)
        console.log('runtimeNode.output', runtimeNode.output[obj.name])
        runtimeNode.output[obj.name] = obj.content
        console.log('1111111111runtimeNode.output', runtimeNode.output[obj.name])
      }
    },
    appendChunkToRuntimeNode(wfRuntimeUuid: string, runtimeNodeUuid: string, chunk: string) {
      const runtimeNode = this.getRuntimeNode(wfRuntimeUuid, runtimeNodeUuid)
      if (runtimeNode)
        runtimeNode.output.output = runtimeNode.output.output + chunk
    },
    deleteWfRuntime(wfUuid: string, wfRuntimeUuid: string) {
      const wfRuntimes = this.wfUuidToWfRuntimes.get(wfUuid)
      if (wfRuntimes) {
        const idx = wfRuntimes.findIndex((inst: { uuid: string }) => inst.uuid === wfRuntimeUuid)
        if (idx > -1)
          wfRuntimes.splice(idx, 1)
      }
    },
    updateSuccess(wfUuid: string, wfRuntimeUuid: string, outputJson: string) {
      if (!wfRuntimeUuid) {
        console.log('updateSuccess instUuid is empty')
        return
      }
      const wfRuntimes = this.wfUuidToWfRuntimes.get(wfUuid)
      if (wfRuntimes) {
        const inst = wfRuntimes.find((inst: { uuid: string }) => inst.uuid === wfRuntimeUuid)
        if (inst) {
          inst.status = 2
          try {
            inst.output = JSON.parse(outputJson)
          } catch (e) {
            console.error(e)
            console.log('outputJson is not json', outputJson)
          }
        }
      }
    },
    clearWfRuntimes(wfUuid: string) {
      this.wfUuidToWfRuntimes.set(wfUuid, [])
    },
    deleteNode(wfUuid: string, nodeUuid: string) {
      // Delete node
      const wf = this.getWorkflowInfo(wfUuid)
      if (wf) {
        const idx = wf.nodes.findIndex((node: { uuid: string }) => node.uuid === nodeUuid)
        if (idx > -1)
          wf.nodes.splice(idx, 1)

        wf.deleteNodes.push(nodeUuid)
      }
      // Delete ui node
      const uiWorkflow = this.wfUuidToUIWorkflow.get(wfUuid)
      if (uiWorkflow) {
        const idx = uiWorkflow.nodes.findIndex((node: { id: string }) => node.id === nodeUuid)
        if (idx > -1)
          uiWorkflow.nodes.splice(idx, 1)
      }
    },
    deleteEdge(wfUuid: string, edgeUuid: string) {
      // Delete edge
      const wf = this.getWorkflowInfo(wfUuid)
      if (wf) {
        const idx = wf.edges.findIndex((edge: { uuid: string }) => edge.uuid === edgeUuid)
        if (idx > -1)
          wf.edges.splice(idx, 1)

        wf.deleteEdges.push(edgeUuid)
      }

      // Delete ui edge
      const uiWorkflow = this.wfUuidToUIWorkflow.get(wfUuid)
      if (uiWorkflow) {
        const idx = uiWorkflow.edges.findIndex((edge: { id: string }) => edge.id === edgeUuid)
        if (idx > -1)
          uiWorkflow.edges.splice(idx, 1)
      }
    },
    async reloadRoute(uuid?: string, defaultViewType?: string) {
      await router.replace({ name: 'WfDetail', params: { uuid, viewType: !defaultViewType ? 'instanceList' : defaultViewType } })
    },
  },
})
