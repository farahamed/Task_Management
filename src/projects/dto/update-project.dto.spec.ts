import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProjectDto } from './update-project.dto';

describe('UpdateProjectDto', () => {
	it('accepts partial payload', async () => {
		const dto = plainToInstance(UpdateProjectDto, {
			name: 'Updated Name',
		});

		await expect(validate(dto)).resolves.toHaveLength(0);
	});
});