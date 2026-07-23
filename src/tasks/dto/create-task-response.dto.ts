import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskResponseDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Implement JWT' })
	title!: string;

	@ApiProperty({ example: 'todo' })
	status!: string;

	@ApiProperty({ example: 'high' })
	priority!: string;
}