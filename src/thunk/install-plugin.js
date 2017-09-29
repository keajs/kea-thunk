import { activatePlugin } from 'kea'
import thunk from 'redux-thunk'

activatePlugin({
  name: 'thunk',

  beforeReduxStore: (options) => {
    options.middleware.push(thunk)
  },

  isActive: (input) => {
    return !!input.thunks
  },

  afterCreateActions: (active, input, output) => {
    if (active) {
      let realThunks
      const thunkKeys = Object.keys(input.thunks(output))
      const thunkFunctions = {}

      thunkKeys.forEach(thunkKey => {
        thunkFunctions[thunkKey] = (...args) => {
          return (dispatch, getState) => {
            if (!realThunks) {
              let actions = {}
              Object.keys(output.actions).forEach(actionKey => {
                actions[actionKey] = (...actionArgs) => dispatch(output.actions[actionKey](...actionArgs))
                actions[actionKey].toString = output.actions[actionKey].toString
              })
              realThunks = input.thunks({ ...output, actions, dispatch, getState })
            }
            return realThunks[thunkKey](...args)
          }
        }
      })
      output.actions = Object.assign({}, output.actions, thunkFunctions)
    }
  }
})
