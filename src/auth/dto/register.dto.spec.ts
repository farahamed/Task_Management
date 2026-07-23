import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
	it('accepts a valid payload', async () => {
		const dto = plainToInstance(RegisterDto, {
			name: 'Farah Ahmed',
			email: 'farah@example.com',
			password: 'Password123!',
		});

		await expect(validate(dto)).resolves.toHaveLength(0);
	});

	it('rejects missing name', async () => {
		const dto = plainToInstance(RegisterDto, {
			email: 'farah@example.com',
			password: 'Password123!',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'name')).toBe(true);
	});

	it('rejects invalid email', async () => {
		const dto = plainToInstance(RegisterDto, {
			name: 'Farah Ahmed',
			email: 'not-an-email',
			password: 'Password123!',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'email')).toBe(true);
	});

	it('rejects short password', async () => {
		const dto = plainToInstance(RegisterDto, {
			name: 'Farah Ahmed',
			email: 'farah@example.com',
			password: 'short',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'password')).toBe(true);
	});
});