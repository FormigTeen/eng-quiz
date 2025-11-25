"use strict";

const IORedis = require("ioredis");

/**
 * Cache Provider Interface
 * Define a contract for cache implementations
 */
class CacheProvider {
  async get(key) {
    throw new Error("get must be implemented by subclass");
  }

  async set(key, value, ttlSeconds) {
    throw new Error("set must be implemented by subclass");
  }

  async del(key) {
    throw new Error("del must be implemented by subclass");
  }

  async exists(key) {
    throw new Error("exists must be implemented by subclass");
  }

  async ttl(key) {
    throw new Error("ttl must be implemented by subclass");
  }
}

/**
 * Redis implementation of CacheProvider for Engine service
 * Uses IORedis library to interact with Redis cache
 */
class RedisProvider extends CacheProvider {
  constructor(config) {
    super();
    this.config = config;
    this.client = null;
  }

  /**
   * Initialize the Redis client
   */
  _getClient() {
    if (!this.client) {
      const { url, host, port } = this.config;
      
      if (url) {
        this.client = new IORedis(url);
      } else if (host) {
        this.client = new IORedis({ host, port: port || 6379 });
      } else {
        throw new Error("Redis configuration not provided (url or host required)");
      }
    }
    return this.client;
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null if not found
   */
  async get(key) {
    try {
      const client = this._getClient();
      const value = await client.get(key);
      return value;
    } catch (error) {
      throw new Error(`Redis get failed: ${error.message}`);
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (optional)
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds) {
    try {
      const client = this._getClient();
      if (ttlSeconds) {
        await client.set(key, value, "EX", ttlSeconds);
      } else {
        await client.set(key, value);
      }
    } catch (error) {
      throw new Error(`Redis set failed: ${error.message}`);
    }
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async del(key) {
    try {
      const client = this._getClient();
      await client.del(key);
    } catch (error) {
      throw new Error(`Redis del failed: ${error.message}`);
    }
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if key exists
   */
  async exists(key) {
    try {
      const client = this._getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      throw new Error(`Redis exists failed: ${error.message}`);
    }
  }

  /**
   * Get the TTL (time to live) of a key in seconds
   * @param {string} key - Cache key
   * @returns {Promise<number>} - TTL in seconds, -1 if key doesn't exist, -2 if key exists but has no expiration
   */
  async ttl(key) {
    try {
      const client = this._getClient();
      return await client.ttl(key);
    } catch (error) {
      throw new Error(`Redis ttl failed: ${error.message}`);
    }
  }

  /**
   * Check if Redis client is available
   * @returns {boolean}
   */
  isAvailable() {
    try {
      return this.client !== null && this._getClient() !== null;
    } catch (error) {
      return false;
    }
  }
}

module.exports = RedisProvider;

