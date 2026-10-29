import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {config} from './config.js';
import {connectDatabase,User,Course,Exam,Question,Attempt} from './models.js';
import {grade} from './domain.js';
import {validBirthDate} from './birth-dates.js';
export async function seedDatabase({adminEmail,adminPassword,studentEmail,studentDateOfBirth='2005-01-15'}){
  if(!adminEmail||!studentEmail||!adminPassword||adminPassword.length<12)throw new Error('Set seed emails and an admin password (12+ characters) in server/.env.');
  if(!validBirthDate(studentDateOfBirth))throw new Error('Set SEED_STUDENT_DOB to a real date in YYYY-MM-DD format.');
  if(adminEmail.toLowerCase()===studentEmail.toLowerCase())throw new Error('Admin and student emails must differ.');
  if(await User.estimatedDocumentCount()||await Course.estimatedDocumentCount()||await Exam.estimatedDocumentCount()||await Question.estimatedDocumentCount()||await Attempt.estimatedDocumentCount())throw new Error('Seed only runs on an empty database. Use a new database name to preserve existing records.');
  const admin=await User.create({name:'Alex Morgan',email:adminEmail,password:await bcrypt.hash(adminPassword,12),role:'admin',department:'Administration'});
  const courseData=[{code:'WEB101',title:'Web Development',instructor:'Dr. Maya Rao',description:'Build a strong foundation in HTML, CSS, JavaScript, and the modern web.'},{code:'CS201',title:'Computer Science',instructor:'Prof. Arjun Mehta',description:'Explore algorithms, data structures, and the fundamentals of computing.'},{code:'DB101',title:'Database Management',instructor:'Dr. Sara Wilson',description:'Learn how to model, query, and manage reliable data systems.'},{code:'UX101',title:'Design Fundamentals',instructor:'Prof. Olivia Chen',description:'Discover the principles behind clear, usable, and thoughtful interfaces.'}];
  const courses=await Course.insertMany(courseData);
  const names=['Jordan Taylor','Priya Sharma','Ethan Brooks','Ananya Patel','Noah Williams','Aisha Khan','Liam Anderson','Ishaan Gupta','Emma Davis','Aarav Singh','Sophia Martinez','Rohan Verma'];
  const students=[];for(let i=0;i<names.length;i++)students.push(await User.create({name:names[i],email:i===0?studentEmail:`demo.student${i+1}@example.com`,dateOfBirth:i===0?studentDateOfBirth:`2005-${String(i%12+1).padStart(2,'0')}-${String(i%27+1).padStart(2,'0')}`,studentId:`STU-${String(i+1).padStart(3,'0')}`,department:i%3===0?'Information Technology':'Computer Science',courses:i===0?courses.map(c=>c._id):[courses[i%4]._id,courses[(i+1)%4]._id]}));
  const banks=[
    [
      ['Which HTML element creates a hyperlink?','<a>','<p>','<div>','<span>','A'],
      ['What does CSS stand for?','Computer Style Sheets','Cascading Style Sheets','Creative Style System','Colorful Style Syntax','B'],
      ['Which keyword declares a block-scoped variable in JavaScript?','var','define','let','static','C'],
      ['Which HTTP method is intended to retrieve a resource?','POST','DELETE','PATCH','GET','D'],
      ['Which CSS property controls the size of text?','font-size','text-style','font-weight','text-size','A'],
      ['Which array method transforms every element into a new array?','filter','map','find','some','B'],
      ['What does a 404 HTTP status mean?','Success','Unauthorized','Not Found','Created','C'],
      ['Which HTML attribute provides alternate text for an image?','title','href','src','alt','D'],
      ['What does JSON stand for?','JavaScript Object Notation','Java Standard Object Network','JavaScript Ordered Nodes','Joined System Object Notation','A'],
      ['Which React Hook manages component state?','useEffect','useState','useRef','useMemo','B']
    ],
    [
      ['Which data structure follows LIFO?','Queue','Tree','Stack','Graph','C'],
      ['What is the time complexity of binary search on a sorted array?','O(n)','O(n²)','O(1)','O(log n)','D'],
      ['Which structure follows FIFO?','Queue','Stack','Set','Tree','A'],
      ['Which sorting algorithm repeatedly divides and merges arrays?','Bubble sort','Merge sort','Selection sort','Insertion sort','B'],
      ['Which structure stores key-value pairs?','Array','Stack','Hash table','Queue','C'],
      ['What does CPU stand for?','Computer Processing Unit','Central Program Utility','Core Processing Utility','Central Processing Unit','D'],
      ['Which number system uses only 0 and 1?','Binary','Decimal','Hexadecimal','Octal','A'],
      ['A recursive function must have what to terminate?','A loop','A base case','A global variable','A pointer','B'],
      ['How many bits are in a byte?','2','4','8','16','C'],
      ['Which traversal visits the root before its children?','In-order','Post-order','Breadth-only','Pre-order','D']
    ],
    [
      ['Which SQL command retrieves data?','SELECT','INSERT','UPDATE','DELETE','A'],
      ['Which key uniquely identifies each row?','Foreign key','Primary key','Sort key','Group key','B'],
      ['MongoDB stores records as what?','Rows only','XML files','BSON documents','CSV lines','C'],
      ['Which operation combines related SQL tables?','COUNT','LIMIT','ORDER BY','JOIN','D'],
      ['What helps speed up database lookups?','An index','A backup','A comment','A trigger only','A'],
      ['What does the A in ACID mean?','Availability','Atomicity','Accuracy','Association','B'],
      ['Which SQL clause filters rows?','ORDER BY','GROUP BY','WHERE','LIMIT','C'],
      ['Which MongoDB operation inserts one document?','findOne','updateMany','aggregate','insertOne','D'],
      ['A foreign key typically references what?','A key in another table','A file','An index name','A collection size','A'],
      ['What is a database transaction?','A table name','A unit of work committed or rolled back together','An export format','A CSS rule','B']
    ],
    [
      ['What does UX stand for?','Universal XML','User Experience','Unified Extension','User Execution','B'],
      ['Which principle groups nearby items?','Contrast','Balance','Proximity','Animation','C'],
      ['What is a wireframe?','A production database','A color palette','A finished photograph','A basic interface layout','D'],
      ['Why provide text alternatives for images?','Accessibility','File compression','Faster SQL','Color matching','A'],
      ['What does a user persona represent?','A code library','A research-based user archetype','A database role','A font size','B'],
      ['Which improves readability?','Low contrast','Tiny text','Clear hierarchy','All-caps paragraphs','C'],
      ['What is a prototype used for?','Storing passwords','Replacing research','Hosting databases','Testing ideas and interactions','D'],
      ['Which is an example of feedback in a UI?','A saved confirmation','A hidden label','An empty button','A missing cursor','A'],
      ['What is responsive design?','A fast server only','A layout that adapts to screen size','An image file','A fixed-width page','B'],
      ['Which practice helps keyboard users?','Removing focus styles','Hidden buttons','Visible focus indicators','Hover-only controls','C']
    ]
  ];
  const exams=[];for(let i=0;i<6;i++){
    const course=courses[i%4];const exam=await Exam.create({code:`${course.code}-T${i<4?'01':'02'}`,title:['Web Fundamentals','Algorithms & Data Structures','Database Essentials','Design Principles','JavaScript Knowledge Check','Computing Foundations'][i],course:course._id,durationMinutes:[30,45,30,20,25,30][i],questionCount:5,marksPerQuestion:2,passPercentage:60,maxAttempts:3,status:'draft'});
    await Question.insertMany(banks[i%4].map(([text,A,B,C,D,correctAnswer],j)=>({code:`Q${String(j+1).padStart(3,'0')}`,exam:exam._id,course:course._id,text,options:{A,B,C,D},correctAnswer,explanation:`The correct answer is option ${correctAnswer}.`})));exam.status=i===5?'draft':'published';await exam.save();exams.push(exam);
  }
  for(let i=1;i<students.length;i++){
    for(let month=0;month<3;month++){
      const student=students[i];const exam=exams[(i+month)%4];if(!student.courses.some(id=>String(id)===String(exam.course)))continue;
      const course=courses.find(c=>String(c._id)===String(exam.course));const questions=(await Question.find({exam:exam._id}).limit(5).lean()).map(q=>({questionId:String(q._id),text:q.text,options:q.options,correctAnswer:q.correctAnswer,explanation:q.explanation}));
      const answers={};questions.forEach((q,j)=>{answers[q.questionId]=j<(i%4)+2?q.correctAnswer:({A:'B',B:'C',C:'D',D:'A'}[q.correctAnswer]);});
      const date=new Date();date.setUTCMonth(date.getUTCMonth()-(i+month)%6);date.setUTCDate(Math.min(i+2,25));if(date>new Date())date.setTime(Date.now()-3600000);const deadline=new Date(date.getTime()+exam.durationMinutes*60000);
      await Attempt.create({student:student._id,exam:exam._id,course:course._id,attemptNumber:1,examTitle:exam.title,examCode:exam.code,courseTitle:course.title,courseCode:course.code,questions,answers,status:'submitted',startedAt:date,deadline,submittedAt:new Date(date.getTime()+12*60000),marksPerQuestion:exam.marksPerQuestion,passPercentage:exam.passPercentage,...grade(questions,answers,exam.marksPerQuestion,exam.passPercentage)});
    }
  }
  return {admin,student:students[0],courses:4,students:students.length,exams:exams.length};
}
if(process.argv[1]&&new URL(import.meta.url).pathname.toLowerCase().endsWith(process.argv[1].replaceAll('\\','/').toLowerCase().replace(/^[a-z]:/i,''))){
  try{const cfg=config();await connectDatabase(cfg.mongoUri);const result=await seedDatabase({adminEmail:process.env.SEED_ADMIN_EMAIL,adminPassword:process.env.SEED_ADMIN_PASSWORD,studentEmail:process.env.SEED_STUDENT_EMAIL,studentDateOfBirth:process.env.SEED_STUDENT_DOB||'2005-01-15'});console.log(`Demo workspace created: ${result.students} students, ${result.courses} courses, ${result.exams} exams. Admin: use your configured email/password. Student: register number STU-001 and your SEED_STUDENT_DOB (default 2005-01-15).`);}catch(e){console.error(e.message);process.exitCode=1;}finally{await mongoose.disconnect();}
}
