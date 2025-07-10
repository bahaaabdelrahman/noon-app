const crypto = require('crypto');
const authController = require('../../../src/controllers/authController');
const User = require('../../../src/models/User');
const { generateTokens, verifyRefreshToken } = require('../../../src/utils/jwt');
const ApiResponse = require('../../../src/utils/apiResponse');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../../src/utils/errors');
const catchAsync = require('../../../src/utils/catchAsync');

jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/utils/apiResponse');
jest.mock('../../../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock crypto for predictable token hashing, while keeping other functions
jest.mock('crypto', () => ({
    ...jest.requireActual('crypto'),
    createHash: jest.fn(() => ({
        update: jest.fn(() => ({
            digest: jest.fn(() => 'hashed-token'),
        })),
    })),
}));

describe('Auth Controller', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { id: 'userId123', email: 'test@example.com', toObject: () => ({ id: 'userId123', email: 'test@example.com' }) },
            ip: '127.0.0.1',
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            req.body = { firstName: 'Test', lastName: 'User', email: 'new@example.com', password: 'password123', confirmPassword: 'password123' };
            const mockUser = { _id: 'newUserId', createEmailVerificationToken: jest.fn(), save: jest.fn(), toObject: () => ({ _id: 'newUserId' }) };
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue(mockUser);
            generateTokens.mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });

            await authController.register(req, res, next);

            const { firstName, lastName, email, password, phone } = req.body;
            expect(User.create).toHaveBeenCalledWith({ firstName, lastName, email, password, phone });
            expect(mockUser.createEmailVerificationToken).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            expect(generateTokens).toHaveBeenCalledWith('newUserId');
            expect(ApiResponse.created).toHaveBeenCalledWith(res, { user: { _id: 'newUserId' }, tokens: { accessToken: 'access', refreshToken: 'refresh' } }, expect.any(String));
        });

        it('should fail if passwords do not match', async () => {
            req.body = { password: '1', confirmPassword: '2' };
            await authController.register(req, res, next);
            expect(next).toHaveBeenCalledWith(new ValidationError('Passwords do not match'));
        });
    });

    describe('login', () => {
        it('should login successfully', async () => {
            req.body = { email: 'test@example.com', password: 'password123' };
            const mockUser = { _id: 'userId123', correctPassword: jest.fn().mockResolvedValue(true), isLocked: false, isActive: true, resetLoginAttempts: jest.fn(), save: jest.fn(), toObject: () => ({ _id: 'userId123' }) };
            User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
            generateTokens.mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });

            await authController.login(req, res, next);

            expect(mockUser.correctPassword).toHaveBeenCalledWith('password123', undefined);
            expect(generateTokens).toHaveBeenCalledWith('userId123');
            expect(ApiResponse.success).toHaveBeenCalledWith(res, { user: { _id: 'userId123' }, tokens: { accessToken: 'access', refreshToken: 'refresh' } }, 'Login successful');
        });

        it('should fail with invalid credentials', async () => {
            req.body = { email: 'test@example.com', password: 'wrong' };
            const mockUser = { correctPassword: jest.fn().mockResolvedValue(false), incLoginAttempts: jest.fn() };
            User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

            await authController.login(req, res, next);
            expect(next).toHaveBeenCalledWith(new AuthenticationError('Invalid email or password'));
        });
    });

    describe('logout', () => {
        it('should logout successfully', async () => {
            await authController.logout(req, res, next);
            expect(ApiResponse.success).toHaveBeenCalledWith(res, null, 'Logout successful');
        });
    });

    describe('refreshToken', () => {
        it('should refresh tokens successfully', async () => {
            req.body = { refreshToken: 'valid-token' };
            const mockUser = { _id: 'userId123', isActive: true };
            verifyRefreshToken.mockResolvedValue({ userId: 'userId123' });
            User.findById.mockResolvedValue(mockUser);
            generateTokens.mockReturnValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });

            await authController.refreshToken(req, res, next);

            expect(ApiResponse.success).toHaveBeenCalledWith(res, { tokens: { accessToken: 'new-access', refreshToken: 'new-refresh' } }, 'Token refreshed successfully');
        });

        it('should fail with invalid refresh token', async () => {
            req.body = { refreshToken: 'invalid-token' };
            verifyRefreshToken.mockRejectedValue(new Error());
            await authController.refreshToken(req, res, next);
            expect(next).toHaveBeenCalledWith(new AuthenticationError('Invalid or expired refresh token'));
        });
    });

    describe('forgotPassword', () => {
        it('should send reset token if user exists', async () => {
            req.body = { email: 'test@example.com' };
            const mockUser = { isActive: true, createPasswordResetToken: jest.fn(), save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);

            await authController.forgotPassword(req, res, next);

            expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
            expect(ApiResponse.success).toHaveBeenCalledWith(res, null, 'Password reset token sent to your email');
        });

        it('should return NotFoundError if user does not exist', async () => {
            req.body = { email: 'notfound@example.com' };
            User.findOne.mockResolvedValue(null);
            await authController.forgotPassword(req, res, next);
            expect(next).toHaveBeenCalledWith(new NotFoundError('No user found with that email address'));
        });
    });

    describe('resetPassword', () => {
        it('should reset password successfully', async () => {
            req.body = { token: 'reset-token', password: 'new-password' };
            const mockUser = { _id: 'userId123', save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);
            generateTokens.mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });

            await authController.resetPassword(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ passwordResetToken: 'hashed-token', passwordResetExpires: { $gt: expect.any(Number) } });
            expect(mockUser.save).toHaveBeenCalled();
            expect(ApiResponse.success).toHaveBeenCalledWith(res, { tokens: { accessToken: 'access', refreshToken: 'refresh' } }, 'Password reset successful');
        });

        it('should fail with invalid token', async () => {
            req.body = { token: 'invalid-token' };
            User.findOne.mockResolvedValue(null);
            await authController.resetPassword(req, res, next);
            expect(next).toHaveBeenCalledWith(new AuthenticationError('Token is invalid or has expired'));
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            req.body = { currentPassword: 'old', newPassword: 'new' };
            const mockUser = { _id: 'userId123', correctPassword: jest.fn().mockResolvedValue(true), save: jest.fn() };
            User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
            generateTokens.mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });

            await authController.changePassword(req, res, next);

            expect(mockUser.correctPassword).toHaveBeenCalledWith('old', undefined);
            expect(ApiResponse.success).toHaveBeenCalledWith(res, { tokens: { accessToken: 'access', refreshToken: 'refresh' } }, 'Password changed successfully');
        });

        it('should fail with incorrect current password', async () => {
            req.body = { currentPassword: 'wrong' };
            const mockUser = { correctPassword: jest.fn().mockResolvedValue(false) };
            User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

            await authController.changePassword(req, res, next);
            expect(next).toHaveBeenCalledWith(new AuthenticationError('Current password is incorrect'));
        });
    });

    describe('verifyEmail', () => {
        it('should verify email successfully', async () => {
            req.params = { token: 'verify-token' };
            const mockUser = { save: jest.fn() };
            User.findOne.mockResolvedValue(mockUser);

            await authController.verifyEmail(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ emailVerificationToken: 'hashed-token', emailVerificationExpires: { $gt: expect.any(Number) } });
            expect(ApiResponse.success).toHaveBeenCalledWith(res, null, 'Email verified successfully');
        });

        it('should fail with invalid token', async () => {
            req.params = { token: 'invalid-token' };
            User.findOne.mockResolvedValue(null);
            await authController.verifyEmail(req, res, next);
            expect(next).toHaveBeenCalledWith(new AuthenticationError('Token is invalid or has expired'));
        });
    });

    describe('resendEmailVerification', () => {
        it('should resend verification email', async () => {
            const mockUser = { emailVerified: false, createEmailVerificationToken: jest.fn(), save: jest.fn() };
            req.user = mockUser;

            await authController.resendEmailVerification(req, res, next);

            expect(mockUser.createEmailVerificationToken).toHaveBeenCalled();
            expect(ApiResponse.success).toHaveBeenCalledWith(res, null, 'Verification email sent');
        });

        it('should fail if email is already verified', async () => {
            req.user = { emailVerified: true };
            await authController.resendEmailVerification(req, res, next);
            expect(next).toHaveBeenCalledWith(new ValidationError('Email is already verified'));
        });
    });

    describe('getMe', () => {
        it('should return current user info', async () => {
            await authController.getMe(req, res, next);
            expect(ApiResponse.success).toHaveBeenCalledWith(res, { user: { id: 'userId123', email: 'test@example.com' } }, 'User info retrieved successfully');
        });
    });
});
