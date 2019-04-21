import thunk from 'redux-thunk'

function createRealThunks (input, output, dispatch, getState) {
  let actions = {}

  Object.keys(output.actions).forEach(actionKey => {
    actions[actionKey] = (...actionArgs) => dispatch(output.actions[actionKey](...actionArgs))
    actions[actionKey].toString = output.actions[actionKey].toString
  })

  const get = (key) => key ? output.selectors[key](getState()) : output.selector(getState())
  const fetch = function () {
    let results = {}

    const keys = Array.isArray(arguments[0]) ? arguments[0] : arguments

    for (let i = 0; i < keys.length; i++) {
      results[keys[i]] = get(keys[i])
    }

    return results
  }

  return input.thunks(Object.assign({}, output, { actions, dispatch, getState, get, fetch }))
}

export default {
  name: 'thunk',

  beforeReduxStore: (options) => {
    options.middleware.push(thunk)
  },

  afterCreate: (input, output) => {
    if (!input.thunks) {
      return
    }

    let realThunks
    const thunkKeys = Object.keys(input.thunks(output))
    const thunkFunctions = {}

    thunkKeys.forEach(thunkKey => {
      thunkFunctions[thunkKey] = (...args) => {
        return (dispatch, getState) => {
          if (!realThunks) {
            realThunks = createRealThunks(input, output, dispatch, getState)
          }
          return realThunks[thunkKey](...args)
        }
      }
    })

    output.actions = Object.assign({}, output.actions, thunkFunctions)
  }
}
