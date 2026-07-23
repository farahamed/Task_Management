import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskPriority as PrismaTaskPriority, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
	constructor(
		private readonly prisma: PrismaService,
	) {}

	async create(userId: string, projectId: string, dto: CreateTaskDto): Promise<{ id: string; title: string; status: string; priority: string }> {
		const project = await this.prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project || project.deletedAt) {
			throw new NotFoundException('Project not found');
		}

		if (project.userId !== userId) {
			throw new ForbiddenException('Project belongs to another user');
		}

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
			status: task.status,
			priority: task.priority,
		};
	}

	private mapStatus(status: CreateTaskDto['status']): PrismaTaskStatus {
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

	private mapPriority(priority: CreateTaskDto['priority']): PrismaTaskPriority {
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
}