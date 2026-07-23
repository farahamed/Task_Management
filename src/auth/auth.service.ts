import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
	constructor(private readonly usersService: UsersService) {}

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
}