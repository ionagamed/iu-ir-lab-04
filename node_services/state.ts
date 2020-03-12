export enum Mode {
  WAIT = "wait",
  LOADING_PRIMARY_INDEX = "loading_primary_index",
  OPERATIONAL = "operational"
}

export const state = {
  mode: Mode.WAIT
}
