import { ApiProperty } from '@nestjs/swagger';
import { TaskProjectResponseDto } from './task-project-response.dto';

export class TaskListItemDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Implement JWT' })
	title!: string;

	@ApiProperty({ example: 'todo' })
	status!: string;

	@ApiProperty({ example: 'high' })
	priority!: string;

	@ApiProperty({ type: TaskProjectResponseDto })
	project!: TaskProjectResponseDto;
}