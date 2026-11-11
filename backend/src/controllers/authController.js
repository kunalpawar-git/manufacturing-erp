import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.login(email, password, req.ip);
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }
    await authService.changePassword(req.user.id, old_password, new_password);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// USER MANAGEMENT
export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const getRolesAndDepartments = async (req, res, next) => {
  try {
    const data = await userService.getRolesAndDepartments();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
