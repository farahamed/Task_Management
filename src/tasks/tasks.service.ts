import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskPriority as PrismaTaskPriority, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';

@Injectable()
export class TasksService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly projectsService: ProjectsService,
	) {}

	async create(userId: string, projectId: string, dto: CreateTaskDto): Promise<{ id: string; title: string; status: string; priority: string }> {
		await this.projectsService.findOne(userId, projectId);

		const task = await this.prisma.task.create({
			data: {
				projectId,
				title: dto.title,
				description: dto.description,
				status: this.mapStatus(dto.status),
				priority: this.mapPriority(dto.priority),
				dueDate: dto.due_date,
			},
		});

		return {
			id: task.id,
			title: task.title,
			status: task.status.toLowerCase(),
			priority: task.priority.toLowerCase(),
		};
	}

	async findByProject(userId: string, projectId: string, query: TaskQueryDto): Promise<{
		data: Array<{ id: string; title: string; status: string; priority: string }>;
		pagination: { page: number; limit: number; total: number; totalPages: number };
	}> {
		await this.projectsService.findOne(userId, projectId);

		const where: Prisma.TaskWhereInput = {
			projectId,
			deletedAt: null,
			...(query.status ? { status: this.mapStatus(query.status) } : {}),
			...(query.priority ? { priority: this.mapPriority(query.priority) } : {}),
			...(query.due_date_from || query.due_date_to
				? {
					dueDate: {
						...(query.due_date_from ? { gte: query.due_date_from } : {}),
						...(query.due_date_to ? { lte: query.due_date_to } : {}),
					},
				}
				: {}),
		};

		const [total, tasks] = await this.prisma.$transaction([
			this.prisma.task.count({ where }),
			this.prisma.task.findMany({
				where,
				select: {
					id: true,
					title: true,
					status: true,
					priority: true,
				},
				orderBy: this.mapOrder(query.sort, query.order),
				skip: (query.page - 1) * query.limit,
				take: query.limit,
			}),
		]);

		return {
			data: tasks.map((task) => ({
				id: task.id,
				title: task.title,
				status: task.status.toLowerCase(),
				priority: task.priority.toLowerCase(),
			})),
			pagination: {
				page: query.page,
				limit: query.limit,
				total,
				totalPages: Math.max(1, Math.ceil(total / query.limit)),
			},
		};
	}

	async findOne(userId: string, taskId: string): Promise<{
		id: string;
		title: string;
		description: string | null;
		status: string;
		priority: string;
		due_date: Date | null;
		project: { id: string; name: string };
	}> {
		const task = await this.prisma.task.findUnique({
			where: { id: taskId },
			include: {
				project: {
					select: {
						id: true,
						name: true,
						userId: true,
						deletedAt: true,
					},
				},
			},
		});

		if (!task || task.deletedAt || task.project.deletedAt) {
			throw new NotFoundException('Task not found');
		}

		if (task.project.userId !== userId) {
			throw new ForbiddenException('Task belongs to another user');
		}

		return {
			id: task.id,
			title: task.title,
			description: task.description,
			status: task.status.toLowerCase(),
			priority: task.priority.toLowerCase(),
			due_date: task.dueDate,
			project: {
				id: task.project.id,
				name: task.project.name,
			},
		};
	}

	private mapStatus(status: CreateTaskDto['status'] | TaskQueryDto['status']): PrismaTaskStatus {
		switch (status) {
			case 'in_progress':
				return PrismaTaskStatus.IN_PROGRESS;
			case 'done':
				return PrismaTaskStatus.DONE;
			case 'todo':
			default:
				return PrismaTaskStatus.TODO;
		}
	}

	private mapPriority(priority: CreateTaskDto['priority'] | TaskQueryDto['priority']): PrismaTaskPriority {
		switch (priority) {
			case 'low':
				return PrismaTaskPriority.LOW;
			case 'high':
				return PrismaTaskPriority.HIGH;
			case 'medium':
			default:
				return PrismaTaskPriority.MEDIUM;
		}
	}

	private mapOrder(sort: TaskQueryDto['sort'], order: TaskQueryDto['order']): Prisma.TaskOrderByWithRelationInput {
		const direction = order ?? 'desc';

		switch (sort) {
			case 'due_date':
				return { dueDate: direction };
			case 'priority':
				return { priority: direction };
			case 'created_at':
			default:
				return { createdAt: direction };
		}
	}
}