import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: jest.Mocked<Pick<AuthService, 'register' | 'login'>>;

	beforeEach(async () => {
		authService = {
			register: jest.fn(),
			login: jest.fn(),
		};

		const moduleRef = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: authService }],
		}).compile();

		controller = moduleRef.get(AuthController);
	});

	it('delegates register request to service', async () => {
		authService.register.mockResolvedValue({
			id: 'user-1',
			name: 'Farah Ahmed',
			email: 'farah@example.com',
			created_at: new Date('2026-07-23T00:00:00.000Z'),
		});

		await expect(
			controller.register({
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

		expect(authService.register).toHaveBeenCalledWith({
			name: 'Farah Ahmed',
			email: 'farah@example.com',
			password: 'Password123!',
		});
	});

	it('delegates login request to service', async () => {
		authService.login.mockResolvedValue({ access_token: 'JWT_TOKEN' });

		await expect(
			controller.login({
				email: 'farah@example.com',
				password: 'Password123!',
			}),
		).resolves.toEqual({ access_token: 'JWT_TOKEN' });

		expect(authService.login).toHaveBeenCalledWith({
			email: 'farah@example.com',
			password: 'Password123!',
		});
	});
});