/* global test, expect, beforeEach */
import { kea, resetKeaCache } from 'kea'

import PropTypes from 'prop-types'

import '../thunk/install-plugin'
import getStore from './helper/get-store'

beforeEach(() => {
  resetKeaCache()
})

test('thunks work', () => {
  const { store } = getStore()

  let thunkRan = false

  const firstLogic = kea({
    path: () => ['scenes', 'homepage', 'first'],
    actions: ({ constants }) => ({
      updateName: name => ({ name })
    }),
    thunks: ({ actions, dispatch, getState }) => ({
      updateNameAsync: name => {
        thunkRan = true
        dispatch(actions.updateName(name))
      }
    }),
    reducers: ({ actions, constants }) => ({
      name: ['chirpy', PropTypes.string, {
        [actions.updateName]: (state, payload) => payload.name
      }]
    })
  })

  expect(firstLogic._keaPlugins.thunk).toBe(true)
  expect(firstLogic._isKeaFunction).toBe(true)
  expect(firstLogic._isKeaSingleton).toBe(true)
  expect(Object.keys(firstLogic.actions)).toEqual(['updateName', 'updateNameAsync'])
  expect(Object.keys(firstLogic.selectors).sort()).toEqual(['name', 'root'])

  store.dispatch(firstLogic.actions.updateNameAsync('derpy'))
  expect(firstLogic.selectors.name(store.getState())).toBe('derpy')

  expect(thunkRan).toBe(true)
})
