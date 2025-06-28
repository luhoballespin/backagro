const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['cereal', 'semilla', 'fertilizante', 'insumo', 'otro'],
  },
  description: String,
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'ton', 'unidad', 'litro'],
  },
  price: {
    current: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['ARS', 'USD'],
      default: 'ARS',
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  minStock: {
    type: Number,
    min: 0,
    default: 0,
  },
  location: {
    warehouse: String,
    shelf: String,
  },
  active: {
    type: Boolean,
    default: true,
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índices para búsquedas frecuentes
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ sku: 1 });

module.exports = mongoose.model('Product', productSchema); 