    // controllers/adminController.js
    const { Op } = require('sequelize');
    const User = require('../models/User');
    const School = require('../models/School');
    const Student = require('../models/Student');
    const CoreSkill = require('../models/CoreSkill');
    const StudentCoreSkillAssessment = require('../models/StudentCoreSkillAssessment');
    const Category = require('../models/Category');
    const Notification = require('../models/Notification');
    const HelpRequest = require('../models/HelpRequest');
    const Job = require('../models/Job');
    const { hashPassword } = require('../utils/passwordUtils');
    const { sendEmail } = require('../utils/emailService');
    const path = require('path');
    const fs = require('fs');
    const xlsx = require('xlsx');
    const validator = require('validator');

    // Helper function to remove file if error occurs during bulk upload parsing
    const cleanupUploadedFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file during bulk import cleanup:', err);
        });
      }
    };

    // @desc    Get Admin Dashboard Metrics
    // @route   GET /api/admin/dashboard
    // @access  Admin
    const getAdminDashboard = async (req, res, next) => {
      try {
        const totalUsers = await User.count();
        const totalSchools = await User.count({ where: { role: 'school' } });
        const totalStudents = await User.count({ where: { role: 'student' } });
        const activeJobs = await Job.count({ where: { status: 'open' } });
        const pendingHelpRequests = await HelpRequest.count({ where: { status: 'open' } });

        const recentActivities = await Promise.all([
          HelpRequest.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['name', 'email', 'role'] }]
          }),
          User.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['name', 'email', 'role']
          })
        ]);

        const formattedRecentActivity = [
          ...recentActivities[0].map(req => ({
            text: `New help request from ${req.User.name} (${req.User.role}): "${req.subject.substring(0, 50)}..."`,
            type: 'info',
            timestamp: req.createdAt,
            link: `/admin/help/${req.id}`
          })),
          ...recentActivities[1].map(user => ({
            text: `New ${user.role} registered: ${user.name} (${user.email})`,
            type: 'success',
            timestamp: user.createdAt,
            link: `/admin/users?role=${user.role}`
          }))
        ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

        res.status(200).json({
          success: true,
          message: 'Admin dashboard metrics fetched successfully.',
          data: {
            metrics: {
              totalUsers,
              totalSchools,
              totalStudents,
              activeJobs,
              pendingHelpRequests
            },
            recentActivity: formattedRecentActivity
          }
        });

      } catch (error) {
        console.error('Error fetching admin dashboard:', error);
        next(error);
      }
    };

    // @desc    Get all users (students or schools)
    // @route   GET /api/admin/users
    // @access  Admin
    const getUsers = async (req, res, next) => {
      const { role, limit = 10, offset = 0 } = req.query;

      let queryOptions = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'email', 'name', 'role', 'isOnboardingComplete']
      };

      if (role && ['student', 'school', 'admin'].includes(role)) {
        queryOptions.where = { role };
      } else if (role) {
        return res.status(400).json({ success: false, message: 'Invalid role specified. Must be "student", "school", or "admin".' });
      }

      try {
        const { count, rows: users } = await User.findAndCountAll(queryOptions);

        const userPreviews = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          onboarding_complete: user.isOnboardingComplete
        }));

        res.status(200).json({
          success: true,
          message: 'Users fetched successfully.',
          data: {
            users: userPreviews,
            totalCount: count,
            totalPages: Math.ceil(count / limit),
            currentPage: Math.floor(offset / limit) + 1
          }
        });

      } catch (error) {
        console.error('Error fetching users:', error);
        next(error);
      }
    };

    // @desc    Bulk create users (student/school) from Excel file
    // @route   POST /api/admin/users/bulk-create
    // @access  Admin
    const bulkCreateUsers = async (req, res, next) => {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const { role } = req.body;

      if (!role || !['student', 'school'].includes(role)) {
        cleanupUploadedFile(req.file.path);
        return res.status(400).json({ success: false, message: 'Invalid or missing user role for bulk creation (must be "student" or "school").' });
      }

      const filePath = req.file.path;
      let workbook;
      let data;
      try {
        workbook = xlsx.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
      } catch (parseError) {
        cleanupUploadedFile(filePath);
        return res.status(400).json({ success: false, message: 'Failed to parse Excel file. Ensure it is a valid .xlsx or .xls format.' });
      }


      let uploadedCount = 0;
      let failedCount = 0;
      const failedDetails = [];
      const successfulEmails = [];

      try {
        for (const row of data) {
          const name = row.Name || row.name;
          const email = row.Email || row.email;

          if (!name || !email || !validator.isEmail(email)) {
            failedCount++;
            failedDetails.push({ email: email || 'N/A', reason: 'Missing name/email or invalid email format.' });
            continue;
          }

          try {
            let user = await User.findOne({ where: { email } });
            if (user) {
              failedCount++;
              failedDetails.push({ email, reason: 'User with this email already exists.' });
              continue;
            }

            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await hashPassword(tempPassword);

            user = await User.create({
              name,
              email,
              password: hashedPassword,
              role,
              isOnboardingComplete: false
            });

            if (role === 'student') {
              await Student.create({ userId: user.id });
            } else {
              await School.create({ userId: user.id });
            }

            const loginLink = `${req.protocol}://${req.get('host')}/login`;
            const emailSubject = role === 'student' ? 'Your Student Account Details' : 'Your School Account Details';
            const emailContent = `
              <h1>Welcome to Levelminds!</h1>
              <p>A ${role} profile has been created for you/your institution by the admin.</p>
              <p>Your login details are:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p>Please log in <a href="${loginLink}">here</a> and complete your profile.</p>
            `;
            await sendEmail(email, emailSubject, emailContent);
            successfulEmails.push(email);
            uploadedCount++;

          } catch (innerError) {
            console.error(`Error processing row for ${email}:`, innerError.message);
            failedCount++;
            failedDetails.push({ email, reason: innerError.message });
          }
        }

        res.status(200).json({
          success: true,
          message: `Bulk user creation process completed. Successfully created ${uploadedCount} users.`,
          data: {
            uploaded_count: uploadedCount,
            failed_count: failedCount,
            failed_details: failedDetails,
            successful_emails: successfulEmails
          }
        });

      } catch (error) {
        console.error('Bulk user creation fatal error:', error);
        next(error);
      } finally {
        cleanupUploadedFile(filePath);
      }
    };

    // @desc    Admin changes a user's password
    // @route   PATCH /api/admin/users/:id/password
    // @access  Admin
    const updateUserPasswordByAdmin = async (req, res, next) => {
      const { id } = req.params;
      const { newPassword } = req.body;

      try {
        const user = await User.findByPk(id);

        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const hashedPassword = await hashPassword(newPassword);

        user.password = hashedPassword;
        await user.save();

        const emailSubject = 'Your Password Has Been Changed by an Administrator';
        const emailContent = `
          <h1>Password Change Notification</h1>
          <p>Dear ${user.name},</p>
          <p>Your password for the Levelminds platform has been reset by an administrator.</p>
          <p>Your new password is: <strong>${newPassword}</strong></p>
          <p>For security reasons, we recommend logging in and changing this temporary password immediately.</p>
          <p>If you did not request this change or have any concerns, please contact support.</p>
          <p>Thank you,</p>
          <p>The Levelminds Team</p>
        `;
        await sendEmail(user.email, emailSubject, emailContent);


        res.status(200).json({
          success: true,
          message: 'User password updated successfully and notification sent.'
        });

      } catch (error) {
        console.error('Error updating user password by admin:', error);
        next(error);
      }
    };

    // @desc    Delete a user (student or school) by ID
    // @route   DELETE /api/admin/users/:id
    // @access  Admin
    const deleteUser = async (req, res, next) => {
      const { id } = req.params;
      const { id: adminUserId } = req.user;

      try {
        const userToDelete = await User.findByPk(id);

        if (!userToDelete) {
          return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (userToDelete.role === 'admin') {
          return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete an admin user.' });
        }

        if (userToDelete.id === adminUserId) {
          return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete your own admin account.' });
        }

        await userToDelete.destroy();

        res.status(200).json({
          success: true,
          message: `User '${userToDelete.email}' and all associated data deleted successfully.`
        });

      } catch (error) {
        console.error('Error deleting user by admin:', error);
        next(error);
      }
    };


    // @desc    Bulk uploads core skill marks for students from an Excel file.
    // @route   POST /api/admin/skills/:coreSkillId/bulk-marks-upload
    // @access  Admin
    const bulkUploadStudentCoreSkillMarks = async (req, res, next) => {
      const { coreSkillId } = req.params;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded. Please upload an Excel or CSV file.' });
      }

      const filePath = req.file.path;
      let workbook;
      let data;
      try {
        workbook = xlsx.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
      } catch (parseError) {
        cleanupUploadedFile(filePath);
        return res.status(400).json({ success: false, message: 'Failed to parse file. Ensure it is a valid Excel (.xlsx, .xls) or CSV (.csv) format.' });
      }

      let uploadedCount = 0;
      let failedCount = 0;
      const failedDetails = [];
      const successfulUpdates = [];

      try {
        const coreSkill = await CoreSkill.findByPk(coreSkillId);
        if (!coreSkill) {
          cleanupUploadedFile(filePath);
          return res.status(404).json({ success: false, message: 'Core skill not found for the provided ID.' });
        }
        const definedSubSkills = new Set(coreSkill.subSkills);

        for (const row of data) {
          const studentEmail = row.Email || row.email;
          const studentNameInFile = row.Name || row.name;

          if (!studentEmail || !validator.isEmail(studentEmail)) {
            failedCount++;
            failedDetails.push({ row: row, reason: 'Missing or invalid student email.' });
            continue;
          }

          try {
            const user = await User.findOne({ where: { email: studentEmail } });
            if (!user || user.role !== 'student') {
              failedCount++;
              failedDetails.push({ email: studentEmail, reason: 'User not found or is not a student profile.' });
              continue;
            }

            const student = await Student.findOne({ where: { userId: user.id } });
            if (!student) {
              failedCount++;
              failedDetails.push({ email: studentEmail, reason: 'Student profile not found for this user (incomplete onboarding?).' });
              continue;
            }

            const subSkillMarks = {};
            let rowHasValidMarks = false;

            for (const subName of coreSkill.subSkills) {
              const mark = row[subName];
              if (mark !== undefined && typeof mark === 'number' && mark >= 0 && mark <= 10) {
                subSkillMarks[subName] = mark;
                rowHasValidMarks = true;
              } else if (mark !== undefined && typeof mark !== 'number') {
                 console.warn(`Warning: Invalid mark type for subskill '${subName}' for student ${studentEmail}. Value: ${mark}`);
              }
            }

            if (!rowHasValidMarks || Object.keys(subSkillMarks).length !== coreSkill.subSkills.length) {
                failedCount++;
                failedDetails.push({ email: studentEmail, reason: 'No valid marks or not all defined subskills found in the row for this core skill.' });
                continue;
            }

            const [assessment, created] = await StudentCoreSkillAssessment.findOrCreate({
              where: { studentId: student.id, coreSkillId: coreSkill.id },
              defaults: { subSkillMarks: subSkillMarks }
            });

            if (!created) {
              await assessment.update({ subSkillMarks: subSkillMarks });
            }
            successfulUpdates.push(studentEmail);
            uploadedCount++;

          } catch (innerError) {
            console.error(`Error processing row for email ${studentEmail}:`, innerError.message);
            failedCount++;
            failedDetails.push({ email: studentEmail, reason: `Processing error: ${innerError.message}` });
          }
        }

        res.status(200).json({
          success: true,
          message: `Bulk upload for core skill marks completed. Successfully updated ${uploadedCount} student profiles.`,
          data: {
            coreSkillName: coreSkill.name,
            uploaded_count: uploadedCount,
            failed_count: failedCount,
            failed_details: failedDetails,
            successful_updates: successfulUpdates
          }
        });

      } catch (error) {
        console.error('Bulk core skill marks upload fatal error:', error);
        next(error);
      } finally {
        cleanupUploadedFile(filePath);
      }
    };


    // @desc    Create a new core skill
    // @route   POST /api/admin/skills
    // @access  Admin
    const createCoreSkill = async (req, res, next) => {
      const { name, subskills } = req.body;

      try {
        const existingSkill = await CoreSkill.findOne({ where: { name } });
        if (existingSkill) {
          return res.status(409).json({ success: false, message: 'Core skill with this name already exists.' });
        }

        const coreSkill = await CoreSkill.create({ name, subSkills: subskills });

        res.status(201).json({
          success: true,
          message: 'Core skill created successfully.',
          data: { skill_id: coreSkill.id, name: coreSkill.name, subskills: coreSkill.subSkills }
        });
      } catch (error) {
        console.error('Error creating core skill:', error);
        next(error);
      }
    };

    // @desc    Get all core skills
    // @route   GET /api/admin/skills
    // @access  Admin
    const getCoreSkills = async (req, res, next) => {
      try {
        const coreSkills = await CoreSkill.findAll({
          attributes: ['id', 'name', 'subSkills'],
          order: [['name', 'ASC']]
        });

        const categoriesWithSkills = await Promise.all(coreSkills.map(async (skill) => {
          return {
            id: skill.id,
            name: skill.name,
            subskills: skill.subSkills
          };
        }));


        res.status(200).json({
          success: true,
          message: 'Core skills fetched successfully.',
          data: {
            skills: categoriesWithSkills
          }
        });
      } catch (error) {
        console.error('Error fetching core skills:', error);
        next(error);
      }
    };

    // @desc    Create a new category (job type)
    // @route   POST /api/admin/categories
    // @access  Admin
    const createCategory = async (req, res, next) => {
      const { name, skills: coreSkillIds } = req.body;

      try {
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory) {
          return res.status(409).json({ success: false, message: 'Category with this name already exists.' });
        }

        if (coreSkillIds && coreSkillIds.length > 0) {
          const existingCoreSkills = await CoreSkill.findAll({
            where: { id: { [Op.in]: coreSkillIds } }
          });
          if (existingCoreSkills.length !== coreSkillIds.length) {
            return res.status(400).json({ success: false, message: 'One or more provided core skill IDs are invalid.' });
          }
        }

        const category = await Category.create({ name, coreSkillIds });

        res.status(201).json({
          success: true,
          message: 'Category created successfully.',
          data: { category_id: category.id, name: category.name, skills: category.coreSkillIds }
        });
      } catch (error) {
        console.error('Error creating category:', error);
        next(error);
      }
    };

    // @desc    Get all categories (job types)
    // @route   GET /api/admin/categories
    // @access  Admin
    const getCategories = async (req, res, next) => {
      try {
        const categories = await Category.findAll({
          attributes: ['id', 'name', 'coreSkillIds'],
          order: [['name', 'ASC']]
        });

        const categoriesWithSkills = await Promise.all(categories.map(async (cat) => {
          const skillsDetails = await CoreSkill.findAll({
            where: { id: { [Op.in]: cat.coreSkillIds } },
            attributes: ['id', 'name']
          });
          return {
            id: cat.id,
            name: cat.name,
            coreSkillIds: cat.coreSkillIds,
            skills: skillsDetails.map(s => ({ id: s.id, name: s.name }))
          };
        }));

        res.status(200).json({
          success: true,
          message: 'Categories fetched successfully.',
          data: {
            categories: categoriesWithSkills
          }
        });
      } catch (error) {
        console.error('Error fetching categories:', error);
        next(error);
      }
    };

    // @desc    Upload core skill marks for a student
    // @route   POST /api/admin/skills/:studentId/marks
    // @access  Admin
    const uploadStudentCoreSkillMarks = async (req, res, next) => {
      const { userId } = req.params; // <--- MODIFIED: Get userId from URL parameter
      const { skill_id: coreSkillId, subskills } = req.body;

      // --- DEBUGGING START ---
      console.log('DEBUG: Entering uploadStudentCoreSkillMarks function');
      console.log('DEBUG: userId from URL params:', userId); // <--- MODIFIED LOG
      console.log('DEBUG: coreSkillId from request body:', coreSkillId);
      console.log('DEBUG: subskills from request body:', subskills);
      // --- DEBUGGING END ---

      try {
        // 1. Verify user exists and is a student
        // --- DEBUGGING START ---
        console.log(`DEBUG: Attempting to find User with ID: ${userId}`);
        // --- DEBUGGING END ---
        const user = await User.findByPk(userId);

        if (!user || user.role !== 'student') { // Check if user exists AND is a student
          // --- DEBUGGING START ---
          console.log(`DEBUG: User with ID ${userId} NOT found or is not a student.`);
          // --- DEBUGGING END ---
          return res.status(400).json({ success: false, message: 'Provided ID does not belong to a student user.' });
        }

        // --- DEBUGGING START ---
        console.log(`DEBUG: User found and is student: ${user.email}, Role: ${user.role}`);
        console.log(`DEBUG: Attempting to find Student profile for userId: ${userId}`);
        // --- DEBUGGING END ---
        // 2. Find the associated student profile
        const student = await Student.findOne({ where: { userId: user.id } }); // <--- MODIFIED: Find Student by userId

        if (!student) {
          // This should ideally not happen if user.role is 'student' and onboarding is done, but good safeguard
          console.log(`DEBUG: Student profile NOT found for userId ${userId}.`);
          return res.status(404).json({ success: false, message: 'Student profile not found for this user. Please ensure student onboarding is complete.' });
        }

        // --- DEBUGGING START ---
        console.log(`DEBUG: Student profile found: ${student.firstName} ${student.lastName} (Student ID: ${student.id})`); // <--- MODIFIED LOG
        console.log(`DEBUG: Attempting to find CoreSkill with ID: ${coreSkillId}`);
        // --- DEBUGGING END ---
        // 3. Verify core skill exists
        const coreSkill = await CoreSkill.findByPk(coreSkillId);
        if (!coreSkill) {
          // --- DEBUGGING START ---
          console.log(`DEBUG: CoreSkill with ID ${coreSkillId} NOT found.`);
          // --- DEBUGGING END ---
          return res.status(404).json({ success: false, message: 'Core skill not found.' });
        }

        // --- DEBUGGING START ---
        console.log(`DEBUG: CoreSkill found: ${coreSkill.name}, Subskills: ${coreSkill.subSkills}`);
        // --- DEBUGGING END ---

        // 4. Validate subskills data and prepare marks object
        const subSkillMarks = {};
        const coreSkillSubNames = new Set(coreSkill.subSkills);

        if (!Array.isArray(subskills) || subskills.length === 0) {
          return res.status(400).json({ success: false, message: 'Subskills data is required and must be an array.' });
        }

        for (const sub of subskills) {
          if (!sub.name || typeof sub.mark !== 'number' || sub.mark < 0 || sub.mark > 10) {
            return res.status(400).json({ success: false, message: `Invalid subskill format or mark for "${sub.name || 'unknown'}". Marks must be between 0-10.` });
          }
          if (!coreSkillSubNames.has(sub.name)) {
            return res.status(400).json({ success: false, message: `Subskill "${sub.name}" is not part of the core skill "${coreSkill.name}".` });
          }
          subSkillMarks[sub.name] = sub.mark;
        }

        // Ensure all subskills of the core skill have been provided marks
        // This check ensures completeness for the assessment
        if (Object.keys(subSkillMarks).length !== coreSkill.subSkills.length) {
            return res.status(400).json({ success: false, message: `Marks not provided for all expected subskills of "${coreSkill.name}".` });
        }


        // 5. Create or update the assessment using student.id
        const [assessment, created] = await StudentCoreSkillAssessment.findOrCreate({
          where: { studentId: student.id, coreSkillId }, // <--- MODIFIED: Use student.id here
          defaults: {
            subSkillMarks
          }
        });

        if (!created) {
          await assessment.update({ subSkillMarks });
        }

        res.status(created ? 201 : 200).json({
          success: true,
          message: created ? 'Core skill marks uploaded successfully.' : 'Core skill marks updated successfully.'
        });

      } catch (error) {
        console.error('Error uploading student core skill marks:', error);
        next(error);
      }
    };


    module.exports = {
      getAdminDashboard,
      getUsers,
      bulkCreateUsers,
      createCoreSkill,
      getCoreSkills,
      createCategory,
      getCategories,
      uploadStudentCoreSkillMarks, // <--- This function is now correctly here
      bulkUploadStudentCoreSkillMarks,
      updateUserPasswordByAdmin,
      deleteUser
    };
    