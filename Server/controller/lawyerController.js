const Lawyer = require("../models/Lawyer");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// Generate JWT Token
const generateToken = (lawyerId) => {
  return jwt.sign({ lawyerId, type: "lawyer" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Register Lawyer
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      barNumber,
      specialization,
      experience,
      state,
      city,
      address,
    } = req.body;

    // Check if lawyer already exists
    const existingLawyer = await Lawyer.findOne({
      $or: [{ email }, { barNumber }],
    });

    if (existingLawyer) {
      return res.status(400).json({
        message:
          existingLawyer.email === email
            ? "Lawyer already exists with this email"
            : "Bar number already registered",
      });
    }

    // Create new lawyer
    const lawyer = new Lawyer({
      name,
      email,
      password,
      phone,
      barNumber,
      specialization: Array.isArray(specialization)
        ? specialization
        : [specialization],
      experience,
      state,
      city: city || "",
      address: address || "",
      status: "pending",
    });

    await lawyer.save();

    // Generate token
    const token = generateToken(lawyer._id);

    res.status(201).json({
      success: true,
      token,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        phone: lawyer.phone,
        barNumber: lawyer.barNumber,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
        state: lawyer.state,
        status: lawyer.status,
      },
      message: "Registration successful. Waiting for admin approval.",
    });
  } catch (error) {
    console.error("Lawyer register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login Lawyer
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if lawyer exists
    const lawyer = await Lawyer.findOne({ email });
    if (!lawyer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (lawyer.isSuspended) {
      return res.status(403).json({ message: "Your account has been suspended. Please contact admin." });
    }

    // Check password
    const isMatch = await lawyer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(lawyer._id);

    res.json({
      success: true,
      token,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        phone: lawyer.phone,
        barNumber: lawyer.barNumber,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
        state: lawyer.state,
        city: lawyer.city,
        address: lawyer.address,
        status: lawyer.status,
      },
    });
  } catch (error) {
    console.error("Lawyer login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Current Lawyer
exports.getMe = async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.lawyer.id).select("-password");
    res.json({
      success: true,
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        phone: lawyer.phone,
        barNumber: lawyer.barNumber,
        specialization: lawyer.specialization,
        experience: lawyer.experience,
        state: lawyer.state,
        city: lawyer.city,
        address: lawyer.address,
        status: lawyer.status,
        averageRating: lawyer.averageRating,
        totalRatings: lawyer.totalRatings,
      },
    });
  } catch (error) {
    console.error("Get lawyer error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Lawyers (for users - only approved)
exports.getApprovedLawyers = async (req, res) => {
  try {
    const { state, specialization, search } = req.query;

    const query = { status: "approved", isSuspended: { $ne: true } };

    if (state) {
      query.state = state;
    }

    if (specialization) {
      query.specialization = { $in: [specialization] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    const lawyers = await Lawyer.find(query)
      .select("-password -__v")
      .sort({ experience: -1, createdAt: -1 });

    res.json({
      success: true,
      count: lawyers.length,
      lawyers,
    });
  } catch (error) {
    console.error("Get lawyers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Pending Lawyers (Admin only)
exports.getPendingLawyers = async (req, res) => {
  try {
    const lawyers = await Lawyer.find({ status: "pending" })
      .select("-password -__v")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: lawyers.length,
      lawyers,
    });
  } catch (error) {
    console.error("Get pending lawyers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Approve/Reject Lawyer (Admin only)
exports.updateLawyerStatus = async (req, res) => {
  try {
    const { lawyerId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = {
      status,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    };

    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    } else {
      updateData.rejectionReason = "";
    }

    const lawyer = await Lawyer.findByIdAndUpdate(lawyerId, updateData, {
      new: true,
    }).select("-password -__v");

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found" });
    }

    res.json({
      success: true,
      message: `Lawyer ${status} successfully`,
      lawyer,
    });
  } catch (error) {
    console.error("Update lawyer status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Lawyer Profile
exports.updateProfile = async (req, res) => {
  try {
    const { bio, education, languages, consultationFee, availability } =
      req.body;

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (education !== undefined)
      updateData.education = Array.isArray(education) ? education : [education];
    if (languages !== undefined)
      updateData.languages = Array.isArray(languages) ? languages : [languages];
    if (consultationFee !== undefined)
      updateData.consultationFee = consultationFee;
    if (availability !== undefined) updateData.availability = availability;

    const lawyer = await Lawyer.findByIdAndUpdate(req.lawyer.id, updateData, {
      new: true,
    }).select("-password -__v");

    res.json({
      success: true,
      message: "Profile updated successfully",
      lawyer,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Lawyer Statistics
exports.getLawyerStats = async (req, res) => {
  try {
    const Consultation = require("../models/Consultation");

    const totalConsultations = await Consultation.countDocuments({
      lawyer: req.lawyer.id,
    });
    const pendingConsultations = await Consultation.countDocuments({
      lawyer: req.lawyer.id,
      status: "pending",
    });
    const acceptedConsultations = await Consultation.countDocuments({
      lawyer: req.lawyer.id,
      status: "accepted",
    });
    const completedConsultations = await Consultation.countDocuments({
      lawyer: req.lawyer.id,
      status: "completed",
    });

    const lawyer = await Lawyer.findById(req.lawyer.id).select(
      "averageRating totalRatings totalConsultations",
    );

    res.json({
      success: true,
      stats: {
        totalConsultations,
        pendingConsultations,
        acceptedConsultations,
        completedConsultations,
        averageRating: lawyer.averageRating,
        totalRatings: lawyer.totalRatings,
      },
    });
  } catch (error) {
    console.error("Get lawyer stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
