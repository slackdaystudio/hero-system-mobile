// Stub for the pure-node "core" Jest project: legacy modules loaded by the
// golden-master oracle import react-native for Dimensions/Platform only.
module.exports = {
    Dimensions: {get: () => ({width: 0, height: 0})},
    Platform: {OS: 'ios', select: (spec) => (spec ? spec.ios : undefined)},
};
