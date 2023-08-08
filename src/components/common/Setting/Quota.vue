<script setup lang="ts">
import { NCard, NCol, NRow, NSpace, NStatistic } from 'naive-ui'

interface Props {
  userConfig: User.Config
}

const props = defineProps<Props>()
</script>

<template>
  <NSpace vertical>
    <NCard title="文本聊天">
      <NRow>
        <NCol :span="8">
          <NStatistic
            label="今日请求数"
            :value="props.userConfig?.todayRequestTimes ?? '-'"
          >
            <template #suffix>
              / {{ props.userConfig?.quotaByRequestDaily ?? "-" }}
            </template>
          </NStatistic>
        </NCol>
        <NCol :span="12">
          <NStatistic
            label="今日消耗token数"
            :value="props.userConfig?.todayTokenCost ?? '-'"
          >
            <template #suffix>
              / {{ props.userConfig?.quotaByTokenDaily ?? "-" }}
            </template>
          </NStatistic>
        </NCol>
      </NRow>
      <NRow>
        <NCol :span="8">
          <NStatistic
            label="当月请求数"
            :value="props.userConfig?.currMonthRequestTimes ?? '-'"
          >
            <template #suffix>
              / {{ props.userConfig?.quotaByRequestMonthly ?? "-" }}
            </template>
          </NStatistic>
        </NCol>
        <NCol :span="12">
          <NStatistic
            label="当月消耗token数"
            :value="props.userConfig?.currMonthTokenCost ?? '-'"
          >
            <template #suffix>
              / {{ props.userConfig?.quotaByTokenMonthly ?? "-" }}
            </template>
          </NStatistic>
        </NCol>
      </NRow>
    </NCard>

    <NCard title="图片生成">
      <NRow>
        <NCol :span="8">
          <NStatistic
            label="今日生成图片"
            :value="props.userConfig?.todayGeneratedImageNumber ?? '-'"
          >
            <template #suffix>
              / {{ props.userConfig?.quotaByImageDaily ?? "-" }}
            </template>
          </NStatistic>
        </NCol>
      </NRow>
      <NRow>
        <NCol :span="8">
          <NStatistic
            label="当月生成图片"
            :value="props.userConfig?.currMonthGeneratedImageNumber ?? '-'"
          >
            <template #suffix>
              / {{ props.userConfig?.quotaByImageMonthly ?? "-" }}
            </template>
          </NStatistic>
        </NCol>
      </NRow>
    </NCard>
  </NSpace>
</template>
