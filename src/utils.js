
export const createTypes = name => ({
  REQUEST: `${name}:REQUEST`,
  SUCCESS: `${name}:SUCCESS`,
  FAILURE: `${name}:FAILURE`,
  ERRORS:  `${name}:ERRORS`
});

export const createActions = types => ({
  request: (data) => ({
    type: types.REQUEST,
    payload: data
  }),
  success: (data) => ({
    type: types.SUCCESS,
    payload: data
  }),
  errors: (data) => ({
    type: types.ERRORS,
    payload: data
  }),
  failure: (error) => ({
    type: types.FAILURE,
    payload: error
  })
});

export const stateReducerCreate = (state = [], payload) => {
  const index = state.findIndex(item => item.id === payload.id);
  if (index !== -1) {
    return state;
  }
  return [...state, payload];
};

export const stateReducerUpdate = (state = [], payload) => {
  const items = [...state];
  const index = items.findIndex(item => item.id === payload.id);
  if (index === -1) {
    return state;
  }
  items.splice(index, 1);
  items.splice(index, 0, payload);
  return items;
};

export const stateReducerRemove = (state = [], payload) => {
  const items = [...state];
  const index = items.findIndex(item => item.id === payload);
  if (index === -1) {
    return state;
  }
  items.splice(index, 1);
  return items;
};
