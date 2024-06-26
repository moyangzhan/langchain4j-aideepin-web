declare namespace User {
    interface Profile {
        avatar?: string
        name?: string
        description?: string
        uuid: string
      }

    interface Config{
        secretKey?: string
        contextEnable?: boolean
        contextMsgPairNum?: number
        quotaByTokenDaily?: number
        quotaByTokenMonthly?: number
        quotaByRequestDaily?: number
        quotaByRequestMonthly?: number
        quotaByImageDaily?: number
        quotaByImageMonthly?: number
        todayTokenCost?: number
        todayRequestTimes?: number
        todayGeneratedImageNumber?: number
        currMonthTokenCost?: number
        currMonthRequestTimes?: number
        currMonthGeneratedImageNumber?: number
    }
}
