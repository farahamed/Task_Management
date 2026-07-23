import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateProjectDto {
	@ApiProperty({ example: 'Backend Internship' })
	@IsString()
	@Length(1, 120)
	name!: string;

	@ApiPropertyOptional({ example: 'REST API project' })
	@IsOptional()
	@IsString()
	@Length(0, 1000)
	description?: string;
}// Structure placeholder. Implementation will be added later.