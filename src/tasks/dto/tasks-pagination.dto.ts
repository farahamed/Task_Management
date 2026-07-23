import { ApiProperty } from '@nestjs/swagger';
import { TaskSummaryDto } from './task-summary.dto';

class TasksPaginationMetaDto {
	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 10 })
	limit!: number;

	@ApiProperty({ example: 20 })
	total!: number;

	@ApiProperty({ example: 2 })
	totalPages!: number;
}

export class TasksPaginationResponseDto {
	@ApiProperty({ type: [TaskSummaryDto] })
	data!: TaskSummaryDto[];

	@ApiProperty({ type: TasksPaginationMetaDto })
	pagination!: TasksPaginationMetaDto;
}