import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
	@ApiProperty({ example: 'uuid' })
	id!: string;

	@ApiProperty({ example: 'Farah Ahmed' })
	name!: string;

	@ApiProperty({ example: 'farah@example.com' })
	email!: string;

	@ApiProperty({ example: '2026-07-23T00:00:00.000Z' })
	created_at!: string;
}