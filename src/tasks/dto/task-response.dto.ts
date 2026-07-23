import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskProjectDto } from './task-project.dto';

export class TaskResponseDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Implement JWT' })
	title!: string;

	@ApiPropertyOptional({ example: 'Use Passport JWT' })
	description?: string | null;

	@ApiProperty({ example: 'todo' })
	status!: string;

	@ApiProperty({ example: 'high' })
	priority!: string;

	@ApiPropertyOptional({ example: '2026-08-01' })
	due_date?: string | null;

	@ApiPropertyOptional({ type: TaskProjectDto })
	project?: TaskProjectDto;
}