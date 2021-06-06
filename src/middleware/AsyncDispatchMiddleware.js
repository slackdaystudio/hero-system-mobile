// https://stackoverflow.com/a/41260990/1170235
export const asyncDispatchMiddleware = (store) => (next) => (action) => {
    let syncActivityFinished = false;
    let actionQueue = [];

    function flushQueue() {
        actionQueue.forEach((a) => store.dispatch(a)); // flush queue
        actionQueue = [];
    }

    function asyncDispatch(asyncAction) {
        actionQueue = actionQueue.concat([asyncAction]);

        if (syncActivityFinished) {
            flushQueue();
        }
    }

    const actionWithAsyncDispatch = Object.assign({}, action, {asyncDispatch});
    const res = next(actionWithAsyncDispatch);

    syncActivityFinished = true;

    flushQueue();

    return res;
};
