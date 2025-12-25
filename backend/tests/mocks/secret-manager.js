class SecretManagerServiceClient {
  async accessSecretVersion() {
    return [{ payload: { data: Buffer.from('mock-secret') } }];
  }
}

module.exports = {
  SecretManagerServiceClient,
};
