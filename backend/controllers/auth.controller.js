import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { HTTPSTATUS } from "../config/https.config.js";

const generateToken = async (user) => {  
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken };
};

// Add the missing authenticateToken middleware
export const authenticateToken = async (req, res, next) => {
  try {
    // Try to get token from cookies first, then from Authorization header
    let token = req.cookies?.accessToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Access token required"
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Find the user
    const user = await User.findById(decoded.userId).select("-password -refreshToken");
    
    if (!user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Invalid token - user not found"
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Invalid token"
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "Token expired"
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      message: "Server error during authentication"
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password , bio , role } = req.body;
    
    console.log('Registration request:', { name, email, password: password ? '***' : undefined, bio, role });
    
    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    if (!role) {
      return res.status(400).json({ message: "Role is required." });
    }
    if (!bio) {
      return res.status(400).json({ message: "Bio is required." });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email." });
    }
    
    const user = await User.create({
      name,
      email,
      password, 
      role: role || "customer"
    });
    
    try {
      const { accessToken, refreshToken } = await generateToken(user);
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        accessToken,
        refreshToken
      });
    } catch (tokenError) {
      
      await User.findByIdAndDelete(user._id);
      console.error('Token generation failed:', tokenError);
      return res.status(500).json({ 
        message: "Server error: JWT configuration issue. Please contact administrator." 
      });
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while registering user." });
  }
};

export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        message: "No refresh token provided",
      });
    }
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res.status(HTTPSTATUS.FORBIDDEN).json({
            message: "Invalid or expired refresh token",
          });
        }
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: "User not found or refresh token mismatch",
          });
        }
        const newAccessToken = user.generateAccessToken();
        res.status(HTTPSTATUS.OK).json({ accessToken: newAccessToken });
      }
    );
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    const { accessToken, refreshToken } = await generateToken(user);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    const userResponse = {
      id: loggedInUser._id,
      name: loggedInUser.name,
      email: loggedInUser.email,
      role: loggedInUser.role,
      address: loggedInUser.address,
    };
    res
      .status(HTTPSTATUS.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Login successful",
        user: userResponse,
        accessToken,
        refreshToken,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while logging in user." });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while fetching user profile." });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };
    
    res
      .status(HTTPSTATUS.OK)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        success: true,
        message: "Logout successful",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while logging out user." });
  }
};

// Add the missing admin middleware functions
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user has admin or super admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Admin access required"
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error in admin middleware"
    });
  }
};

export const requireSuperAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Check if user has super admin role
    if (req.user.role !== 'superadmin') {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        message: "Super admin access required"
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error in super admin middleware"
    });
  }
};