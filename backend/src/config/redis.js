const redis = require('redis');

let client = null;

// Redis setup function
const initRedis = async () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  client = redis.createClient({
    url: url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error('Redis reconnection failed');
        return Math.min(retries * 50, 500); // Reconnect after small delay
      }
    }
  });

  client.on('error', (err) => console.error('Redis Client Error:', err.message));
  client.on('connect', () => console.log('Redis Connecting...'));
  client.on('ready', () => console.log('Redis Connected and Ready to use'));

  try {
    await client.connect();
  } catch (err) {
    console.warn('Redis connection failed, working without cache:', err.message);
    client = null;
  }
};

// Start connection
initRedis();

// No-op for when Redis is down
const noopMulti = () => ({
  del() { return this; },
  exec: async () => [],
});

const redisClient = {
  // Check if client exists and is ready
  get isReady() {
    return client && client.isReady;
  },

  async get(key) {
    if (!this.isReady) return null;
    try {
      return await client.get(key);
    } catch {
      return null;
    }
  },

  async setEx(key, ttl, value) {
    if (!this.isReady) return;
    try {
      await client.setEx(key, ttl, value);
    } catch (err) {
      console.error('Redis setEx error:', err.message);
    }
  },

  async del(key) {
    if (!this.isReady) return;
    try {
      await client.del(key);
    } catch (err) {
      console.error('Redis del error:', err.message);
    }
  },

  multi() {
    if (!this.isReady) return noopMulti();
    return client.multi();
  },
};

module.exports = redisClient;