import React from 'react';
import { AsyncStorage } from 'react-native'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { persistStore, autoRehydrate } from 'redux-persist'

import * as reducers from '../reducers'

const store = createStore(
  combineReducers(reducers),
  compose(
    applyMiddleware(
      store => next => action => {
        next(action);
      },
      thunkMiddleware
    ),
    autoRehydrate(),
    window.devToolsExtension
      ? window.devToolsExtension()
      : f => f
  )
)

persistStore(store, {storage: AsyncStorage, whitelist: []})

export default () => store
