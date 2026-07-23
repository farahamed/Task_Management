import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

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

	async findAll(userId: string, query: PaginationQueryDto): Promise<{
		data: Array<{ id: string; name: string }>;
		pagination: { page: number; limit: number; total: number; totalPages: number };
	}> {
		const where = {
			userId,
			deletedAt: null,
		};

		const [total, projects] = await this.prisma.$transaction([
			this.prisma.project.count({ where }),
			this.prisma.project.findMany({
				where,
				select: {
					id: true,
					name: true,
				},
				orderBy: { createdAt: 'desc' },
				skip: (query.page - 1) * query.limit,
				take: query.limit,
			}),
		]);

		return {
			data: projects,
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / query.limit)),
			},
		};
	}

	async findOne(userId: string, projectId: string): Promise<{
		id: string;
		name: string;
		description: string | null;
		created_at: Date;
	}> {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.deletedAt) {
			throw new NotFoundException('Project not found');
		}

		if (project.userId !== userId) {
			throw new ForbiddenException('Project belongs to another user');
		}

		return {
			id: project.id,
			name: project.name,
			description: project.description,
			created_at: project.createdAt,
		};
	}

	async update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<{
		id: string;
		name: string;
		description: string | null;
		created_at: Date;
	}> {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.deletedAt) {
			throw new NotFoundException('Project not found');
		}

		if (project.userId !== userId) {
			throw new ForbiddenException('Project belongs to another user');
		}

		const updatedProject = await this.prisma.project.update({
			where: { id: projectId },
			data: {
				name: dto.name,
				description: dto.description,
			},
		});

		return {
			id: updatedProject.id,
			name: updatedProject.name,
			description: updatedProject.description,
			created_at: updatedProject.createdAt,
		};
	}
}