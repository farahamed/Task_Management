import { ApiProperty } from '@nestjs/swagger';

export class ProjectSummaryDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Backend Internship' })
	name!: string;
}