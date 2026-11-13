declare module '@3d-dice/dice-box' {
  type DiceBoxConfig = {
    container?: string
    origin?: string
    assetPath: string
    theme?: string
    themeColor?: string
    scale?: number
    gravity?: number
    throwForce?: number
    spinForce?: number
    startingHeight?: number
    settleTimeout?: number
    offscreen?: boolean
    enableShadows?: boolean
    onRollComplete?: ((results: unknown) => void) | null
  }

  export default class DiceBox {
    constructor(config: DiceBoxConfig)
    init(): Promise<this>
    roll(notation: string | string[] | object | object[]): Promise<unknown[]>
    clear(): this
  }
}
