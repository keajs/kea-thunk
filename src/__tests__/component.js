/* global test, expect, beforeEach */
import { kea, resetContext, getStore, activatePlugin, getContext } from 'kea'
import thunkPlugin from '../index' // install the plugin

import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetContext()
  activatePlugin(thunkPlugin)
})

test('thunks are bound as actions', () => {
  const store = getStore()

  let thunkRan = false

  const thunkLogic = kea({
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
  expect(thunkLogic._isKea).toBe(true)
  expect(thunkLogic._isKeaWithKey).toBe(false)

  expect(thunkRan).toBe(false)

  const SampleComponent = ({ name, actions: { updateName, updateNameAsync } }) => (
    <div>
      <div className='name'>{name}</div>
      <div className='updateName' onClick={() => updateName('george')}>updateName</div>
      <div className='updateNameAsync' onClick={() => updateNameAsync('michael')}>updateNameAsync</div>
    </div>
  )
  const ConnectedComponent = thunkLogic(SampleComponent)

  const wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent id={12} />
    </Provider>
  )

  expect(Object.keys(thunkLogic.actions)).toEqual(['updateName', 'updateNameAsync'])
  expect(Object.keys(thunkLogic.selectors).sort()).toEqual(['name'])

  expect(thunkRan).toBe(false)

  expect(wrapper.find('.name').text()).toEqual('chirpy')
  wrapper.find('.updateName').props().onClick()

  expect(wrapper.find('.name').text()).toEqual('george')
  wrapper.find('.updateNameAsync').props().onClick()

  expect(wrapper.find('.name').text()).toEqual('michael')

  wrapper.unmount()
})
