// controllers/authController.js
const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const Education = require('../models/Education');
const Certification = require('../models/Certification');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { sendEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs'); // For deleting files on error

// Helper function to generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials: User not found.' });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials: Incorrect password.' });
    }

    const token = generateToken(user.id, user.role);

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboardingComplete: user.isOnboardingComplete
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userData },
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Admin registers a new student profile
// @route   POST /api/auth/register/student
// @access  Admin
const registerStudent = async (req, res, next) => {
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      isOnboardingComplete: false
    });

    await Student.create({ userId: user.id });

    // Assuming frontend login page will be at /login
    const loginLink = `${req.protocol}://${req.get('host')}/login`;
    const emailContent = `
      <h1>Welcome to the Recruitment Platform!</h1>
      <p>A student profile has been created for you by the admin.</p>
      <p>Your login details are:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>Please log in <a href="${loginLink}">here</a> and complete your profile.</p>
      <p>For security, please change your password after logging in.</p>
    `;
    await sendEmail(email, 'Your Student Account Details', emailContent);

    res.status(201).json({
      success: true,
      message: 'Student profile created, registration email sent.'
    });

  } catch (error) {
    console.error('Student registration error:', error);
    next(error);
  }
};

// @desc    Admin registers a new school profile
// @route   POST /api/auth/register/school
// @access  Admin
const registerSchool = async (req, res, next) => {
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'school',
      isOnboardingComplete: false
    });

    await School.create({ userId: user.id });

    const loginLink = `${req.protocol}://${req.get('host')}/login`;
    const emailContent = `
      <h1>Welcome to the Recruitment Platform!</h1>
      <p>A school profile has been created for your institution by the admin.</p>
      <p>Your login details are:</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>Please log in <a href="${loginLink}">here</a> and complete your school's profile.</p>
      <p>For security, please change your password after logging in.</p>
    `;
    await sendEmail(email, 'Your School Account Details', emailContent);

    res.status(201).json({
      success: true,
      message: 'School profile created, registration email sent.'
    });

  } catch (error) {
    console.error('School registration error:', error);
    next(error);
  }
};

// @desc    Complete student/school onboarding process
// @route   POST /api/auth/complete-onboarding
// @access  Private (AuthRequired)
const completeOnboarding = async (req, res, next) => {
  const { id: userId, role } = req.user;
  const profileData = req.validatedProfileData; // This is the parsed and validated data from validateOnboarding middleware
  const filePath = req.file ? `/uploads/profiles/${req.file.filename}` : null; // Path to uploaded image/logo

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isOnboardingComplete) {
      // If onboarding is already complete, allow partial updates but log a warning.
      // Frontend should ideally prevent hitting this route for already onboarded users.
      console.warn(`User ${userId} (Role: ${role}) is re-submitting onboarding data. Allowing update.`);
    }

    if (role === 'student') {
      const studentProfile = await Student.findOne({ where: { userId } });
      if (!studentProfile) {
        return res.status(404).json({ success: false, message: 'Student profile not found for this user.' });
      }

      await studentProfile.update({
        firstName: profileData.first_name,
        lastName: profileData.last_name, // Assuming frontend sends `last_name` field. If it's `lastName`, adjust Joi/model.
        mobile: profileData.mobile,
        about: profileData.about,
        imageUrl: filePath // Use uploaded path for the image
      });

      // Handle Education entries (clear existing and bulk create new ones)
      if (profileData.education && profileData.education.length > 0) {
        await Education.destroy({ where: { studentId: studentProfile.id } });
        const educationEntries = profileData.education.map(edu => ({
          studentId: studentProfile.id,
          collegeName: edu.college_name,
          universityName: edu.university_name,
          courseName: edu.course_name,
          startYear: edu.start_year,
          endYear: edu.end_year
        }));
        await Education.bulkCreate(educationEntries);
      }

      // Handle Certification entries (clear existing and bulk create new ones)
      if (profileData.certifications && profileData.certifications.length > 0) {
        await Certification.destroy({ where: { studentId: studentProfile.id } });
        const certificationEntries = profileData.certifications.map(cert => ({
          studentId: studentProfile.id,
          name: cert.name,
          issuedBy: cert.issued_by,
          description: cert.description,
          dateReceived: cert.date_received,
          hasExpiry: cert.has_expiry,
          expiryDate: cert.expiry_date,
          certificateLink: cert.certificate_link // If sent as URL in data
        }));
        await Certification.bulkCreate(certificationEntries);
      }

      // Handle Skills
      await studentProfile.update({ skills: profileData.skills || [] });


    } else if (role === 'school') {
      const schoolProfile = await School.findOne({ where: { userId } });
      if (!schoolProfile) {
        return res.status(404).json({ success: false, message: 'School profile not found for this user.' });
      }

      await schoolProfile.update({
        bio: profileData.bio,
        websiteLink: profileData.website_link,
        logoUrl: filePath, // Use uploaded path for the logo
        address: profileData.address.address,
        city: profileData.address.city,
        state: profileData.address.state,
        pincode: profileData.address.pincode
      });

    } else {
      // Should be caught by authorizeRoles, but as a safeguard.
      if (filePath && fs.existsSync(path.join(__dirname, '..', filePath))) {
        fs.unlink(path.join(__dirname, '..', filePath), (err) => {
          if (err) console.error('Error deleting uploaded file for invalid role (onboarding):', err);
        });
      }
      return res.status(400).json({ success: false, message: 'Onboarding not applicable for this user role.' });
    }

    user.isOnboardingComplete = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully.'
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);
    // If an error occurs after file upload, clean up the file
    if (filePath && fs.existsSync(path.join(__dirname, '..', filePath))) {
      fs.unlink(path.join(__dirname, '..', filePath), (err) => {
        if (err) console.error('Error deleting uploaded file after onboarding error:', err);
      });
    }
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private (AuthRequired)
const logoutUser = (req, res) => {
  res.status(200).json({ success: true, message: 'Logout successful' });
};

module.exports = {
  loginUser,
  registerStudent,
  registerSchool,
  completeOnboarding,
  logoutUser
};