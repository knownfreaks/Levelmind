// controllers/helpdeskController.js
const { User, Student, School, Job, Application, Interview, Notification, Category, CoreSkill, StudentCoreSkillAssessment, Education, Certification, HelpRequest } = require('../config/database');

// @desc    Submit a help request
// @route   POST /api/help
// @access  Private (AuthRequired - Student/School)
const submitHelpRequest = async (req, res, next) => {
  const { id: userId } = req.user; // User who is submitting the request
  const { subject, message } = req.body;

  try {
    const helpRequest = await HelpRequest.create({
      userId,
      subject,
      message,
      status: 'open'
    });

    // Notify all admins about the new help request
    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['id'] });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        message: `New help request: "${subject.substring(0, 50)}..."`,
        type: 'info',
        link: `/admin/help/${helpRequest.id}` // Link to admin's view of this request
      });
    }

    res.status(201).json({
      success: true,
      message: 'Help request sent successfully. We will get back to you shortly.'
    });

  } catch (error) {
    console.error('Error submitting help request:', error);
    next(error);
  }
};

// @desc    Admin views all help requests
// @route   GET /api/help
// @access  Admin
const getHelpRequests = async (req, res, next) => {
  const { status, limit = 10, offset = 0 } = req.query; // 'open', 'resolved'

  let whereClause = {};
  if (status && ['open', 'resolved'].includes(status)) {
    whereClause.status = status;
  }

  try {
    const { count, rows: helpRequests } = await HelpRequest.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }] // Include requester's details
    });

    const formattedRequests = helpRequests.map(req => ({
      id: req.id,
      subject: req.subject,
      message: req.message,
      status: req.status,
      requester: {
        id: req.User.id,
        name: req.User.name,
        email: req.User.email,
        role: req.User.role
      },
      created_at: req.createdAt // Matches frontend expected field name
    }));

    res.status(200).json({
      success: true,
      message: 'Help requests fetched successfully.',
      data: {
        requests: formattedRequests,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching help requests:', error);
    next(error);
  }
};

// @desc    Admin marks a help request as resolved
// @route   PATCH /api/help/:id/resolve
// @access  Admin
const resolveHelpRequest = async (req, res, next) => {
  const { id: requestId } = req.params;

  try {
    const helpRequest = await HelpRequest.findByPk(requestId);

    if (!helpRequest) {
      return res.status(404).json({ success: false, message: 'Help request not found.' });
    }

    if (helpRequest.status === 'resolved') {
      return res.status(200).json({ success: true, message: 'Help request already resolved.' });
    }

    helpRequest.status = 'resolved';
    await helpRequest.save();

    // Optionally, notify the original requester that their ticket is resolved
    const requesterUser = await User.findByPk(helpRequest.userId, { attributes: ['id', 'email'] });
    if (requesterUser) {
        await Notification.create({
            userId: requesterUser.id,
            message: `Your help request "${helpRequest.subject.substring(0, 50)}..." has been resolved.`,
            type: 'success',
            link: `/help-history` // Frontend link to their help request history
        });
    }

    res.status(200).json({
      success: true,
      message: 'Help request marked resolved.'
    });

  } catch (error) {
    console.error('Error resolving help request:', error);
    next(error);
  }
};

module.exports = {
  submitHelpRequest,
  getHelpRequests,
  resolveHelpRequest
};