import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Register', description: 'Creates a new user account.' })
	@ApiCreatedResponse({
		schema: {
			example: {
				id: 'uuid',
				name: 'Farah Ahmed',
				email: 'farah@example.com',
				created_at: '2026-07-23T00:00:00.000Z',
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiConflictResponse({ description: 'Email already exists.' })
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	@ApiOperation({ summary: 'Login', description: 'Authenticates an existing user and returns an access token.' })
	@ApiOkResponse({
		schema: {
			example: {
				access_token: 'JWT_TOKEN',
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}
}