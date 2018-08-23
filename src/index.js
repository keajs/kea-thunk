import thunk from 'redux-thunk'

function createRealThunks (input, output, dispatch, getState, getProps = () => {}) {
  let actions = {}

  Object.keys(output.actions).forEach(actionKey => {
    actions[actionKey] = (...actionArgs) => dispatch(output.actions[actionKey](...actionArgs))
    actions[actionKey].toString = output.actions[actionKey].toString
  })

  const get = (key) => key ? output.selectors[key](getState(), getProps()) : output.selector(getState(), getProps())
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

const injectToClass = (Klass, input, output) => {
  if (Klass.prototype._injectedKeaThunk) {
    console.error(`[KEA] Error! Already injected kea thunk into component "${(Klass && Klass.name) || Klass}"`)
  }
  Klass.prototype._injectedKeaThunk = true

  const originalComponentWillMount = Klass.prototype.componentWillMount
  Klass.prototype.componentWillMount = function () {
    // this === component instance
    let realThunks
    const thunkKeys = Object.keys(input.thunks(output))
    const thunkFunctions = {}

    thunkKeys.forEach(thunkKey => {
      thunkFunctions[thunkKey] = (...args) => {
        return (dispatch, getState) => {
          if (!realThunks) {
            realThunks = createRealThunks(input, output, dispatch, getState, () => this.props)
          }
          return realThunks[thunkKey](...args)
        }
      }
    })
    output.created.actions = Object.assign({}, output.created.actions, thunkFunctions)
    output.actions = Object.assign({}, output.actions, thunkFunctions)

    originalComponentWillMount && originalComponentWillMount.bind(this)()
  }
}

export default {
  name: 'thunk',

  // plugin must be used globally
  global: true,
  local: false,

  beforeReduxStore: (options) => {
    options.middleware.push(thunk)
  },

  isActive: (input) => {
    return !!input.thunks
  },

  afterCreateSingleton: (input, output) => {
    if (output.activePlugins.thunk) {
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

      output.created.actions = Object.assign({}, output.created.actions, thunkFunctions)
      output.actions = Object.assign({}, output.actions, thunkFunctions)
    }
  },

  injectToClass: (input, output, Klass) => {
    if (output.activePlugins.thunk) {
      injectToClass(Klass, input, output)
    }
  },

  injectToConnectedClass: (input, output, KonnektedKlass) => {
    if (output.activePlugins.thunk) {
      injectToClass(KonnektedKlass, input, output)
    }
  }
  // injectToConnectedClass
}
