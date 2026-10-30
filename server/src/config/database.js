import mongoose from 'mongoose';
import * as models from '../models/index.js';

export async function connectDatabase(uri) {
  await mongoose.connect(uri);
  await Promise.all(Object.values(models).map(model=>model.init()));
}
