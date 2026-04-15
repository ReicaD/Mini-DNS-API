const DNSRecord = require('../models/DNSRecord');

/**
 * Fetch all DNS records associated with a specific hostname
 * @param {string} hostname
 * @returns {Promise<Array>} Array of DNSRecord documents
 */
const getRecordsByHostname = async (hostname) => {
  return await DNSRecord.find({ hostname });
};

/**
 * Fetch only 'A' records for a specific hostname
 */
const getARecords = async (hostname) => {
  return await DNSRecord.find({ hostname, type: 'A' });
};

/**
 * Fetch the 'CNAME' record for a specific hostname
 */
const getCNAMERecord = async (hostname) => {
  return await DNSRecord.findOne({ hostname, type: 'CNAME' });
};

/**
 * Check if a specific, exact DNS record already exists
 */
const recordExists = async (hostname, type, value) => {
  const record = await DNSRecord.findOne({ hostname, type, value });
  return record !== null;
};

/**
 * Recursively resolves a hostname following CNAME chains until A records are found.
 * Detects circular references and prevents infinite recursion.
 * 
 * @param {string} hostname - The hostname to resolve
 * @param {Set} [visited=new Set()] - Tracks visited hostnames to detect loops
 * @param {number} [maxDepth=10] - Maximum CNAME chain depth
 * @returns {Promise<Object>} Resolution result with IPs and chain info
 */
const resolveHostname = async (hostname, visited = new Set(), maxDepth = 10) => {
  // Circular reference detection
  if (visited.has(hostname)) {
    throw new Error(`Circular CNAME reference detected at ${hostname}`);
  }

  // Chain depth safety guard
  if (visited.size >= maxDepth) {
    throw new Error(`CNAME chain too long (exceeded ${maxDepth} levels)`);
  }

  visited.add(hostname);

  // Check for A records first (Priority resolution)
  const aRecords = await DNSRecord.find({ hostname, type: 'A' });
  if (aRecords.length > 0) {
    return {
      hostname,
      resolvedIps: aRecords.map(record => record.value),
      recordType: 'A',
      pointsTo: hostname
    };
  }

  // Check for CNAME record and recurse
  const cnameRecord = await DNSRecord.findOne({ hostname, type: 'CNAME' });
  if (cnameRecord) {
    const resolved = await resolveHostname(cnameRecord.value, visited, maxDepth);
    
    if (!resolved) {
      return {
        hostname,
        resolvedIps: [],
        recordType: 'CNAME',
        pointsTo: cnameRecord.value
      };
    }

    return {
      hostname,
      resolvedIps: resolved.resolvedIps,
      recordType: 'CNAME',
      pointsTo: resolved.pointsTo
    };
  }

  return null;
};

/**
 * Deletes a specific, exact DNS record
 */
const deleteRecord = async (hostname, type, value) => {
  return await DNSRecord.findOneAndDelete({ 
    hostname: hostname.toLowerCase(), 
    type, 
    value 
  });
};

/**
 * Starts the background TTL cleanup job to prune expired records.
 */
const startTTLJob = () => {
  setInterval(async () => {
    try {
      const records = await DNSRecord.find({ ttl: { $exists: true } });
      const now = Date.now();

      for (const record of records) {
        // Evaluate expiration time based on createdAt + TTL
        const expirationTime = record.createdAt.getTime() + record.ttl * 1000;
        if (now > expirationTime) {
          await DNSRecord.findByIdAndDelete(record._id);
          console.log(`[DNS LOG] Deleted expired record: ${record.hostname} (${record.type})`);
        }
      }
    } catch (error) {
      console.error('[DNS LOG] Error within TTL cleanup job:', error.message);
    }
  }, 30000); // Check every 30 seconds
};

module.exports = {
  getRecordsByHostname,
  getARecords,
  getCNAMERecord,
  recordExists,
  resolveHostname,
  deleteRecord,
  startTTLJob,
};
