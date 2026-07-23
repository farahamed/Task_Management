import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Backend Internship' })
	name!: string;

	@ApiPropertyOptional({ example: 'REST API project' })
	description?: string | null;

	@ApiProperty({ example: '2026-07-23T00:00:00.000Z' })
	created_at!: string;
}