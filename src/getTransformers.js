export const getTransformers = (configuration, transformers) => ({
    ...transformers,
    ...configuration.transformers,
});
