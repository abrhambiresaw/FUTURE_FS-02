import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    status: { type: String, default: 'Lead' },
    lastContact: { type: String, default: '' },
  },
  { timestamps: true },
)

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    contact: { type: String, default: '' },
    value: { type: String, default: '' },
    source: { type: String, default: '' },
    assigned: { type: String, default: '' },
    stage: { type: String, default: 'New' },
  },
  { timestamps: true },
)

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    customer: { type: String, required: true, trim: true },
    value: { type: String, default: '' },
    closeDate: { type: String, default: '' },
    stage: { type: String, default: 'Prospecting' },
  },
  { timestamps: true },
)

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    due: { type: String, default: '' },
    priority: { type: String, default: 'Low' },
    assigned: { type: String, default: '' },
    status: { type: String, default: 'Open' },
  },
  { timestamps: true },
)

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema)
export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema)
export const Deal = mongoose.models.Deal || mongoose.model('Deal', dealSchema)
export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema)