import {adminDashboard} from '../services/dashboard.service.js';
import {listResults,resultExportRows} from '../services/results.service.js';
import {getSettings,saveSettings} from '../services/settings.service.js';
import {exportFile} from '../services/transfers.service.js';
import {parse,settingsSchema} from '../validators/index.js';

export async function dashboard(req,res) {
  res.json(await adminDashboard());
}
export async function results(req,res) {
  res.json({records:await listResults(req.query.search)});
}
export async function exportResults(req,res) {
  await exportFile(res,'results',await resultExportRows(req.query.search),req.query.format||'csv');
}
export async function settings(req,res) {
  res.json(await getSettings());
}
export async function updateSettings(req,res) {
  res.json(await saveSettings(parse(settingsSchema,req.body)));
}
