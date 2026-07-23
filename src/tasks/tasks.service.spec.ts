import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
	let service: TasksService;
	let prisma: {
		project: { findUnique: jest.Mock };
		task: { create: jest.Mock };
	};

	beforeEach(() => {
		prisma = {
			project: { findUnique: jest.fn() },
			task: { create: jest.fn() },
		};

		service = new TasksService(prisma as unknown as PrismaService);
		jest.clearAllMocks();
	});

	it('creates a task for the project owner', async () => {
		prisma.project.findUnique.mockResolvedValue({
			id: 'project-1',
			userId: 'user-1',
			deletedAt: null,
		});
		prisma.task.create.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			status: TaskStatus.TODO,
			priority: TaskPriority.HIGH,
		});

		await expect(
			service.create('user-1', 'project-1', {
				title: 'Implement JWT',
				description: 'Use Passport JWT',
				priority: 'high' as never,
				status: 'todo' as never,
				due_date: new Date('2026-08-01'),
			}),
		).resolves.toEqual({
			id: 'task-1',
			title: 'Implement JWT',
			status: TaskStatus.TODO,
			priority: TaskPriority.HIGH,
		});
	});

	it('throws not found when project is missing', async () => {
		prisma.project.findUnique.mockResolvedValue(null);

		await expect(
			service.create('user-1', 'project-1', {
				title: 'Implement JWT',
				priority: 'high' as never,
				status: 'todo' as never,
			}),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it('throws forbidden when project belongs to another user', async () => {
		prisma.project.findUnique.mockResolvedValue({
			id: 'project-1',
			userId: 'user-2',
			deletedAt: null,
		});

		await expect(
			service.create('user-1', 'project-1', {
				title: 'Implement JWT',
				priority: 'high' as never,
				status: 'todo' as never,
			}),
		).rejects.toBeInstanceOf(ForbiddenException);
	});
});