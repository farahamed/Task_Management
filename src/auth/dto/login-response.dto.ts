import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
	@ApiProperty({ example: 'JWT_TOKEN' })
	access_token!: string;
}