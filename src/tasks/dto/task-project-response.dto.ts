import { ApiProperty } from '@nestjs/swagger';

export class TaskProjectResponseDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Backend Internship' })
	name!: string;
}