import * as SecureStore from 'expo-secure-store';

export const authStorage = {
  async saveTokens(accessToken: string, refreshToken: string) {
    console.log("ACCESS : " , accessToken)
    console.log("REFRESH : " , refreshToken)
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
  },

  async getTokens() {
    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    return { accessToken, refreshToken };
  },

  async clearTokens() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }
};