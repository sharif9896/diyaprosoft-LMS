import { z } from 'zod';
import {validBirthDate} from './birth-dates.js';
const text=(max=200)=>z.string().trim().min(1).max(max);
const optional=(max=500)=>z.string().trim().max(max).default('');
const codes=z.array(text()).max(200).default([]);
const number=(min,max,def)=>z.coerce.number().int().min(min).max(max).default(def);
const date=z.union([z.string().datetime({offset:true}),z.date(),z.literal(''),z.null()]).optional().transform(v=>v?new Date(v):null);
export const birthDateSchema=z.string().trim().refine(validBirthDate,'Enter a real date of birth in YYYY-MM-DD format, from 1900 through today.');
export const studentLoginSchema=z.object({registerNumber:text(50),dateOfBirth:birthDateSchema}).strict();
export const schemas={
  students:z.object({name:text(100),email:z.string().trim().email().toLowerCase(),studentId:text(50),dateOfBirth:birthDateSchema,phone:optional(30),department:optional(100),status:z.enum(['active','inactive']).default('active'),courseCodes:codes}).strict(),
  courses:z.object({code:text(50).transform(s=>s.toUpperCase()),title:text(),description:optional(2000),instructor:optional(100),status:z.enum(['active','archived']).default('active')}),
  exams:z.object({code:text(50).transform(s=>s.toUpperCase()),title:text(),courseCode:text(50).transform(s=>s.toUpperCase()),durationMinutes:number(1,240,30),questionCount:number(1,200,10),marksPerQuestion:number(1,100,1),passPercentage:number(0,100,50),maxAttempts:number(1,10,1),startsAt:date,endsAt:date,status:z.enum(['draft','published','archived']).default('draft'),assignedStudentEmails:z.array(z.string().email().toLowerCase()).max(1000).default([]),shuffleQuestions:z.boolean().default(true)}).refine(v=>!v.startsAt||!v.endsAt||v.endsAt>v.startsAt,{message:'End time must be after start time.',path:['endsAt']}),
  questions:z.object({code:text(50).transform(s=>s.toUpperCase()),examCode:text(50).transform(s=>s.toUpperCase()),courseCode:text(50).transform(s=>s.toUpperCase()),text:text(5000),optionA:text(1000),optionB:text(1000),optionC:text(1000),optionD:text(1000),correctAnswer:z.enum(['A','B','C','D']),explanation:optional(5000)})
};
export function parse(schema,data) { const r=schema.safeParse(data);if(!r.success){const e=new Error(r.error.issues.map(i=>`${i.path.join('.')||'Record'}: ${i.message}`).join('; '));e.status=400;throw e;}return r.data; }
export const profileSchema=z.object({name:text(100),phone:optional(30),department:optional(100),bio:optional(1000),preferences:z.object({emailNotifications:z.boolean(),timezone:z.string().max(100).refine(v=>{try{Intl.DateTimeFormat('en',{timeZone:v});return true;}catch{return false;}},'Invalid timezone')}).optional()});
