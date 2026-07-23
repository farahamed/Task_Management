import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Register', description: 'Creates a new user account.' })
	@ApiBody({ type: RegisterDto })
	@ApiCreatedResponse({ type: RegisterResponseDto, description: 'User created successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiConflictResponse({ description: 'Email already exists.' })
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	@ApiOperation({ summary: 'Login', description: 'Authenticates an existing user and returns an access token.' })
	@ApiBody({ type: LoginDto })
	@ApiOkResponse({ type: LoginResponseDto, description: 'User authenticated successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}
}