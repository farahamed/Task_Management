import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';

describe('CreateProjectDto', () => {
	it('accepts a valid payload', async () => {
		const dto = plainToInstance(CreateProjectDto, {
			name: 'Backend Internship',
			description: 'REST API project',
		});

		await expect(validate(dto)).resolves.toHaveLength(0);
	});

	it('rejects missing name', async () => {
		const dto = plainToInstance(CreateProjectDto, {
			description: 'REST API project',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'name')).toBe(true);
	});
});