import {PlatformSettings} from '../models/index.js';

// Read on every request so a change applies to existing attempts and sessions.
export async function getSettings() {
  const settings=await PlatformSettings.findById('global').lean();
  return {studentResultsVisible:settings?.studentResultsVisible??true};
}
export async function saveSettings(settings) {
  await PlatformSettings.findOneAndUpdate({_id:'global'},{$set:settings},{upsert:true,new:true,runValidators:true});
  return getSettings();
}
