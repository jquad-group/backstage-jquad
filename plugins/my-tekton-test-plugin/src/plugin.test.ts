import { myTektonTestPluginPlugin } from './plugin';

describe('my-tekton-test-plugin', () => {
  it('should export plugin', () => {
    expect(myTektonTestPluginPlugin).toBeDefined();
  });
});
