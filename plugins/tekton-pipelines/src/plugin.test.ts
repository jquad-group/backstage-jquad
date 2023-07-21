import { tektonPipelinesPluginPlugin } from './plugin';

describe('tekton-pipelines-plugin', () => {
  it('should export plugin', () => {
    expect(tektonPipelinesPluginPlugin).toBeDefined();
  });
});
