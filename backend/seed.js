// backend/seed.js
const { User, Student, School, Category, CoreSkill } = require('./config/database');
const { hashPassword } = require('./utils/passwordUtils');

const seedDatabase = async () => {
  try {
    // Hash passwords before seeding
    const adminPassword = await hashPassword('adminpassword123'); // Example admin password
    const studentPassword = await hashPassword('studentpassword123'); // Example student password
    const schoolPassword = await hashPassword('schoolpassword123'); // Example school password

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com', // Use a real email for testing if you want to receive emails
      password: adminPassword,
      role: 'admin',
      isOnboardingComplete: true
    });
    console.log('Admin user created:', adminUser.email);

    // Create a Sample Student User
    const studentUser = await User.create({
      name: 'Test Student',
      email: 'student@example.com',
      password: studentPassword,
      role: 'student',
      isOnboardingComplete: false // Set to false to test onboarding flow
    });
    // Create associated Student profile
    await Student.create({
      userId: studentUser.id,
      firstName: 'Test',
      lastName: 'Student',
      mobile: '1234567890',
      about: 'A test student account.',
      skills: ['Mathematics', 'Science'],
      imageUrl: 'https://placehold.co/150x150/cccccc/ffffff?text=Student',
      resumeUrl: 'https://placehold.co/100x100/cccccc/ffffff?text=Resume'
    });
    // Mark onboarding complete if you want to test APIs that require it
    studentUser.isOnboardingComplete = true;
    await studentUser.save();
    console.log('Student user created:', studentUser.email);


    // Create a Sample School User
    const schoolUser = await User.create({
      name: 'Test School Account',
      email: 'school@example.com',
      password: schoolPassword,
      role: 'school',
      isOnboardingComplete: false // Set to false to test onboarding flow
    });
    // Create associated School profile
    await School.create({
      userId: schoolUser.id,
      name: 'Test School Name', // This field is now derived from User.name
      logoUrl: 'https://placehold.co/150x150/cccccc/ffffff?text=SchoolLogo',
      bio: 'A test school for demonstration purposes.',
      websiteLink: 'https://www.testschool.com',
      address: '123 School Rd',
      city: 'Testville',
      state: 'TS',
      pincode: '123456'
    });
    // Mark onboarding complete if you want to test APIs that require it
    schoolUser.isOnboardingComplete = true;
    await schoolUser.save();
    console.log('School user created:', schoolUser.email);

    // Create some Categories (Job Types)
    const mathCategory = await Category.create({ name: 'Mathematics Teacher', coreSkillIds: [] });
    const scienceCategory = await Category.create({ name: 'Science Teacher', coreSkillIds: [] });
    console.log('Categories created.');

    // Create some Core Skills
    const mathSkill = await CoreSkill.create({ name: 'Mathematics', subSkills: ['Algebra', 'Geometry', 'Calculus'] });
    const commSkill = await CoreSkill.create({ name: 'Communication', subSkills: ['Verbal', 'Written', 'Presentation'] });
    console.log('Core Skills created.');

    // Link Categories to Core Skills (Many-to-Many)
    await mathCategory.addCoreSkill(mathSkill);
    // You might link other skills to other categories here

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();