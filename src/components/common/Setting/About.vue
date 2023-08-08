<script setup lang="ts">
interface Props {
  userConfig: User.Config
}

defineProps<Props>()
</script>

<template>
  <div class="p-4 space-y-4">
    <p>今天花费token数：{{ userConfig?.todayTokenCost ?? "-" }}</p>
    <p>今天请求数：{{ userConfig?.todayRequestTimes ?? "-" }}</p>
    <p>当月花费token数：{{ userConfig?.currMonthTokenCost ?? "-" }}</p>
    <p>当月请求数：{{ userConfig?.currMonthRequestTimes ?? "-" }}</p>
    <p>每日最大token数：{{ userConfig?.quotaByTokenDaily ?? "-" }}</p>
    <p>每月最大token数：{{ userConfig?.quotaByTokenMonthly ?? "-" }}</p>
    <p>每日最大请求数：{{ userConfig?.quotaByRequestDaily ?? "-" }}</p>
    <p>每月最大请求数：{{ userConfig?.quotaByRequestMonthly ?? "-" }}</p>
  </div>
</template>
