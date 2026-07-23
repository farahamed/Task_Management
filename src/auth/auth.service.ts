import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async register(dto: RegisterDto): Promise<{ id: string; name: string; email: string; created_at: Date }> {
		const existingUser = await this.usersService.findByEmail(dto.email);
		if (existingUser) {
			throw new ConflictException('Email already exists');
		}

		const passwordHash = await bcrypt.hash(dto.password, 12);
		const user = await this.usersService.create({
			name: dto.name,
			email: dto.email,
			password: passwordHash,
		});

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			created_at: user.createdAt,
		};
	}

	async login(dto: LoginDto): Promise<{ access_token: string }> {
		const user = await this.usersService.findByEmail(dto.email);
		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const isPasswordValid = await bcrypt.compare(dto.password, user.password);
		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		return {
			access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
		};
	}
}