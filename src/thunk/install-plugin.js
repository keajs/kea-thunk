import { activatePlugin } from 'kea'

activatePlugin({
  name: 'thunk',

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
          const action = (dispatch, getState) => {
            if (!realThunks) {
              realThunks = input.thunks({ ...output, dispatch, getState })
            }
            realThunks[thunkKey](...args)
          }
          action._isThunk = true
          return action
        }
      })
      output.actions = Object.assign({}, output.actions, thunkFunctions)
    }
  }
})
