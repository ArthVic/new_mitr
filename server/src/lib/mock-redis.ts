// Mock Redis for localhost development
console.log('📋 Using mock Redis for localhost development');

export const redis = {
  async get(key: string) {
    console.log(`📊 Mock Redis GET: ${key}`);
    return null;
  },

  async set(key: string, value: string, expire?: number) {
    console.log(`📊 Mock Redis SET: ${key} (expires: ${expire}s)`);
    return 'OK';
  },

  async del(key: string) {
    console.log(`📊 Mock Redis DEL: ${key}`);
    return 1;
  },

  async exists(key: string) {
    console.log(`📊 Mock Redis EXISTS: ${key}`);
    return 0;
  },

  async hget(key: string, field: string) {
    console.log(`📊 Mock Redis HGET: ${key}.${field}`);
    return null;
  },

  async hset(key: string, field: string, value: string) {
    console.log(`📊 Mock Redis HSET: ${key}.${field}`);
    return 1;
  }
};
