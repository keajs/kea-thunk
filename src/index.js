import thunk from 'redux-thunk'

function createRealThunks (logic, input, dispatch, getState) {
  const get = (key) => key ? logic.selectors[key](getState()) : logic.selector(getState())
  const fetch = function () {
    let results = {}

    const keys = Array.isArray(arguments[0]) ? arguments[0] : arguments

    for (let i = 0; i < keys.length; i++) {
      results[keys[i]] = get(keys[i])
    }

    return results
  }

  return input.thunks(Object.assign({}, logic, { dispatch, getState, get, fetch }))
}

export default {
  name: 'thunk',

  events: {
    beforeReduxStore (options) {
      options.middleware.push(thunk)
    }
  },

  buildSteps: {
    actionCreators (logic, input) {
      if (!input.thunks) {
        return
      }

      let realThunks
      const thunkKeys = Object.keys(input.thunks(logic))
      const thunkFunctions = {}

      thunkKeys.forEach(thunkKey => {
        thunkFunctions[thunkKey] = (...args) => {
          return (dispatch, getState) => {
            if (!realThunks) {
              realThunks = createRealThunks(logic, input, dispatch, getState)
            }
            return realThunks[thunkKey](...args)
          }
        }
      })

      logic.actionCreators = Object.assign({}, logic.actionCreators, thunkFunctions)
    }
  }
}
