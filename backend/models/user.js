import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false },
    passwordHash: { type: String, required: true },
    company: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['Admin', 'Manager', 'Sales Agent'], default: 'Manager' },
  },
  { timestamps: true },
)

export const User = mongoose.models.User || mongoose.model('User', userSchema)
