import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

describe('CreateTaskDto', () => {
	it('accepts a valid payload', async () => {
		const dto = plainToInstance(CreateTaskDto, {
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			priority: 'high',
			status: 'todo',
			due_date: '2026-08-01',
		});

		await expect(validate(dto)).resolves.toHaveLength(0);
	});

	it('rejects missing title', async () => {
		const dto = plainToInstance(CreateTaskDto, {
			priority: 'high',
			status: 'todo',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'title')).toBe(true);
	});
});