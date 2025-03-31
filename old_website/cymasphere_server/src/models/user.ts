import mongoose from "mongoose";

// Define the user schema
const userSchema = new mongoose.Schema({
  dateCreated: Date,
  username: { type: String, index: { unique: true, dropDups: true } },
  email: {
    type: String,
    index: { unique: true, dropDups: true },
    select: false,
  },
  emailVerified: { type: Boolean, select: false },
  password: { type: String, select: false },
  passwordReset: { type: Boolean, select: false },
  custId: { type: String, select: false },
  db: { type: String, select: false },
  dbSyncTime: { type: Date, select: false },
  dbSyncDevice: { type: String, select: false },
  loggedInDevices: { type: [String], select: false },
  // avatar: { data: Buffer, contentType: String },
  name: { type: String },
  description: { type: String },
  socials: String,
  newsletter: { type: Boolean, select: false },
  tutorials: { type: [Number], select: false },
  trialEndDate: { type: Date, select: false },
  proML: { type: Boolean, select: false },
  proLifetimeML: { type: Boolean, select: false },
});

// Add indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ name: 1 });

// Define the User interface
export interface User extends mongoose.Document {
  dateCreated: Date;
  username: string;
  email: string;
  emailVerified: boolean;
  password: string;
  passwordReset: boolean;
  custId: string | null;
  db: string | null;
  dbSyncTime: Date | null;
  dbSyncDevice: string | null;
  loggedInDevices: string[];
  // avatar?: { data: Buffer; contentType: string };
  name: string;
  description?: string;
  socials?: string;
  newsletter: boolean;
  tutorials: number[];
  trialEndDate: Date | null;
  proML: boolean;
  proLifetimeML: boolean;
}

// Create and export the User model
export const User = mongoose.model<User>("User", userSchema);
