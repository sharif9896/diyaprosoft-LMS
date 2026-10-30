import bcrypt from 'bcryptjs';
import {User} from '../models/index.js';
import {assert} from '../utils/domain.js';

export async function signInAdmin({email,password}) {
  const user=await User.findOne({email,role:'admin'}).select('+password +tokenVersion');
  const valid=await bcrypt.compare(password,user?.password||'$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');
  assert(user&&valid&&user.status==='active',401,'Email or password is incorrect, or your account is inactive.');
  return user;
}

export async function signInStudent({registerNumber,dateOfBirth}) {
  const user=await User.findOne({studentId:registerNumber,role:'student'}).select('+dateOfBirth +tokenVersion');
  assert(user&&user.dateOfBirth===dateOfBirth&&user.status==='active',401,'Register number or date of birth is incorrect, or your account is inactive.');
  return user;
}

export async function changeAdminPassword(userId,{currentPassword,newPassword}) {
  const user=await User.findById(userId).select('+password +tokenVersion');
  assert(await bcrypt.compare(currentPassword,user.password),400,'The current password is incorrect.');
  user.password=await bcrypt.hash(newPassword,12);user.tokenVersion+=1;
  await user.save();return user;
}
