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

test('thunks can call thunks', () => {
  const { store } = getStore()

  let firstThunkRan = false
  let secondThunkRan = false

  const firstLogic = kea({
    path: () => ['scenes', 'homepage', 'first'],
    actions: ({ constants }) => ({
      updateName: name => ({ name })
    }),
    thunks: ({ actions, dispatch, getState }) => ({
      updateNameAsync: name => {
        firstThunkRan = true
        dispatch(actions.updateName(name))
      },
      updateNameReallyAsync: name => {
        secondThunkRan = true
        dispatch(actions.updateNameAsync(name))
      }
    }),
    reducers: ({ actions, constants }) => ({
      name: ['chirpy', PropTypes.string, {
        [actions.updateName]: (state, payload) => payload.name
      }]
    })
  })

  expect(firstLogic._keaPlugins.thunk).toBe(true)
  expect(Object.keys(firstLogic.actions)).toEqual(['updateName', 'updateNameAsync', 'updateNameReallyAsync'])
  expect(Object.keys(firstLogic.selectors).sort()).toEqual(['name', 'root'])

  store.dispatch(firstLogic.actions.updateNameReallyAsync('derpy'))
  expect(firstLogic.selectors.name(store.getState())).toBe('derpy')

  expect(firstThunkRan).toBe(true)
  expect(secondThunkRan).toBe(true)
})

test('connected thunks work', () => {
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

  const secondLogic = kea({
    connect: {
      actions: [
        firstLogic, [
          'updateNameAsync'
        ]
      ],
      props: [
        firstLogic, [
          'name'
        ]
      ]
    }
  })

  expect(firstLogic._keaPlugins.thunk).toBe(true)
  expect(Object.keys(secondLogic.actions)).toEqual(['updateNameAsync'])
  expect(Object.keys(secondLogic.selectors).sort()).toEqual(['name'])

  store.dispatch(secondLogic.actions.updateNameAsync('derpy'))
  expect(secondLogic.selectors.name(store.getState())).toBe('derpy')

  expect(thunkRan).toBe(true)
})
