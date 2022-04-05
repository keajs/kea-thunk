import thunk from 'redux-thunk'
import { BuiltLogic, getContext, KeaPlugin, Logic, LogicBuilder, LogicInput } from 'kea'
import { Dispatch, Store } from 'redux'

interface BuiltLogicWithThunks extends BuiltLogic {
  dispatch: Dispatch
  getState: Store['getState']
  get: (key?: string) => any
  fetch: (...keys: string[]) => any
}

type ThunkInput = Record<string, any>

export function thunks<L extends Logic = Logic>(input: (logic: BuiltLogicWithThunks) => ThunkInput): LogicBuilder<L> {
  return (logic) => {
    const get = (key?: string) => (key ? logic.values[key] : logic.selector?.(getContext().store.getState()))
    const fetch = function (...keys: string[]): any {
      const results: Record<string, any> = {}
      for (const key of keys) {
        results[key] = logic.values[key]
      }
      return results
    }

    const fakeLogic: BuiltLogicWithThunks = {
      ...logic,
      dispatch: getContext().store.dispatch,
      getState: getContext().store.getState,
      get,
      fetch,
    }

    const thunks = input(fakeLogic)

    for (const [key, thunk] of Object.entries(thunks)) {
      logic.actions[key] = (...args: any[]) => thunk(...args)
      logic.actionCreators[key] = (...args: any[]) => () => thunk(...args)
    }
  }
}

export default (): KeaPlugin => ({
  name: 'thunk',

  events: {
    beforeReduxStore(options) {
      options.middleware.push(thunk)
    },
    legacyBuild(logic, input) {
      'thunks' in input && input.thunks && thunks(input.thunks)(logic)
    },
  },
})
