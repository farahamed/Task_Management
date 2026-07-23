import { ApiProperty } from '@nestjs/swagger';
import { ProjectSummaryDto } from './project-summary.dto';

class ProjectsPaginationMetaDto {
	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 10 })
	limit!: number;

	@ApiProperty({ example: 20 })
	total!: number;

	@ApiProperty({ example: 2 })
	totalPages!: number;
}

export class ProjectsPaginationResponseDto {
	@ApiProperty({ type: [ProjectSummaryDto] })
	data!: ProjectSummaryDto[];

	@ApiProperty({ type: ProjectsPaginationMetaDto })
	pagination!: ProjectsPaginationMetaDto;
}