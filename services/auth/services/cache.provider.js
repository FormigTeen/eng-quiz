"use strict";

/**
 * Cache Provider Interface
 * Define a contract for cache implementations
 */
class CacheProvider {
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null if not found
   */
  async get(key) {
    throw new Error("get must be implemented by subclass");
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (optional)
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds) {
    throw new Error("set must be implemented by subclass");
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async del(key) {
    throw new Error("del must be implemented by subclass");
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if key exists
   */
  async exists(key) {
    throw new Error("exists must be implemented by subclass");
  }

  /**
   * Get the TTL (time to live) of a key in seconds
   * @param {string} key - Cache key
   * @returns {Promise<number>} - TTL in seconds, -1 if key doesn't exist, -2 if key exists but has no expiration
   */
  async ttl(key) {
    throw new Error("ttl must be implemented by subclass");
  }
}

module.exports = CacheProvider;

