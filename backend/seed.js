// seed.js
require('dotenv').config(); // Load environment variables

const sequelize = require('./config/database');
const { hashPassword } = require('./utils/passwordUtils');
const moment = require('moment'); // For handling dates

// Import all models
const User = require('./models/User');
const School = require('./models/School');
const Student = require('./models/Student');
const Education = require('./models/Education');
const Certification = require('./models/Certification');
const CoreSkill = require('./models/CoreSkill');
const StudentCoreSkillAssessment = require('./models/StudentCoreSkillAssessment');
const Category = require('./models/Category');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Interview = require('./models/Interview');
const Notification = require('./models/Notification');
const HelpRequest = require('./models/HelpRequest');

// --- Indian States & Cities Data ---
const indianLocations = [
  { state: "Delhi", cities: [
    { name: "New Delhi", pincode: "110001" },
    { name: "Ghaziabad", pincode: "201001" }, // NCR
    { name: "Gurugram", pincode: "122001" } // NCR
  ]},
  { state: "Maharashtra", cities: [
    { name: "Mumbai", pincode: "400001" },
    { name: "Pune", pincode: "411001" }
  ]},
  { state: "Karnataka", cities: [
    { name: "Bengaluru", pincode: "560001" },
    { name: "Mysuru", pincode: "570001" }
  ]},
  { state: "Uttar Pradesh", cities: [
    { name: "Lucknow", pincode: "226001" },
    { name: "Noida", pincode: "201301" }
  ]},
  { state: "Tamil Nadu", cities: [
    { name: "Chennai", pincode: "600001" },
    { name: "Coimbatore", pincode: "641001" }
  ]},
  { state: "West Bengal", cities: [
    { name: "Kolkata", pincode: "700001" }
  ]},
  { state: "Telangana", cities: [
    { name: "Hyderabad", pincode: "500001" }
  ]}
];

// Helper to get random location
const getRandomLocation = () => {
  const randomState = indianLocations[Math.floor(Math.random() * indianLocations.length)];
  const randomCity = randomState.cities[Math.floor(Math.random() * randomState.cities.length)];
  return {
    state: randomState.state,
    city: randomCity.name,
    pincode: randomCity.pincode,
    address: `Plot No. ${Math.floor(Math.random() * 900) + 100}, Sector ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
  };
};

const seedDatabase = async () => {
  try {
    // --- 1. Synchronize and force-recreate tables ---
    // !!! WARNING: { force: true } will drop existing tables and recreate them.
    // !!! This means ALL YOUR CURRENT DATA WILL BE LOST.
    // !!! Use with extreme caution, especially outside of development environments.
    console.log('Synchronizing database. All existing data will be lost...');
    await sequelize.sync({ force: true });
    console.log('Database synced. Tables recreated.');

    // --- 2. Create Users ---
    console.log('Creating users...');
    const adminPassword = await hashPassword('adminpassword123');
    const schoolPassword = await hashPassword('schoolpass');
    const studentPassword = await hashPassword('studentpass');

    const adminUser = await User.create({
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Platform Admin',
      role: 'admin',
      isOnboardingComplete: true
    });

    const schoolUser1 = await User.create({
      email: 'school1@example.com',
      password: schoolPassword,
      name: 'Bright Minds Academy',
      role: 'school',
      isOnboardingComplete: true // Onboarded school
    });

    const schoolUser2 = await User.create({
      email: 'school2@example.com',
      password: schoolPassword,
      name: 'Global Public School',
      role: 'school',
      isOnboardingComplete: false // Not onboarded school (for testing onboarding flow)
    });

    const studentUser1 = await User.create({
      email: 'student1@example.com',
      password: studentPassword,
      name: 'Alice Sharma',
      role: 'student',
      isOnboardingComplete: true // Onboarded student
    });

    const studentUser2 = await User.create({
      email: 'student2@example.com',
      password: studentPassword,
      name: 'Rahul Kumar',
      role: 'student',
      isOnboardingComplete: false // Not onboarded student (for testing onboarding flow)
    });

    const studentUser3 = await User.create({
      email: 'student3@example.com',
      password: studentPassword,
      name: 'Priya Singh',
      role: 'student',
      isOnboardingComplete: true // Another onboarded student
    });
    console.log('Users created.');

    // --- 3. Create School Profiles ---
    console.log('Creating school profiles...');
    const loc1 = getRandomLocation();
    const schoolProfile1 = await School.create({
      userId: schoolUser1.id,
      logoUrl: 'http://localhost:5000/uploads/profiles/bright_minds_logo.png', // Dummy URL
      bio: 'Bright Minds Academy is a leading educational institution known for its innovative teaching methods and student-centric approach.',
      websiteLink: 'http://www.brightmindsacademy.com',
      address: loc1.address,
      city: loc1.city,
      state: loc1.state,
      pincode: loc1.pincode
    });

    const loc2 = getRandomLocation();
    await School.create({
      userId: schoolUser2.id,
      // No profile data for non-onboarded school
      address: loc2.address, // Still add address for location pre-fill in jobs
      city: loc2.city,
      state: loc2.state,
      pincode: loc2.pincode
    });
    console.log('School profiles created.');

    // --- 4. Create Student Profiles ---
console.log('Creating student profiles...');
const studentProfile1 = await Student.create({
  userId: studentUser1.id,
  firstName: 'Alice',
  lastName: 'Sharma',
  mobile: '9810010001',
  about: 'Highly motivated Mathematics educator with 5 years of experience, passionate about making complex concepts accessible to students.',
  imageUrl: 'http://localhost:5000/uploads/profiles/alice_sharma.jpg', // Dummy URL
  skills: ['Curriculum Design', 'Differentiated Instruction', 'Mentoring', 'Problem Solving']
});

// Capture the student profile object for Rahul
const studentProfile2 = await Student.create({ // <--- CAPTURE THIS OBJECT
  userId: studentUser2.id,
  firstName: 'Rahul',
  lastName: 'Kumar',
  mobile: '9920020002',
  about: 'Recent graduate with a keen interest in Science education. Eager to contribute to a dynamic learning environment.'
});

const studentProfile3 = await Student.create({
  userId: studentUser3.id,
  firstName: 'Priya',
  lastName: 'Singh',
  mobile: '7830030003',
  about: 'Experienced English teacher with a focus on creative writing and literature analysis.',
  imageUrl: 'http://localhost:5000/uploads/profiles/priya_singh.jpg', // Dummy URL
  skills: ['Creative Writing', 'Literary Analysis', 'Public Speaking']
});
console.log('Student profiles created.');

    // --- 5. Create Education and Certifications for onboarded students ---
    console.log('Creating education and certifications...');
    await Education.bulkCreate([
      {
        studentId: studentProfile1.id,
        collegeName: 'Miranda House, Delhi University',
        universityName: 'University of Delhi',
        courseName: 'B.Sc. (Hons) Mathematics',
        startYear: 2015,
        endYear: 2018,
        gpa: '8.5/10'
      },
      {
        studentId: studentProfile1.id,
        collegeName: 'Central Institute of Education',
        universityName: 'University of Delhi',
        courseName: 'B.Ed.',
        startYear: 2018,
        endYear: 2020,
        gpa: 'A'
      },
      {
        studentId: studentProfile3.id,
        collegeName: 'Lady Shri Ram College, DU',
        universityName: 'University of Delhi',
        courseName: 'B.A. (Hons) English Literature',
        startYear: 2016,
        endYear: 2019,
        gpa: '8.8/10'
      }
    ]);

    await Certification.bulkCreate([
      {
        studentId: studentProfile1.id,
        name: 'NCERT Certified Math Teacher',
        issuedBy: 'NCERT, India',
        description: 'Certified for teaching secondary level mathematics curriculum.',
        dateReceived: '2021-03-01',
        hasExpiry: false,
        expiryDate: null,
        certificateLink: 'http://localhost:5000/uploads/certificates/math_cert_ncert.pdf'
      },
      {
        studentId: studentProfile1.id,
        name: 'Digital Pedagogy Workshop',
        issuedBy: 'Digital Learning Institute',
        description: 'Completed workshop on integrating digital tools in teaching.',
        dateReceived: '2023-09-10',
        hasExpiry: true,
        expiryDate: '2026-09-10',
        certificateLink: 'http://localhost:5000/uploads/certificates/digital_pedagogy.png'
      },
      {
        studentId: studentProfile3.id,
        name: 'CELTA Certification',
        issuedBy: 'Cambridge Assessment English',
        description: 'Certificate in English Language Teaching to Adults.',
        dateReceived: '2020-07-01',
        hasExpiry: false,
        expiryDate: null,
        certificateLink: 'http://localhost:5000/uploads/certificates/celta_cert.pdf'
      }
    ]);
    console.log('Education and certifications created.');

    // --- 6. Create Core Skills ---
    console.log('Creating core skills...');
    // Corrected to ensure subSkills array length is between 1 and 4
    const mathSkill = await CoreSkill.create({ name: 'Mathematics', subSkills: ['Algebra', 'Geometry', 'Calculus', 'Statistics'] }); // 4 items - OK
    const scienceSkill = await CoreSkill.create({ name: 'Science', subSkills: ['Physics', 'Chemistry', 'Biology'] }); // 3 items - OK
    const englishSkill = await CoreSkill.create({ name: 'English', subSkills: ['Grammar', 'Literature', 'Writing', 'Reading Comprehension'] }); // 4 items - OK
    const computerSkill = await CoreSkill.create({ name: 'Computer Science', subSkills: ['Programming', 'Data Structures', 'Algorithms'] }); // 3 items - OK
    console.log('Core skills created.');

    // --- 7. Create Categories (Job Types) ---
    console.log('Creating categories...');
    const mathTeacherCategory = await Category.create({ name: 'Mathematics Teacher', coreSkillIds: [mathSkill.id] });
    const scienceTeacherCategory = await Category.create({ name: 'Science Teacher', coreSkillIds: [scienceSkill.id] });
    const englishTeacherCategory = await Category.create({ name: 'English Teacher', coreSkillIds: [englishSkill.id] });
    const csTeacherCategory = await Category.create({ name: 'Computer Science Teacher', coreSkillIds: [computerSkill.id] });
    console.log('Categories created.');

    // --- 8. Admin Uploads Core Skill Marks for Students ---
    console.log('Uploading student core skill marks...');
    await StudentCoreSkillAssessment.create({
      studentId: studentProfile1.id, // Alice (Maths student)
      coreSkillId: mathSkill.id,
      subSkillMarks: { 'Algebra': 9, 'Geometry': 8, 'Calculus': 7, 'Statistics': 9 }
    });
    await StudentCoreSkillAssessment.create({
      studentId: studentProfile1.id, // Alice also has some basic science skills
      coreSkillId: scienceSkill.id,
      subSkillMarks: { 'Physics': 5, 'Chemistry': 6, 'Biology': 4, 'Environmental Science': 7 }
    });
    await StudentCoreSkillAssessment.create({
      studentId: studentProfile3.id, // Priya (English student)
      coreSkillId: englishSkill.id,
      subSkillMarks: { 'Grammar': 9, 'Literature': 8, 'Writing': 9, 'Reading Comprehension': 7 }
    });
    // Student2 (Rahul) has no core skills initially for testing job matching with no skills scenario
    console.log('Student core skill marks uploaded.');

    // --- 9. School Posts Jobs ---
    console.log('School posting jobs...');
    const jobLoc1 = getRandomLocation(); // Random Indian location for job
    const job1 = await Job.create({
      schoolId: schoolProfile1.id,
      categoryId: mathTeacherCategory.id,
      title: 'High School Mathematics Teacher',
      location: `${jobLoc1.address}, ${jobLoc1.city}, ${jobLoc1.state}, ${jobLoc1.pincode}`,
      applicationEndDate: moment().add(30, 'days').format('YYYY-MM-DD'), // 30 days from now
      subjectsToTeach: ['Algebra II', 'Pre-Calculus', 'AP Calculus'],
      minSalaryLPA: 7,
      maxSalaryLPA: 10,
      jobDescription: 'Seeking an enthusiastic and experienced mathematics teacher for grades 9-12 to inspire and challenge students.',
      keyResponsibilities: 'Develop and implement curriculum; Assess student progress; Foster a positive learning environment; Collaborate with faculty.',
      requirements: 'Master\'s degree in Mathematics Education; Valid teaching license; 5+ years experience in high school teaching.',
      status: 'open',
      jobLevel: 'Mid-level'
    });

    const jobLoc2 = getRandomLocation();
    const job2 = await Job.create({
      schoolId: schoolProfile1.id,
      categoryId: scienceTeacherCategory.id,
      title: 'Elementary Science Teacher',
      location: `${jobLoc2.address}, ${jobLoc2.city}, ${jobLoc2.state}, ${jobLoc2.pincode}`,
      applicationEndDate: moment().add(60, 'days').format('YYYY-MM-DD'), // 60 days from now
      subjectsToTeach: ['General Science', 'Environmental Studies'],
      minSalaryLPA: 5,
      maxSalaryLPA: 7,
      jobDescription: 'Inspire young minds with engaging, hands-on science lessons for grades 3-5.',
      keyResponsibilities: 'Conduct interactive experiments; Prepare age-appropriate lesson plans; Evaluate student understanding.',
      requirements: 'Bachelor\'s degree in Elementary Education or Science; State teaching certification.',
      status: 'open',
      jobLevel: 'Entry-level'
    });

    const jobLoc3 = getRandomLocation();
    const job3 = await Job.create({
      schoolId: schoolProfile1.id,
      categoryId: englishTeacherCategory.id,
      title: 'English Literature Teacher',
      location: `${jobLoc3.address}, ${jobLoc3.city}, ${jobLoc3.state}, ${jobLoc3.pincode}`,
      applicationEndDate: moment().subtract(10, 'days').format('YYYY-MM-DD'), // Past date for 'closed' example
      subjectsToTeach: ['English Literature', 'Grammar', 'Creative Writing'],
      minSalaryLPA: 6,
      maxSalaryLPA: 9,
      jobDescription: 'Teach various aspects of English literature to secondary students, encouraging critical thinking and analysis.',
      keyResponsibilities: 'Analyze literary works; Encourage critical thinking; Develop writing skills; Prepare students for board exams.',
      requirements: 'Master\'s degree in English; Experience with CBSE curriculum preferred; Strong communication skills.',
      status: 'closed', // Manually set to closed
      jobLevel: 'Mid-level'
    });
    console.log('Jobs posted.');

    console.log('Students applying for jobs...');
// Alice (studentProfile1) applies to Job 1 (Math - matching skills)
const app1_student1_job1 = await Application.create({
  studentId: studentProfile1.id, // Correct: Use studentProfile1.id
  jobId: job1.id,
  coverLetter: 'I am highly passionate about teaching mathematics and believe my experience aligns perfectly with your school\'s mission.',
  experience: '5 years',
  availability: 'Immediately',
  resumeUrl: 'http://localhost:5000/uploads/resumes/alice_math_resume.pdf',
  applicationDate: moment().subtract(5, 'days').format('YYYY-MM-DD'),
  status: 'applied'
});

// Alice applies to Job 2 (Science - matching some skills)
const app2_student1_job2 = await Application.create({
  studentId: studentProfile1.id, // Correct: Use studentProfile1.id
  jobId: job2.id,
  coverLetter: 'My background in elementary education and a passion for science makes me an ideal candidate for this role.',
  experience: '2 years',
  availability: '2 Weeks Notice',
  resumeUrl: 'http://localhost:5000/uploads/resumes/alice_science_resume.pdf',
  applicationDate: moment().subtract(4, 'days').format('YYYY-MM-DD'),
  status: 'applied'
});

// Rahul (studentUser2 - NOT onboarded, no core skills) applies to Job 1
const app3_student2_job1 = await Application.create({
  studentId: studentProfile2.id, // <--- CORRECTED: Use studentProfile2.id here
  jobId: job1.id,
  coverLetter: 'I am a recent graduate eager to start my teaching career in mathematics.',
  experience: 'Fresh',
  availability: 'Immediately',
  resumeUrl: 'http://localhost:5000/uploads/resumes/rahul_fresh_resume.pdf',
  applicationDate: moment().subtract(3, 'days').format('YYYY-MM-DD'),
  status: 'applied'
});

// Priya (studentProfile3 - English teacher) applies to Job 3 (closed job)
const app4_student3_job3 = await Application.create({
  studentId: studentProfile3.id, // Correct: Use studentProfile3.id
  jobId: job3.id,
  coverLetter: 'I possess extensive experience in teaching English literature and fostering a love for reading.',
  experience: '7 years',
  availability: '1 Month Notice',
  resumeUrl: 'http://localhost:5000/uploads/resumes/priya_english_resume.pdf',
  applicationDate: moment().subtract(15, 'days').format('YYYY-MM-DD'),
  status: 'applied'
});
console.log('Applications created.');

    // --- 11. Application Status Updates & Interviews ---
    console.log('Updating application statuses and scheduling interviews...');
    // School shortlists Alice for Job 1
    app1_student1_job1.status = 'shortlisted';
    await app1_student1_job1.save();

    // School schedules an interview for Alice for Job 1
    app1_student1_job1.status = 'interview_scheduled';
    await app1_student1_job1.save();
    const interview1 = await Interview.create({
      applicationId: app1_student1_job1.id,
      title: 'Scheduled Interview',
      date: moment().add(7, 'days').format('YYYY-MM-DD'), // Interview 7 days from now
      startTime: '10:00:00',
      endTime: '11:00:00',
      location: `${schoolProfile1.address}, ${schoolProfile1.city}, ${schoolProfile1.state}, ${schoolProfile1.pincode}`
    });

    // School rejects Rahul for Job 1
    app3_student2_job1.status = 'rejected';
    await app3_student2_job1.save();

    // School shortlists Priya for Job 3 (even though job is now closed, showing a "Completed" status)
    // Simulating entire flow for Priya
    app4_student3_job3.status = 'shortlisted';
    await app4_student3_job3.save();
    app4_student3_job3.status = 'interview_scheduled';
    await app4_student3_job3.save();
    const interview2 = await Interview.create({
      applicationId: app4_student3_job3.id,
      title: 'Final Round Interview',
      date: moment().subtract(5, 'days').format('YYYY-MM-DD'), // Interview was 5 days ago
      startTime: '14:00:00',
      endTime: '15:00:00',
      location: `${schoolProfile1.address}, ${schoolProfile1.city}, ${schoolProfile1.state}, ${schoolProfile1.pincode}`
    });
    console.log('Application statuses updated and interviews scheduled.');

    // --- 12. Notifications ---
    console.log('Creating notifications...');
    await Notification.bulkCreate([
      // To School Admin (schoolUser1's userId) about new applications
      {
        userId: schoolUser1.id,
        message: `New student (${studentProfile1.firstName} ${studentProfile1.lastName}) applied to '${job1.title}'.`,
        type: 'info',
        link: `/school/jobs/${job1.id}/applicants`
      },
      {
        userId: schoolUser1.id,
        message: `New student (${studentUser2.name}) applied to '${job1.title}'.`,
        type: 'info',
        link: `/school/jobs/${job1.id}/applicants`
      },
      // To Alice (studentUser1) about shortlisting
      {
        userId: studentUser1.id,
        message: `Your application for '${job1.title}' has been shortlisted by ${schoolUser1.name}.`,
        type: 'success',
        link: `/student/dashboard`
      },
      // To Alice about interview
      {
        userId: studentUser1.id,
        message: `An interview for your application to '${job1.title}' has been scheduled for ${moment(interview1.date).format('MMMM Do, YYYY')} at ${moment(interview1.startTime, 'HH:mm:ss').format('h:mm A')}.`,
        type: 'info',
        link: `/student/calendar`
      },
      // To Rahul (studentUser2) about rejection
      {
        userId: studentUser2.id,
        message: `Your application for '${job1.title}' was not successful at this time.`,
        type: 'error',
        link: `/student/dashboard`
      },
      // To Priya (studentProfile3) about interview
      {
        userId: studentUser3.id,
        message: `An interview for your application to '${job3.title}' was scheduled for ${moment(interview2.date).format('MMMM Do, YYYY')}.`,
        type: 'info',
        link: `/student/calendar`
      },
      // Admin notification for a new help request (from help desk seed)
      {
        userId: adminUser.id,
        message: 'New help request: "Login issue at Bright Minds Academy..."',
        type: 'info',
        link: `/admin/help/uuid-of-a-help-request` // Placeholder link, needs to be updated manually for specific request
      }
    ]);
    console.log('Notifications created.');

    // --- 13. Help Requests ---
    console.log('Creating help requests...');
    const helpReq1 = await HelpRequest.create({
      userId: schoolUser1.id,
      subject: 'Issue with job posting updates',
      message: 'We are unable to modify certain fields on our recently posted job. Can you assist?',
      status: 'open'
    });

    const helpReq2 = await HelpRequest.create({
      userId: studentUser1.id,
      subject: 'Resume upload problem',
      message: 'My new resume file is failing to upload on the application form.',
      status: 'resolved'
    });
    console.log('Help requests created.');

    console.log('--- Database seeding complete! ---');
    console.log('\n--- Test Accounts ---');
    console.log(`Admin Login: ${adminUser.email} / adminpassword123`);
    console.log(`School1 Login: ${schoolUser1.email} / schoolpass (Onboarded: Bright Minds Academy)`);
    console.log(`School2 Login: ${schoolUser2.email} / schoolpass (NOT Onboarded: Global Public School)`);
    console.log(`Student1 Login: ${studentUser1.email} / studentpass (Onboarded: Alice Sharma)`);
    console.log(`Student2 Login: ${studentUser2.email} / studentpass (NOT Onboarded: Rahul Kumar)`);
    console.log(`Student3 Login: ${studentUser3.email} / studentpass (Onboarded: Priya Singh)`);

  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1); // Exit with error code
  } finally {
    // Keep this commented out so the script exits after running
    // process.exit(0);
  }
};

seedDatabase();