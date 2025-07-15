// controllers/schoolController.js
const { Op } = require('sequelize');
const User = require('../models/User');
const School = require('../models/School');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const Category = require('../models/Category'); // Assuming Category is the model for job types/categories
const { sendEmail } = require('../utils/emailService'); // To notify students about shortlisting/interviews
const moment = require('moment'); // For date/time formatting and calculations

// Helper function for sending application status notifications
const sendApplicationStatusNotification = async (studentId, jobTitle, status, interviewDetails = null) => {
  const studentUser = await User.findOne({ where: { id: studentId } });
  if (!studentUser) return; // Student not found

  let message = '';
  let type = 'info';
  let link = `/student/dashboard`; // Default link

  if (status === 'shortlisted') {
    message = `Your application for '${jobTitle}' has been shortlisted by ${studentUser.name}.`;
    type = 'success';
    link = `/student/dashboard`; // Link to their shortlisted jobs section
  } else if (status === 'interview_scheduled' && interviewDetails) {
    message = `An interview for your application to '${jobTitle}' has been scheduled for ${moment(interviewDetails.date).format('MMM Do, YYYY')} at ${interviewDetails.startTime}.`;
    type = 'info';
    link = `/student/calendar`; // Link to their calendar
  } else if (status === 'rejected') {
    message = `Your application for '${jobTitle}' was not successful at this time.`;
    type = 'error';
  }

  await Notification.create({
    userId: studentUser.id,
    message,
    type,
    link
  });
};

// @desc    Get School Dashboard Metrics
// @route   GET /api/school/dashboard-metrics
// @access  School
const getSchoolDashboardMetrics = async (req, res, next) => {
  const { schoolId } = req.user.data; // schoolId from authMiddleware, assuming it attaches schoolId

  try {
    const school = await School.findOne({ where: { userId: req.user.id } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const activeJobPostings = await Job.count({
      where: { schoolId: school.id, status: 'open' }
    });

    const totalApplications = await Application.count({
      include: [{ model: Job, where: { schoolId: school.id } }]
    });

    const pendingReviews = await Application.count({
      where: { status: 'applied' }, // 'applied' implies pending review
      include: [{ model: Job, where: { schoolId: school.id } }]
    });

    res.status(200).json({
      success: true,
      message: 'School dashboard metrics fetched successfully.',
      data: {
        jobPostings: activeJobPostings,
        totalApplications: totalApplications,
        pendingReviews: pendingReviews
      }
    });

  } catch (error) {
    console.error('Error fetching school dashboard metrics:', error);
    next(error);
  }
};

// @desc    Get recent job postings by the school
// @route   GET /api/school/recent-job-postings
// @access  School
const getRecentJobPostings = async (req, res, next) => {
  const { schoolId } = req.user.data; // Assuming schoolId is directly on req.user.data after auth

  try {
    const school = await School.findOne({ where: { userId: req.user.id } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const jobs = await Job.findAll({
      where: { schoolId: school.id },
      limit: 5, // Or whatever number defines 'recent'
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, as: 'jobType', attributes: ['name'] }] // Include job type name
    });

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      school: school.name, // School name from the associated User
      location: job.location,
      jobType: job.jobType ? job.jobType.name : null,
      salary: job.minSalaryLPA + (job.maxSalaryLPA ? `-${job.maxSalaryLPA}` : '') + ' LPA',
      postedAgo: moment(job.createdAt).fromNow(), // e.g., "29 min ago"
      status: job.status === 'open' ? 'Active' : 'Closed',
      description: job.jobDescription.substring(0, 100) + '...', // Shorten description
      logo: school.logoUrl // School logo URL
    }));

    res.status(200).json({
      success: true,
      message: 'Recent job postings fetched successfully.',
      data: { jobs: formattedJobs }
    });

  } catch (error) {
    console.error('Error fetching recent job postings:', error);
    next(error);
  }
};

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  School
const createJobPost = async (req, res, next) => {
  const { id: userId } = req.user; // User ID from authenticated token
  const {
    title, type: categoryId, application_end_date, subjects,
    salary_min, salary_max, description, responsibilities, requirements, jobLevel
  } = req.body;

  try {
    const school = await School.findOne({
      where: { userId },
      include: [{ model: User, attributes: ['name'] }]
    });

    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid Job Type (Category) ID provided.' });
    }

    const newJob = await Job.create({
      schoolId: school.id,
      categoryId: categoryId,
      title,
      location: `${school.address}, ${school.city}, ${school.state}, ${school.pincode}`, // Prefilled from school profile
      applicationEndDate: application_end_date,
      subjectsToTeach: subjects,
      minSalaryLPA: salary_min,
      maxSalaryLPA: salary_max,
      jobDescription: description,
      keyResponsibilities: responsibilities,
      requirements: requirements,
      jobLevel: jobLevel || null,
      status: 'open' // Default status
    });

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: { jobId: newJob.id }
    });

  } catch (error) {
    console.error('Error creating job post:', error);
    next(error);
  }
};

// @desc    Get all job postings by the school (open/closed)
// @route   GET /api/jobs
// @access  School (can also be Student or Public depending on query params)
const getSchoolJobs = async (req, res, next) => {
  const { id: userId, role } = req.user; // Authenticated user
  const { status, category, search, limit = 10, offset = 0 } = req.query;

  let schoolId = null;
  // If the request comes from a 'school' role, filter by their jobs
  if (role === 'school') {
    const school = await School.findOne({ where: { userId } });
    if (!school) return res.status(404).json({ success: false, message: 'School profile not found.' });
    schoolId = school.id;
  } else {
    // For other roles (e.g., student viewing opportunities, admin viewing all jobs)
    // this route would be less restricted. For now, we are building School specific APIs.
    return res.status(403).json({ success: false, message: 'Forbidden: Only schools can view their own job listings here.' });
  }


  let whereClause = { schoolId };
  if (status && ['open', 'closed'].includes(status)) {
    whereClause.status = status;
  }
  if (category) { // Category is category ID (UUID)
    whereClause.categoryId = category;
  }
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { jobDescription: { [Op.iLike]: `%${search}%` } },
      { keyResponsibilities: { [Op.iLike]: `%${search}%` } },
      { requirements: { [Op.iLike]: `%${search}%` } },
      { subjectsToTeach: { [Op.contains]: [search] } } // Check if search term is in subjects array
    ];
  }

  try {
    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: School, attributes: ['logoUrl'], include: [{ model: User, attributes: ['name'] }] },
        { model: Category, as: 'jobType', attributes: ['name'] }
      ]
    });

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      school: job.School.User.name,
      location: job.location,
      jobType: job.jobType ? job.jobType.name : null,
      salary: job.minSalaryLPA + (job.maxSalaryLPA ? `-${job.maxSalaryLPA}` : '') + ' LPA',
      postedAgo: moment(job.createdAt).fromNow(),
      status: job.status === 'open' ? 'Active' : 'Closed',
      description: job.jobDescription.substring(0, 100) + '...',
      logo: job.School.logoUrl
    }));

    res.status(200).json({
      success: true,
      message: 'Job postings fetched successfully.',
      data: {
        jobs: formattedJobs,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching school jobs:', error);
    next(error);
  }
};

// @desc    Get details of a specific job posting
// @route   GET /api/jobs/:id
// @access  School (also Student/Public)
const getJobDetails = async (req, res, next) => {
  const { id } = req.params; // Job ID

  try {
    const job = await Job.findByPk(id, {
      include: [
        { model: School, attributes: ['id', 'logoUrl', 'bio', 'websiteLink', 'address', 'city', 'state', 'pincode'], include: [{ model: User, attributes: ['name'] }] },
        { model: Category, as: 'jobType', attributes: ['name'] }
      ]
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const schoolAddress = `${job.School.address}, ${job.School.city}, ${job.School.state}, ${job.School.pincode}`;

    const formattedJobDetails = {
      id: job.id,
      title: job.title,
      location: job.location, // From job posting itself
      type: job.jobType ? job.jobType.name : null, // Category name
      postedDate: moment(job.createdAt).format('Do MMMM YYYY'),
      endDate: moment(job.applicationEndDate).format('Do MMMM YYYY'),
      jobLevel: job.jobLevel || 'N/A', // Assuming jobLevel is a string or N/A
      salary: job.minSalaryLPA + (job.maxSalaryLPA ? `-${job.maxSalaryLPA}` : '') + ' LPA',
      institution: job.School.User.name, // School name
      overview: job.jobDescription,
      responsibilities: job.keyResponsibilities.split('\n').filter(Boolean), // Split by newline for array
      education: job.requirements.split('\n').filter(Boolean), // Assuming requirements can be split into education/skills
      skills: job.requirements.split('\n').filter(Boolean), // Duplicating for now, ideally needs clearer separation in model
      about: job.School.bio,
      aboutLink: job.School.websiteLink,
      logo: job.School.logoUrl,
      schoolAddress: schoolAddress // For student view
    };

    res.status(200).json({
      success: true,
      message: 'Job details fetched successfully.',
      data: { job: formattedJobDetails }
    });

  } catch (error) {
    console.error('Error fetching job details:', error);
    next(error);
  }
};

// @desc    Update a job posting status (open/closed)
// @route   PATCH /api/jobs/:id/status
// @access  School
const updateJobStatus = async (req, res, next) => {
  const { id } = req.params; // Job ID
  const { status } = req.body; // 'open' or 'closed'
  const { id: userId } = req.user; // Authenticated user ID

  try {
    const school = await School.findOne({ where: { userId } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const job = await Job.findOne({ where: { id, schoolId: school.id } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or you do not have permission to update it.' });
    }

    job.status = status;
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job status updated successfully.'
    });

  } catch (error) {
    console.error('Error updating job status:', error);
    next(error);
  }
};


// @desc    Get applicants for a specific job, categorized by status
// @route   GET /api/jobs/:id/applicants
// @access  School
const getJobApplicants = async (req, res, next) => {
  const { id: jobId } = req.params; // Job ID
  const { id: userId } = req.user;

  try {
    const school = await School.findOne({ where: { userId } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const job = await Job.findOne({ where: { id: jobId, schoolId: school.id } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or you do not have permission to view applicants for it.' });
    }

    // Fetch all applications for the job
    const applications = await Application.findAll({
      where: { jobId },
      include: [
        { model: Student, attributes: ['id', 'firstName', 'lastName', 'mobile', 'imageUrl'], include: [{ model: User, attributes: ['email'] }] },
        { model: Interview, as: 'interview' } // Include interview details if scheduled
      ]
    });

    const applicantPreviews = applications.map(app => {
      const student = app.Student;
      const user = student.User;
      return {
        id: app.id, // Application ID (frontend wants applicant id in some places, but this is an application record)
        applicantUserId: student.id, // Actual Student ID for details page
        name: `${student.firstName} ${student.lastName}`,
        email: user.email,
        phone: student.mobile,
        linkedin: null, // Not in our schema, add if needed
        status: app.status === 'applied' ? 'New Candidates' :
                (app.status === 'shortlisted' ? 'In Progress' :
                 (app.status === 'interview_scheduled' ? 'In Progress' :
                  (app.status === 'rejected' ? 'Completed' : 'Unknown'))), // Map internal status to frontend tabs
        date: moment(app.applicationDate).format('DD/MM/YYYY'),
        avatar: student.imageUrl,
        interviewDetails: app.interview ? {
          date: moment(app.interview.date).format('YYYY-MM-DD'),
          startTime: app.interview.startTime,
          endTime: app.interview.endTime,
          location: app.interview.location
        } : null
      };
    });

    // Categorize for tabs
    const allApplicants = applicantPreviews;
    const shortlistedApplicants = applicantPreviews.filter(app => ['shortlisted', 'interview_scheduled'].includes(app.status));
    const scheduledInterviews = applicantPreviews.filter(app => app.status === 'interview_scheduled');

    res.status(200).json({
      success: true,
      message: 'Applicants fetched successfully.',
      data: {
        tabs: {
          all: allApplicants,
          shortlisted: shortlistedApplicants,
          interviews: scheduledInterviews
        }
      }
    });

  } catch (error) {
    console.error('Error fetching job applicants:', error);
    next(error);
  }
};


// @desc    Update application status (shortlisted, interview_scheduled, rejected)
// @route   PATCH /api/applications/:id/status
// @access  School
const updateApplicationStatus = async (req, res, next) => {
  const { id: applicationId } = req.params; // Application ID
  const { status } = req.body; // 'shortlisted', 'interview_scheduled', 'rejected'
  const { id: userId } = req.user; // Authenticated user ID

  try {
    const school = await School.findOne({ where: { userId } });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, where: { schoolId: school.id } }, { model: Student }] // Ensure school owns the job
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or you do not have permission to update it.' });
    }

    // Prevent re-shortlisting if already shortlisted/interviewed
    if (application.status === 'interview_scheduled' && status === 'shortlisted') {
      return res.status(400).json({ success: false, message: 'Cannot mark as shortlisted if interview is already scheduled.' });
    }
    // Prevent scheduling interview if not shortlisted first (optional rule)
    if (status === 'interview_scheduled' && application.status === 'applied') {
        // You might want to automatically shortlist here, or return an error
        return res.status(400).json({ success: false, message: 'Cannot schedule interview for non-shortlisted applicant. Please shortlist first.' });
    }


    application.status = status;
    await application.save();

    // Send notification to student
    await sendApplicationStatusNotification(application.Student.userId, application.Job.title, status);

    res.status(200).json({
      success: true,
      message: 'Application status updated.'
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    next(error);
  }
};

// @desc    Schedule an interview for an applicant
// @route   POST /api/applications/:id/schedule
// @access  School
const scheduleInterview = async (req, res, next) => {
  const { id: applicationId } = req.params;
  const { title, date, startTime, endTime } = req.body;
  const { id: userId } = req.user;

  try {
    const school = await School.findOne({
      where: { userId },
      attributes: ['address', 'city', 'state', 'pincode'] // Fetch school address for location
    });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School profile not found.' });
    }

    const application = await Application.findByPk(applicationId, {
      include: [{ model: Job, where: { schoolId: school.id } }, { model: Student }] // Ensure school owns the job
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or you do not have permission for this action.' });
    }
    if (application.status !== 'shortlisted' && application.status !== 'interview_scheduled') {
        return res.status(400).json({ success: false, message: 'Interview can only be scheduled for shortlisted applicants.' });
    }

    const interviewLocation = `${school.address}, ${school.city}, ${school.state}, ${school.pincode}`;

    // Check if an interview already exists for this application
    const existingInterview = await Interview.findOne({ where: { applicationId } });

    if (existingInterview) {
      // Update existing interview
      await existingInterview.update({
        title,
        date,
        startTime,
        endTime,
        location: interviewLocation
      });
      // Optionally re-send notification or specific update notification
      await sendApplicationStatusNotification(application.Student.userId, application.Job.title, 'interview_scheduled', { date, startTime, endTime, location: interviewLocation });

      return res.status(200).json({
        success: true,
        message: 'Interview updated successfully.'
      });
    } else {
      // Create new interview
      await Interview.create({
        applicationId,
        title,
        date,
        startTime,
        endTime,
        location: interviewLocation
      });
      // Update application status to 'interview_scheduled'
      application.status = 'interview_scheduled';
      await application.save();

      // Send notification to student
      await sendApplicationStatusNotification(application.Student.userId, application.Job.title, 'interview_scheduled', { date, startTime, endTime, location: interviewLocation });

      return res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully.'
      });
    }

  } catch (error) {
    console.error('Error scheduling interview:', error);
    next(error);
  }
};

// @desc    Get a student's full profile (when school views applicant details)
// @route   GET /api/applicants/:id
// @access  School
const getApplicantDetails = async (req, res, next) => {
  const { id: studentId } = req.params; // Frontend sends student ID here

  try {
    const student = await Student.findByPk(studentId, {
      include: [
        { model: User, attributes: ['email'] },
        { model: Education, as: 'educations', separate: true, order: [['endYear', 'DESC'], ['startYear', 'DESC']] },
        { model: Certification, as: 'certifications', separate: true, order: [['dateReceived', 'DESC']] },
        {
            model: StudentCoreSkillAssessment,
            as: 'coreSkillAssessments',
            include: [{ model: CoreSkill, attributes: ['name', 'subSkills'] }]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Applicant (Student) not found.' });
    }

    const user = student.User;

    // Map core skills to the frontend's expected format
    const formattedCoreSkills = student.coreSkillAssessments.map(assessment => {
      const totalObtained = Object.values(assessment.subSkillMarks).reduce((sum, mark) => sum + mark, 0);
      const totalPossible = assessment.CoreSkill.subSkills.length * 10; // Each subskill is out of 10

      return {
        name: assessment.CoreSkill.name,
        score: { obtained: totalObtained, total: totalPossible },
        subSkills: assessment.CoreSkill.subSkills.map(subName => ({
          name: subName,
          score: { obtained: assessment.subSkillMarks[subName] || 0, total: 10 }
        }))
      };
    });

    const formattedCertifications = student.certifications.map(cert => ({
      title: cert.name,
      issuer: cert.issuedBy,
      year: moment(cert.dateReceived).year(),
      status: cert.hasExpiry && moment(cert.expiryDate).isBefore(moment()) ? 'Expired' : 'Active'
    }));

    const formattedEducation = student.educations.map(edu => ({
      degree: edu.courseName,
      institution: edu.collegeName,
      graduationYear: edu.endYear,
      gpa: edu.gpa
    }));


    const fullProfile = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      position: 'Not specified', // Placeholder, needs to be derived or added to Student model
      email: user.email,
      phone: student.mobile,
      location: 'Not specified', // Placeholder, needs to be derived from address if we add one to Student model
      tags: student.skills.slice(0, 3), // Top 3 skills
      experience: [], // Not in schema yet, will be empty
      education: formattedEducation.length > 0 ? formattedEducation[0] : null, // Frontend wants a single object for "education"
      // If frontend needs full array of educations, we need to clarify which field is for what.
      // For now, providing the latest/primary one.
      allEducations: formattedEducation, // Sending all for clarity in backend response

      certifications: formattedCertifications,
      coreSkills: formattedCoreSkills,
      academicSkills: student.skills, // All user-added skills are academic skills here
      publications: [], // Not in schema yet, will be empty
      imageUrl: student.imageUrl // Profile image URL
    };

    res.status(200).json({
      success: true,
      message: 'Applicant profile fetched successfully.',
      data: { applicant: fullProfile }
    });

  } catch (error) {
    console.error('Error fetching applicant details:', error);
    next(error);
  }
};


module.exports = {
  getSchoolDashboardMetrics,
  getRecentJobPostings,
  createJobPost,
  getSchoolJobs,
  getJobDetails,
  updateJobStatus,
  getJobApplicants,
  updateApplicationStatus,
  scheduleInterview,
  getApplicantDetails
};