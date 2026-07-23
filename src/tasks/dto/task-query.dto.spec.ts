import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TaskQueryDto } from './task-query.dto';

describe('TaskQueryDto', () => {
	it('accepts a valid query payload', async () => {
		const dto = plainToInstance(TaskQueryDto, {
			page: 1,
			limit: 10,
			status: 'todo',
			priority: 'high',
			due_date_from: '2026-08-01',
			due_date_to: '2026-08-31',
			sort: 'due_date',
			order: 'asc',
		});

		await expect(validate(dto)).resolves.toHaveLength(0);
	});

	it('rejects invalid sort field', async () => {
		const dto = plainToInstance(TaskQueryDto, {
			sort: 'invalid',
		});

		const errors = await validate(dto);
		expect(errors.some((error) => error.property === 'sort')).toBe(true);
	});
});