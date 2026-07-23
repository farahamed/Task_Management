import { ApiProperty } from '@nestjs/swagger';
import { TaskListItemDto } from './task-list-item.dto';

class TasksListPaginationMetaDto {
	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 10 })
	limit!: number;

	@ApiProperty({ example: 18 })
	total!: number;

	@ApiProperty({ example: 2 })
	totalPages!: number;
}

export class TasksListPaginationResponseDto {
	@ApiProperty({ type: [TaskListItemDto] })
	data!: TaskListItemDto[];

	@ApiProperty({ type: TasksListPaginationMetaDto })
	pagination!: TasksListPaginationMetaDto;
}