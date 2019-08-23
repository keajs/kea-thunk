/* global test, expect, beforeEach */
import { kea, resetContext, getStore, activatePlugin, getContext } from 'kea'

import PropTypes from 'prop-types'

import thunkPlugin from '../index'

beforeEach(() => {
  resetContext({ autoMount: true })
  activatePlugin(thunkPlugin)
})

test('thunks work', () => {
  const store = getStore()

  let thunkRan = false

  const firstLogic = kea({
    path: () => ['scenes', 'thunks', 'first'],
    actions: ({ constants }) => ({
      updateName: name => ({ name })
    }),
    thunks: ({ actions, dispatch, getState }) => ({
      updateNameAsync: name => {
        thunkRan = true
        actions.updateName(name)
      }
    }),
    reducers: ({ actions, constants }) => ({
      name: ['chirpy', PropTypes.string, {
        [actions.updateName]: (state, payload) => payload.name
      }]
    })
  })

  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'thunk'])
  expect(firstLogic._isKea).toBe(true)
  expect(firstLogic._isKeaWithKey).toBe(false)
  expect(Object.keys(firstLogic.actions)).toEqual(['updateName', 'updateNameAsync'])
  expect(Object.keys(firstLogic.selectors).sort()).toEqual(['name'])

  firstLogic.actions.updateNameAsync('derpy')
  expect(firstLogic.selectors.name(store.getState())).toBe('derpy')

  expect(thunkRan).toBe(true)
})

test('thunks can call thunks', () => {
  const store = getStore()

  let firstThunkRan = false
  let secondThunkRan = false

  const firstLogic = kea({
    path: () => ['scenes', 'thunks', 'first'],
    actions: ({ constants }) => ({
      updateName: name => ({ name })
    }),
    thunks: ({ actions, dispatch, getState }) => ({
      updateNameAsync: name => {
        firstThunkRan = true
        actions.updateName(name)
      },
      updateNameReallyAsync: name => {
        secondThunkRan = true
        actions.updateNameAsync(name)
      }
    }),
    reducers: ({ actions, constants }) => ({
      name: ['chirpy', PropTypes.string, {
        [actions.updateName]: (state, payload) => payload.name
      }]
    })
  })

  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'thunk'])
  expect(Object.keys(firstLogic.actions)).toEqual(['updateName', 'updateNameAsync', 'updateNameReallyAsync'])
  expect(Object.keys(firstLogic.selectors).sort()).toEqual(['name'])

  store.dispatch(firstLogic.actionCreators.updateNameReallyAsync('derpy'))
  expect(firstLogic.selectors.name(store.getState())).toBe('derpy')

  expect(firstThunkRan).toBe(true)
  expect(secondThunkRan).toBe(true)
})

test('connected thunks work', () => {
  const store = getStore()

  let thunkRan = false

  const firstLogic = kea({
    path: () => ['scenes', 'thunks', 'first'],
    actions: ({ constants }) => ({
      updateName: name => ({ name })
    }),
    thunks: ({ actions, dispatch, getState }) => ({
      updateNameAsync: name => {
        thunkRan = true
        actions.updateName(name)
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

  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'thunk'])
  expect(Object.keys(secondLogic.actions)).toEqual(['updateNameAsync'])
  expect(Object.keys(secondLogic.selectors).sort()).toEqual(['name'])

  secondLogic.actions.updateNameAsync('derpy')
  expect(secondLogic.selectors.name(store.getState())).toBe('derpy')

  expect(thunkRan).toBe(true)
})

test('async works', () => {
  const store = getStore()

  let actionsRan = []

  const instantPromise = () => new Promise(resolve => {
    actionsRan.push('in promise')
    resolve()
  })

  const asyncLogic = kea({
    path: () => ['scenes', 'thunks', 'async'],
    actions: ({ constants }) => ({
      updateName: name => ({ name })
    }),
    thunks: ({ actions, selectors, get, fetch, dispatch, getState }) => ({
      updateNameAsync: async name => {
        actionsRan.push('before promise')
        await instantPromise()
        actionsRan.push('after promise')

        await actions.anotherThunk()
        actions.updateName(name)

        expect(selectors.name(getState())).toEqual('derpy')
        expect(get('name')).toEqual('derpy')
        expect(fetch('name')).toEqual({ name: 'derpy' })
      },
      anotherThunk: async () => {
        actionsRan.push('another thunk ran')
      }
    }),
    reducers: ({ actions, constants }) => ({
      name: ['chirpy', PropTypes.string, {
        [actions.updateName]: (state, payload) => payload.name
      }]
    })
  })
  actionsRan.push('before action')

  return store.dispatch(asyncLogic.actionCreators.updateNameAsync('derpy')).then(() => {
    actionsRan.push('after dispatch')
    expect(asyncLogic.selectors.name(store.getState())).toBe('derpy')
    actionsRan.push('after action')

    expect(actionsRan).toEqual([
      'before action',
      'before promise',
      'in promise',
      'after promise',
      'another thunk ran',
      'after dispatch',
      'after action'
    ])
  })
})
