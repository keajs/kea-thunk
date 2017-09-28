![NPM Version](https://img.shields.io/npm/v/kea.svg)

![Kea Logo](https://kea.rocks/img/logo.png)

Thunk side effects for Kea 0.25+

# Usage

```sh
yarn add kea-thunk
```

```js
// just importing activates saga support in kea({})
// ... but you still need to connect it to the store.
import 'kea-thunk'
```

```js
// to setup your store, do this:
import { keaReducer } from 'kea'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'

import thunk from 'redux-thunk'

export default function getStore () {
  const reducers = combineReducers({
    scenes: keaReducer('scenes')
  })

  const finalCreateStore = compose(
    applyMiddleware(thunk)
  )(createStore)

  const store = finalCreateStore(reducers)

  return { store }
}
```
