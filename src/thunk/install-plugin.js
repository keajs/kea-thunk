import { activatePlugin } from 'kea'

// import thunk from 'redux-thunk'
function createThunkMiddleware (extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument)
    }

    return next(action)
  }
}

const thunk = createThunkMiddleware()
thunk.withExtraArgument = createThunkMiddleware

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
