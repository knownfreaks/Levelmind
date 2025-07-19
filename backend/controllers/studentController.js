// controllers/studentController.js
const { Op } = require('sequelize');
const { User, Student, School, Job, Application, Interview, Notification, Category, CoreSkill, StudentCoreSkillAssessment, Education, Certification, HelpRequest } = require('../config/database');
const moment = require('moment'); // For date/time formatting and calculations
const path = require('path'); // Needed for path.basename <--- ENSURE THIS IS PRESENT

// New constant for static files base URL
const STATIC_FILES_BASE_URL = process.env.STATIC_FILES_BASE_URL;

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Student
const getStudentDashboard = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const student = await Student.findOne({
      where: { userId },
      include: [
        { model: User, attributes: ['email', 'name'] },
        {
          model: StudentCoreSkillAssessment,
          as: 'coreSkillAssessments',
          include: [{ model: CoreSkill, attributes: ['name', 'subSkills'] }]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const shortlistedApplications = await Application.findAll({
      where: {
        studentId: student.id,
        status: { [Op.in]: ['shortlisted', 'interview_scheduled'] }
      },
      include: [
        {
          model: Job,
          attributes: ['id', 'title', 'location', 'applicationEndDate', 'minSalaryLPA', 'maxSalaryLPA', 'jobDescription'],
          include: [
            { model: School, attributes: ['logoUrl'], include: [{ model: User, attributes: ['name'] }] },
            { model: Category, as: 'jobType', attributes: ['name'] }
          ]
        }
      ]
    });

    const formattedShortlistedJobs = shortlistedApplications.map(app => ({
      id: app.Job.id,
      title: app.Job.title,
      school: app.Job.School.User.name,
      location: app.Job.location,
      jobType: app.Job.jobType ? app.Job.jobType.name : null,
      salary: app.Job.minSalaryLPA + (app.Job.maxSalaryLPA ? `-${app.Job.maxSalaryLPA}` : '') + ' LPA',
      postedAgo: moment(app.Job.createdAt).fromNow(),
      status: app.status === 'shortlisted' ? 'Shortlisted' : 'Interview Scheduled',
      description: app.Job.jobDescription.substring(0, 100) + '...',
      // Correctly format logoUrl using STATIC_FILES_BASE_URL
      logo: app.Job.School.logoUrl ? `${STATIC_FILES_BASE_URL}/profiles/${path.basename(app.Job.School.logoUrl)}` : null // <--- CORRECTED
    }));

    const formattedCoreSkillsSummary = student.coreSkillAssessments.map(assessment => ({
      name: assessment.CoreSkill.name,
      totalScore: assessment.totalScore,
      maxScore: assessment.CoreSkill.subSkills.length * 10
    }));

    const recentActivities = await Notification.findAll({
        where: { userId },
        limit: 5,
        order: [['createdAt', 'DESC']]
    });

    const formattedRecentActivities = recentActivities.map(notif => ({
        text: notif.message,
        type: notif.type,
        timestamp: notif.createdAt
    }));


    res.status(200).json({
      success: true,
      message: 'Student dashboard data fetched successfully.',
      data: {
        profile: {
          name: student.firstName ? `${student.firstName} ${student.lastName}` : student.User.name,
          email: student.User.email,
          // Correctly format imageUrl for student's own photo
          photo: student.imageUrl ? `${STATIC_FILES_BASE_URL}/profiles/${path.basename(student.imageUrl)}` : null, // <--- CORRECTED
          topSkills: student.skills.slice(0, 3),
          recentActivities: formattedRecentActivities,
          coreSkillsSummary: formattedCoreSkillsSummary,
        },
        shortlistedJobs: formattedShortlistedJobs
      }
    });

  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    next(error);
  }
};

// @desc    Get job opportunities matching student's core skills
// @route   GET /api/student/jobs
// @access  Student
const getAvailableJobs = async (req, res, next) => {
  const { id: userId } = req.user;
  const { category, min_salary_lpa, max_salary_lpa, location, search, limit = 10, offset = 0 } = req.query;

  try {
    const student = await Student.findOne({
      where: { userId },
      include: [
        {
          model: StudentCoreSkillAssessment,
          as: 'coreSkillAssessments',
          include: [{ model: CoreSkill, attributes: ['id'] }]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const studentCoreSkillIds = student.coreSkillAssessments.map(s => s.CoreSkill.id);

    const matchingCategories = await Category.findAll({
      where: {
        coreSkillIds: { [Op.contains]: studentCoreSkillIds }
      },
      attributes: ['id']
    });

    const matchingCategoryIds = matchingCategories.map(cat => cat.id);

    let whereClause = {
      status: 'open',
      applicationEndDate: { [Op.gte]: moment().format('YYYY-MM-DD') },
      categoryId: { [Op.in]: matchingCategoryIds }
    };

    if (category) {
      whereClause.categoryId = category;
    }
    if (min_salary_lpa) {
      whereClause.minSalaryLPA = { [Op.gte]: parseFloat(min_salary_lpa) };
    }
    if (max_salary_lpa) {
      whereClause.maxSalaryLPA = { [Op.lte]: parseFloat(max_salary_lpa) };
    }
    if (location) {
      whereClause.location = { [Op.iLike]: `%${location}%` };
    }
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { jobDescription: { [Op.iLike]: `%${search}%` } },
        { keyResponsibilities: { [Op.iLike]: `%${search}%` } },
        { requirements: { [Op.iLike]: `%${search}%` } },
        { subjectsToTeach: { [Op.contains]: [search] } }
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: School, attributes: ['logoUrl', 'bio', 'websiteLink', 'address', 'city', 'state', 'pincode'], include: [{ model: User, attributes: ['name'] }] },
        { model: Category, as: 'jobType', attributes: ['name'] }
      ]
    });

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      // Correctly format school_logo using STATIC_FILES_BASE_URL
      school_logo: job.School.logoUrl ? `${STATIC_FILES_BASE_URL}/profiles/${path.basename(job.School.logoUrl)}` : null, // <--- CORRECTED
      title: job.title,
      school_name: job.School.User.name,
      school_address: `${job.School.address}, ${job.School.city}, ${job.School.state}, ${job.School.pincode}`,
      job_description: job.jobDescription,
      key_responsibilities: job.keyResponsibilities,
      requirements: job.requirements,
      job_type: job.jobType ? job.jobType.name : null,
      application_end_date: moment(job.applicationEndDate).format('YYYY-MM-DD'),
      salary_range: job.minSalaryLPA + (job.maxSalaryLPA ? `-${job.maxSalaryLPA}` : '') + ' LPA',
      school_bio: job.School.bio,
      school_link: job.School.websiteLink
    }));

    res.status(200).json({
      success: true,
      message: 'Job opportunities fetched successfully.',
      data: {
        availableJobs: formattedJobs,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching available jobs:', error);
    next(error);
  }
};


// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Student
const applyForJob = async (req, res, next) => {
  const { id: jobId } = req.params;
  const { id: userId } = req.user;
  const {
    firstName, middleName, lastName, email, phone,
    coverLetter, experience, availability
  } = req.body;
  // resumeUrl is stored as a relative path by multer, no need to prepend STATIC_FILES_BASE_URL here
  const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : null;

  try {
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const job = await Job.findByPk(jobId, { include: [{ model: School, include: [{ model: User, attributes: ['id', 'email'] }] }] });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.status === 'closed' || moment(job.applicationEndDate).isBefore(moment())) {
      return res.status(400).json({ success: false, message: 'Applications for this job are closed.' });
    }

    const existingApplication = await Application.findOne({
      where: { studentId: student.id, jobId }
    });
    if (existingApplication) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }

    await Application.create({
      studentId: student.id,
      jobId,
      coverLetter,
      experience,
      availability,
      resumeUrl, // This is the relative path stored in DB
      applicationDate: moment().format('YYYY-MM-DD'),
      status: 'applied'
    });

    if (job.School && job.School.User) {
        await Notification.create({
            userId: job.School.User.id,
            message: `A new student (${student.firstName} ${student.lastName}) applied to your '${job.title}' job.`,
            type: 'info',
            link: `/school/jobs/${job.id}/applicants`
        });
    }


    res.status(200).json({
      success: true,
      message: 'Applied successfully. You will be notified of updates.'
    });

  } catch (error) {
    console.error('Error applying for job:', error);
    if (resumeUrl && fs.existsSync(path.join(__dirname, '..', resumeUrl))) {
      fs.unlink(path.join(__dirname, '..', resumeUrl), (err) => {
        if (err) console.error('Error deleting uploaded resume after application error:', err);
      });
    }
    next(error);
  }
};

// @desc    Get student's scheduled interviews
// @route   GET /api/student/calendar
// @access  Student
const getStudentCalendar = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    let whereClause = { studentId: student.id, status: 'interview_scheduled' };

    const interviews = await Application.findAll({
      where: whereClause,
      include: [
        { model: Interview, as: 'interview' },
        { model: Job, attributes: ['title'], include: [{ model: School, include: [{ model: User, attributes: ['name'] }] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedInterviews = interviews.filter(app => app.interview).map(app => ({
      id: app.interview.id,
      title: app.interview.title,
      schoolName: app.Job.School.User.name,
      date: app.interview.date,
      startTime: app.interview.startTime,
      endTime: app.interview.endTime,
      location: app.interview.location
    }));

    res.status(200).json({
      success: true,
      message: 'Scheduled interviews fetched successfully.',
      data: { interviews: formattedInterviews }
    });

  } catch (error) {
    console.error('Error fetching student calendar:', error);
    next(error);
  }
};

// @desc    Get student's own profile details
// @route   GET /api/student/profile
// @access  Student
const getStudentProfile = async (req, res, next) => {
  const { id: userId } = req.user;

  try {
    const student = await Student.findOne({
      where: { userId },
      include: [
        { model: User, attributes: ['email', 'name'] },
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
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const user = student.User;

    const formattedCoreSkills = student.coreSkillAssessments.map(assessment => {
      const totalObtained = Object.values(assessment.subSkillMarks).reduce((sum, mark) => sum + mark, 0);
      const totalPossible = assessment.CoreSkill.subSkills.length * 10;
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
      id: cert.id,
      name: cert.name,
      issuedBy: cert.issuedBy,
      description: cert.description,
      dateReceived: cert.dateReceived,
      hasExpiry: cert.hasExpiry,
      expiryDate: cert.expiryDate,
      certificateLink: cert.certificateLink ? `${STATIC_FILES_BASE_URL}/certificates/${path.basename(cert.certificateLink)}` : null,
      status: cert.hasExpiry && moment(cert.expiryDate).isBefore(moment()) ? 'Expired' : 'Active'
    }));

    const formattedEducation = student.educations.map(edu => ({
      id: edu.id,
      collegeName: edu.collegeName,
      universityName: edu.universityName,
      courseName: edu.courseName,
      startYear: edu.startYear,
      endYear: edu.endYear,
      gpa: edu.gpa
    }));

    res.status(200).json({
      success: true,
      message: 'Student profile fetched successfully.',
      data: {
        profile: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: user.email,
          mobile: student.mobile,
          about: student.about,
          imageUrl: student.imageUrl ? `${STATIC_FILES_BASE_URL}/profiles/${path.basename(student.imageUrl)}` : null,
          resumeUrl: student.resumeUrl ? `${STATIC_FILES_BASE_URL}/resumes/${path.basename(student.resumeUrl)}` : null,
          education: formattedEducation,
          certifications: formattedCertifications,
          skills: student.skills,
          core_skills: formattedCoreSkills,
        }
      }
    });

  } catch (error) {
    console.error('Error fetching student profile:', error);
    next(error);
  }
};

// @desc    Update student's own profile details
// @route   PATCH /api/student/profile
// @access  Student
const updateStudentProfile = async (req, res, next) => {
  const { id: userId } = req.user;
  const profileData = req.body;
  const newImageUrl = req.file ? `/uploads/profiles/${req.file.filename}` : null;

  try {
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    await student.update({
      firstName: profileData.firstName || student.firstName,
      lastName: profileData.lastName || student.lastName,
      mobile: profileData.mobile || student.mobile,
      about: profileData.about !== undefined ? profileData.about : student.about,
      imageUrl: newImageUrl || student.imageUrl,
      skills: profileData.skills || student.skills
    });

    if (profileData.education !== undefined) {
      const existingEduIds = (await Education.findAll({
        where: { studentId: student.id },
        attributes: ['id']
      })).map(e => e.id);

      const incomingEduIds = profileData.education.map(edu => edu.id).filter(Boolean);

      const educationsToDelete = existingEduIds.filter(id => !incomingEduIds.includes(id));
      if (educationsToDelete.length > 0) {
        await Education.destroy({ where: { id: { [Op.in]: educationsToDelete } } });
      }

      for (const eduData of profileData.education) {
        if (eduData.id) {
          await Education.update(eduData, { where: { id: eduData.id, studentId: student.id } });
        } else {
          await Education.create({ ...eduData, studentId: student.id });
        }
      }
    }

    if (profileData.certifications !== undefined) {
      const existingCertIds = (await Certification.findAll({
        where: { studentId: student.id },
        attributes: ['id']
      })).map(c => c.id);

      const incomingCertIds = profileData.certifications.map(cert => cert.id).filter(Boolean);

      const certificationsToDelete = existingCertIds.filter(id => !incomingCertIds.includes(id));
      if (certificationsToDelete.length > 0) {
        await Certification.destroy({ where: { id: { [Op.in]: certificationsToDelete } } });
      }

      for (const certData of profileData.certifications) {
        if (certData.id) {
          await Certification.update(certData, { where: { id: certData.id, studentId: student.id } });
        } else {
          await Certification.create({ ...certData, studentId: student.id });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.'
    });

  } catch (error) {
    console.error('Error updating student profile:', error);
    if (newImageUrl && fs.existsSync(path.join(__dirname, '..', newImageUrl))) {
        fs.unlink(path.join(__dirname, '..', newImageUrl), (err) => {
            if (err) console.error('Error deleting uploaded profile image after update failure:', err);
        });
    }
    next(error);
  }
};


module.exports = {
  getStudentDashboard,
  getAvailableJobs,
  applyForJob,
  getStudentCalendar,
  getStudentProfile,
  updateStudentProfile
};