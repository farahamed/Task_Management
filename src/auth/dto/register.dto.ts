import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
	@ApiProperty({ example: 'Farah Ahmed' })
	@IsString()
	name!: string;

	@ApiProperty({ example: 'farah@example.com' })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: 'Password123!' })
	@IsString()
	@MinLength(8)
	password!: string;
}