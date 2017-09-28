import { resetKeaCache, keaReducer } from 'kea'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

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


export default function getStore () {
  resetKeaCache()

  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const finalCreateStore = compose(
    applyMiddleware(thunk)
  )(createStore)

  const store = finalCreateStore(reducers)

  return { store }
}
