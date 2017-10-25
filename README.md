![NPM Version](https://img.shields.io/npm/v/kea-thunk.svg)

Redux-Thunk side effects for Kea

* kea-thunk 0.3 works with kea 0.27+
* kea-thunk 0.2 works with kea 0.26
* kea-thunk 0.1 works with kea 0.25

[Read the documentation for Kea](https://kea.js.org/)

# Usage

Install via yarn or npm

```sh
yarn add kea-thunk redux-thunk
npm install --save kea-thunk redux-thunk
```

Then install in one of the following ways. Make sure to run this before any call to `kea({})` takes place.

```js
// the cleanest way
import thunkPlugin from 'kea-thunk'
import { getStore } from 'kea'

const store = getStore({
  plugins: [ thunkPlugin ]
})

// another way
import thunkPlugin from 'kea-thunk'
import { activatePlugin } from 'kea'

activatePlugin(thunkPlugin)

// the shortest way
import 'kea-thunk/install'
```

And just use the `thunks` key in your Kea logic stores like so:

```js
const delay = (ms) => new Promise(resolve => window.setTimeout(resolve, ms))

const logic = kea({
  actions: ({ constants }) => ({
    updateName: name => ({ name })
  }),
  thunks: ({ actions, dispatch, getState, get, fetch }) => ({
    updateNameAsync: async name => {
      await delay(1000)            // standard promise
      await actions.anotherThunk() // another thunk action
      actions.updateName(name)     // not a thunk, so no async needed
      dispatch({ type: 'RANDOM_REDUX_ACTION' }) // random redux action

      get('name') // 'chirpy'
      fetch('name', 'otherKey') // { name: 'chirpy', otherKey: undefined }
    },
    anotherThunk: async () => {
      // do something
    }
  }),
  reducers: ({ actions, constants }) => ({
    name: ['chirpy', PropTypes.string, {
      [actions.updateName]: (state, payload) => payload.name
    }]
  })
})
```

NB! As of `v0.2.0`, kea-thunk only supports singleton logic stores, so where there is no `key` defined. This will be fixed soon! :)

# Store setup

If you're using the `getStore()` helper from Kea, thunk functionality is automatically added to the store if you give it the thunk plugin.

However if you wish to manually set up your store, here are the steps:

```js
import { keaReducer, activatePlugin } from 'kea'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

import thunkPlugin from 'kea-thunk'
import thunk from 'redux-thunk'

export default function getStore () {
  activatePlugin(thunkPlugin)

  const reducers = combineReducers({
    kea: keaReducer('kea'),
    scenes: keaReducer('scenes')
  })

  const finalCreateStore = compose(
    applyMiddleware(thunk)
  )(createStore)

  const store = finalCreateStore(reducers)

  return { store }
}
```
