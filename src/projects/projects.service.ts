import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(userId: string, dto: CreateProjectDto): Promise<{ id: string; name: string; description: string | null; created_at: Date }> {
		try {
			const project = await this.prisma.project.create({
				data: {
					userId,
					name: dto.name,
					description: dto.description,
				},
			});

			return {
				id: project.id,
				name: project.name,
				description: project.description,
				created_at: project.createdAt,
			};
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new ConflictException('Project already exists');
			}

			throw error;
		}
	}
}