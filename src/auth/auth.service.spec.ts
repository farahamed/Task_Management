import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
	hash: jest.fn(),
	compare: jest.fn(),
}));

describe('AuthService', () => {
	let authService: AuthService;
	let usersService: {
		findByEmail: jest.Mock;
		create: jest.Mock;
	};
	let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

	beforeEach(() => {
		usersService = {
			findByEmail: jest.fn(),
			create: jest.fn(),
		};
		jwtService = {
			sign: jest.fn(),
		};
		authService = new AuthService(usersService as unknown as UsersService, jwtService as unknown as JwtService);
		jest.clearAllMocks();
	});

	describe('register', () => {
		it('creates a new user after hashing password', async () => {
			usersService.findByEmail.mockResolvedValue(null);
			(usersService.create as jest.Mock).mockResolvedValue({
				id: 'user-1',
				name: 'Farah Ahmed',
				email: 'farah@example.com',
				password: 'hashed-password',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
			});
			(jest.mocked(bcrypt.hash) as jest.Mock).mockResolvedValue('hashed-password');

			await expect(
				authService.register({
					name: 'Farah Ahmed',
					email: 'farah@example.com',
					password: 'Password123!',
				}),
			).resolves.toEqual({
				id: 'user-1',
				name: 'Farah Ahmed',
				email: 'farah@example.com',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});

			expect(usersService.findByEmail).toHaveBeenCalledWith('farah@example.com');
			expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
			expect(usersService.create).toHaveBeenCalledWith({
				name: 'Farah Ahmed',
				email: 'farah@example.com',
				password: 'hashed-password',
			});
		});

		it('throws conflict when email already exists', async () => {
			usersService.findByEmail.mockResolvedValue({
				id: 'user-1',
				name: 'Existing User',
				email: 'farah@example.com',
				password: 'hashed-password',
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await expect(
				authService.register({
					name: 'Farah Ahmed',
					email: 'farah@example.com',
					password: 'Password123!',
				}),
			).rejects.toBeInstanceOf(ConflictException);
		});
	});

	describe('login', () => {
		it('returns access token for valid credentials', async () => {
			usersService.findByEmail.mockResolvedValue({
				id: 'user-1',
				name: 'Farah Ahmed',
				email: 'farah@example.com',
				password: 'hashed-password',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			(jest.mocked(bcrypt.compare) as jest.Mock).mockResolvedValue(true);
			jwtService.sign.mockReturnValue('JWT_TOKEN');

			await expect(
				authService.login({
					email: 'farah@example.com',
					password: 'Password123!',
				}),
			).resolves.toEqual({
				access_token: 'JWT_TOKEN',
			});

			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: 'user-1',
				email: 'farah@example.com',
			});
		});

		it('throws unauthorized when user does not exist', async () => {
			usersService.findByEmail.mockResolvedValue(null);

			await expect(
				authService.login({
					email: 'farah@example.com',
					password: 'Password123!',
				}),
			).rejects.toBeInstanceOf(UnauthorizedException);
		});

		it('throws unauthorized when password is invalid', async () => {
			usersService.findByEmail.mockResolvedValue({
				id: 'user-1',
				name: 'Farah Ahmed',
				email: 'farah@example.com',
				password: 'hashed-password',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			(jest.mocked(bcrypt.compare) as jest.Mock).mockResolvedValue(false);

			await expect(
				authService.login({
					email: 'farah@example.com',
					password: 'Password123!',
				}),
			).rejects.toBeInstanceOf(UnauthorizedException);
		});
	});
});