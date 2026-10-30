import ExcelJS from 'exceljs';
import { parse as parseCsv } from 'csv-parse/sync';
import { assert,safeCell } from '../utils/domain.js';
export const columns={
  students:['studentId','name','email','dateOfBirth','phone','department','status','courseCodes'],
  courses:['code','title','description','instructor','status'],
  exams:['code','title','courseCode','durationMinutes','questionCount','marksPerQuestion','passPercentage','maxAttempts','startsAt','endsAt','status','assignedStudentEmails','shuffleQuestions'],
  questions:['code','examCode','courseCode','text','optionA','optionB','optionC','optionD','correctAnswer','explanation'],
  results:['studentId','studentName','email','courseCode','examCode','examTitle','attemptNumber','score','maxScore','percentage','passed','startedAt','submittedAt']
};
export const samples={
  students:{studentId:'STU-101',name:'Sample Student',email:'student101@example.com',dateOfBirth:'2005-01-15',phone:'',department:'Computer Science',status:'active',courseCodes:'WEB101'},
  courses:{code:'WEB101',title:'Web Development',description:'Foundations of the modern web',instructor:'Dr. Maya Rao',status:'active'},
  exams:{code:'WEB-TEST-01',title:'Web Fundamentals',courseCode:'WEB101',durationMinutes:30,questionCount:5,marksPerQuestion:2,passPercentage:60,maxAttempts:2,startsAt:'',endsAt:'',status:'draft',assignedStudentEmails:'',shuffleQuestions:true},
  questions:{code:'Q001',examCode:'WEB-TEST-01',courseCode:'WEB101',text:'Which tag creates a hyperlink?',optionA:'<a>',optionB:'<p>',optionC:'<div>',optionD:'<span>',correctAnswer:'A',explanation:'The anchor element creates a hyperlink.'}
};
export async function exportFile(res,entity,rows,format='csv',template=false) {
  assert(['csv','xlsx'].includes(format),400,'Export format must be csv or xlsx.');
  const workbook=new ExcelJS.Workbook();workbook.creator='Diyaprosoft LMS';const sheet=workbook.addWorksheet(entity);
  sheet.columns=columns[entity].map(key=>({header:key,key,width:Math.min(45,Math.max(18,key.length+4))}));
  for(const row of rows){const out={};for(const key of columns[entity]){let value=row[key];if(Array.isArray(value))value=value.join(';');out[key]=typeof value==='number'||typeof value==='boolean'?value:safeCell(value);}sheet.addRow(out);}
  sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF5147E5'}};sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter={from:'A1',to:{row:Math.max(sheet.rowCount,1),column:columns[entity].length}};
  res.set('Content-Disposition',`attachment; filename="${entity}${template?'-template':''}.${format}"`);
  res.type(format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'text/csv; charset=utf-8');
  const buffer=format==='xlsx'?await workbook.xlsx.writeBuffer():await workbook.csv.writeBuffer({formatterOptions:{writeBOM:true}});res.send(Buffer.from(buffer));
}
export async function readImport(file,entity) {
  assert(file,400,'Choose a CSV or XLSX file.');
  let rows;
  if(file.originalname.toLowerCase().endsWith('.csv'))rows=parseCsv(file.buffer,{columns:headers=>{assert(new Set(headers).size===headers.length,400,'Duplicate column headers are not allowed.');return headers;},bom:true,skip_empty_lines:true,trim:true,max_record_size:100000,relax_column_count:false});
  else if(file.originalname.toLowerCase().endsWith('.xlsx')) {
    const book=new ExcelJS.Workbook();await book.xlsx.load(file.buffer);const sheet=book.worksheets[0];assert(sheet,400,'The workbook has no worksheets.');
    assert(sheet.rowCount<=1001&&sheet.columnCount<=40,400,'Maximum 1,000 rows and 40 columns per import.');
    const header=sheet.getRow(1).values.slice(1).map(x=>String(x??'').trim());assert(new Set(header).size===header.length,400,'Duplicate column headers are not allowed.');rows=[];
    sheet.eachRow((row,n)=>{if(n===1)return;const obj={};header.forEach((key,i)=>{const cell=row.getCell(i+1);assert(cell.type!==ExcelJS.ValueType.Formula,400,`Row ${n}: formulas are not accepted.`);const v=cell.value;obj[key]=v instanceof Date?v.toISOString():v==null?'':typeof v==='object'?cell.text:v;});rows.push(obj);});
  }else assert(false,400,'Only .csv and .xlsx files are supported.');
  assert(rows.length>0&&rows.length<=1000,400,'Import between 1 and 1,000 rows.');
  const headers=Object.keys(rows[0]);assert(new Set(headers).size===headers.length&&headers.every(h=>columns[entity].includes(h)),400,`Unknown or duplicate columns. Use the ${entity} template.`);
  return rows.map(row=>{
    const obj={...row};
    for(const key of ['courseCodes','assignedStudentEmails'])if(key in obj)obj[key]=String(obj[key]||'').split(';').map(x=>x.trim()).filter(Boolean);
    if('shuffleQuestions'in obj){const s=String(obj.shuffleQuestions).toLowerCase();assert(['true','false','1','0',''].includes(s),400,'shuffleQuestions must be true or false.');obj.shuffleQuestions=!['false','0'].includes(s);}
    if(entity==='students'&&typeof obj.dateOfBirth==='string'&&/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(obj.dateOfBirth))obj.dateOfBirth=obj.dateOfBirth.slice(0,10);
    for(const key of ['durationMinutes','questionCount','marksPerQuestion','passPercentage','maxAttempts'])if(obj[key]==='')delete obj[key];
    return obj;
  });
}
