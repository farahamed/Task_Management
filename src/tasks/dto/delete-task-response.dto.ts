import { ApiProperty } from '@nestjs/swagger';

export class DeleteTaskResponseDto {
	@ApiProperty({ example: 'Task deleted successfully.' })
	message!: string;
}