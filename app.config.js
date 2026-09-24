import dotenv from 'dotenv';

const isProd = process.env.APP_ENV === 'production';
dotenv.config({ path: isProd ? '.env.production' : '.env.development' });

export default {
  expo: {
    name: "Meezan",
    extra: {
      apiUrl: process.env.API_URL,
    },
  },
};