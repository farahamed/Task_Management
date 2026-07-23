import { ApiProperty } from '@nestjs/swagger';

export class DeleteProjectResponseDto {
	@ApiProperty({ example: 'Project deleted successfully.' })
	message!: string;
}