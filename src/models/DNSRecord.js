const mongoose = require('mongoose');

const dnsRecordSchema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['A', 'CNAME'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  ttl: {
    type: Number,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DNSRecord = mongoose.model('DNSRecord', dnsRecordSchema);

module.exports = DNSRecord;
