import {listRecords,recordExportRows,importRecords,saveRecord,flattenRecord,deleteRecord} from '../services/records.service.js';
import {exportFile,samples} from '../services/transfers.service.js';

export async function template(req,res) {
  await exportFile(res,req.params.entity,[samples[req.params.entity]],req.query.format||'csv',true);
}
export async function exportRecords(req,res) {
  await exportFile(res,req.params.entity,await recordExportRows(req.params.entity),req.query.format||'csv');
}
export async function importSpreadsheet(req,res) {
  res.json(await importRecords(req.params.entity,req.file));
}
export async function index(req,res) {
  res.json({records:await listRecords(req.params.entity,req.query.search)});
}
export async function create(req,res) {
  const {record}=await saveRecord(req.params.entity,req.body);
  res.status(201).json({record:await flattenRecord(req.params.entity,record)});
}
export async function update(req,res) {
  const {record}=await saveRecord(req.params.entity,req.body,req.params.id);
  res.json({record:await flattenRecord(req.params.entity,record)});
}
export async function destroy(req,res) {
  await deleteRecord(req.params.entity,req.params.id);res.json({message:'Record deleted.'});
}
