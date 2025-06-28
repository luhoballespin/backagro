const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['individual', 'company'],
    required: true,
  },
  documentType: {
    type: String,
    enum: ['dni', 'cuit', 'cuil'],
    required: true,
  },
  documentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Argentina',
    },
  },
  businessInfo: {
    businessName: String,
    taxCategory: String,
    taxStatus: String,
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentTerms: {
    type: Number,
    default: 30,
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para actualizar updatedAt
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas frecuentes
clientSchema.index({ name: 1 });
clientSchema.index({ documentNumber: 1 });
clientSchema.index({ email: 1 });

module.exports = mongoose.model('Client', clientSchema); 