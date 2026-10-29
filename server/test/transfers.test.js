import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {parse} from 'csv-parse/sync';
import {exportFile} from '../src/transfers.js';

test('CSV and Excel result files preserve numeric scores and neutralize formula text',async()=>{
  const row={studentId:'S101',studentName:'=SUM(1,1)',email:'student@example.com',courseCode:'WEB101',examCode:'TEST1',examTitle:'Web Fundamentals',attemptNumber:1,score:9,maxScore:10,percentage:90,passed:true,startedAt:'2026-10-28T04:00:00.000Z',submittedAt:'2026-10-28T04:15:00.000Z'};
  for(const format of ['csv','xlsx']){
    let body;const headers={};const res={set(key,value){headers[key]=value;return this;},type(value){headers['Content-Type']=value;return this;},send(value){body=value;return this;}};
    await exportFile(res,'results',[row],format);assert.ok(Buffer.isBuffer(body));assert.match(headers['Content-Disposition'],new RegExp(`results\\.${format}`));
    if(format==='csv'){
      const records=parse(body,{columns:true,bom:true});assert.equal(records.length,1);assert.equal(records[0].studentName,"'=SUM(1,1)");assert.equal(records[0].score,'9');assert.equal(records[0].submittedAt,row.submittedAt);
    }else{
      const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(body);const sheet=workbook.worksheets[0];assert.equal(sheet.rowCount,2);assert.equal(sheet.getCell('B2').value,"'=SUM(1,1)");assert.equal(sheet.getCell('H2').value,9);assert.equal(sheet.getCell('I2').value,10);assert.equal(sheet.getCell('J2').value,90);assert.equal(sheet.getCell('K2').value,true);
    }
  }
});
