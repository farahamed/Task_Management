import { ApiProperty } from '@nestjs/swagger';

export class TaskProjectDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Backend Internship' })
	name!: string;
}