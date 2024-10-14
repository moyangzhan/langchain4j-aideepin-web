<script setup lang='ts'>
import { nextTick, onActivated, onMounted, ref, watch } from 'vue'
import { NButton, NDivider, NFlex } from 'naive-ui'
import cytoscape from 'cytoscape'
import { useKbStore } from '@/store'
import api from '@/api'
interface Props {
  qaRecordUuid: string
}
const props = withDefaults(defineProps<Props>(), {
  qaRecordUuid: '',
})
const kbStore = useKbStore()
const loading = ref<boolean>(false)
const isEmpty = ref<boolean>(false)
const selectedVertex = ref<KnowledgeBase.KbVertex | null>()
const selectedEdge = ref<KnowledgeBase.KbEdge | null>()
const graphRef = ref<KnowledgeBase.QaRecordGraphRef | null>({ edges: [], vertices: [] })
let cy: any = null

function getAndRenderGraph() {
  graphRef.value = kbStore.getGraphRef(props.qaRecordUuid)
  if (!graphRef.value)
    loadGraph()
  else
    parseAndRender(graphRef.value)
}

function parseAndRender(graphRef: KnowledgeBase.QaRecordGraphRef) {
  if (cy) {
    console.log(cy.$('node'))
    cy.$('node').remove()
    cy.$('edge').remove()
  }
  const nodes = graphRef.vertices.map((item) => {
    return { group: 'nodes', data: { id: `${item.id}`, name: item.name, description: item.description } }
  })
  const edges = graphRef.edges.map((item) => {
    return { group: 'edges', data: { id: `${item.id}`, label: `${item.label}`, source: `${item.startId}`, target: `${item.endId}`, description: item.description } }
  })
  if (!cy) {
    nextTick(() => {
      initCy()
      renderGraph(nodes, edges)
    })
  } else {
    renderGraph(nodes, edges)
  }
}

function renderGraph(nodes: any, edges: any) {
  console.log('renderGraph')
  if (nodes.length > 0) {
    cy.add(nodes)
    cy.nodes().on('click', (e: any) => {
      const clickedNode = e.target
      selectedVertex.value = clickedNode.data()
      selectedEdge.value = null
    })
  }
  if (edges.length > 0) {
    cy.add(edges)
    cy.edges().on('click', (e: any) => {
      const clickedNode = e.target
      selectedVertex.value = null
      selectedEdge.value = clickedNode.data()
    })
  }
  nextTick(() => {
    cy.resize()
    relayout()
  })
}

async function loadGraph() {
  const curQaRecordUuid = props.qaRecordUuid
  if (kbStore.isLoadingGraphRef(curQaRecordUuid))
    return

  kbStore.setLoadingGraphRef(curQaRecordUuid, true)
  try {
    const resp = await api.knowledgeBaseGraphRef<KnowledgeBase.KbItemGraphResp>(curQaRecordUuid)
    if (resp.data)
      kbStore.setQaRecordGraphRef(curQaRecordUuid, { ...resp.data })
  } finally {
    kbStore.setLoadingGraphRef(curQaRecordUuid, false)

    // 加载结束后判断是否还停留在加载时的页面，是的话则渲染图形
    if (curQaRecordUuid === props.qaRecordUuid) {
      const loadedRef = kbStore.getGraphRef(curQaRecordUuid)
      if (loadedRef)
        parseAndRender(loadedRef)
    }

    loading.value = kbStore.isLoadingGraphRef(props.qaRecordUuid)
  }
}

function initCy() {
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [],
    style: [
      {
        selector: 'node',
        style: {
          content: 'data(name)',
          width: 30,
          height: 30,
        },
      },
    ],
  })
}

function relayout() {
  const layout = cy.layout({
    name: 'cose',
  })
  layout.run()
  if (cy.elements().length === 0)
    isEmpty.value = true
}

watch(
  () => props.qaRecordUuid,
  (newVal, oldVal) => {
    console.log(`newVal:${props.qaRecordUuid},oldVal:${oldVal}`)
    if (newVal !== oldVal)
      getAndRenderGraph()
  },
  { immediate: true },
)

onActivated(() => {
  loading.value = kbStore.isLoadingGraphRef(props.qaRecordUuid)
  isEmpty.value = false
})

onMounted(() => {
  if (!cy) {
    nextTick(() => {
      console.log('onMounted nextTick')
      // initCy()
    })
  }
})
</script>

<template>
  <NFlex>
    <div id="cy" style="width:80%; height: 400px;" class="border border-gray-300" />
    <div class="w-1/6 h-[400px] overflow-y-auto">
      <NButton v-show="!isEmpty" size="small" :loading="loading" type="info" ghost @click="relayout">
        重新布局
      </NButton>
      <NButton v-show="isEmpty" size="small" type="warning" ghost>
        无数据
      </NButton>
      <NFlex v-if="selectedVertex" vertical>
        <NDivider title-placement="left">
          实体
        </NDivider>
        <div>{{ selectedVertex.id }}</div>
        <NDivider title-placement="left">
          名称
        </NDivider>
        <div>{{ selectedVertex.name }}</div>
        <NDivider title-placement="left">
          描述
        </NDivider>
        <div>{{ selectedVertex.description }}</div>
      </NFlex>
      <NFlex v-if="selectedEdge" vertical>
        <NDivider title-placement="left">
          关系
        </NDivider>
        <div>{{ selectedEdge.id }}</div>
        <NDivider title-placement="left">
          描述
        </NDivider>
        <div>{{ selectedEdge.description }}</div>
      </NFlex>
    </div>
  </NFlex>
</template>
