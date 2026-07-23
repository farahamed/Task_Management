import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
	it('accepts a valid payload', async () => {
		const dto = plainToInstance(LoginDto, {
			email: 'farah@example.com',
			password: 'Password123!',
		});

		await expect(validate(dto)).resolves.toHaveLength(0);
	});

	it('rejects invalid email', async () => {
		const dto = plainToInstance(LoginDto, {
			email: 'invalid-email',
			password: 'Password123!',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'email')).toBe(true);
	});

	it('rejects short password', async () => {
		const dto = plainToInstance(LoginDto, {
			email: 'farah@example.com',
			password: 'short',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'password')).toBe(true);
	});
});