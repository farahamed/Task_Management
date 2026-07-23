import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { TaskQueryDto } from './dto/task-query.dto';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
	let service: TasksService;
	let prisma: {
		project: { findUnique: jest.Mock };
		task: { create: jest.Mock; count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
		$transaction: jest.Mock;
	};
	let projectsService: {
		findOne: jest.Mock;
	};

	beforeEach(() => {
		prisma = {
			project: { findUnique: jest.fn() },
			task: { create: jest.fn(), count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
			$transaction: jest.fn(),
		};
		projectsService = { findOne: jest.fn() };

		service = new TasksService(prisma as unknown as PrismaService, projectsService as unknown as ProjectsService);
		jest.clearAllMocks();
	});

	it('creates a task for the project owner', async () => {
		prisma.task.create.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			status: TaskStatus.TODO,
			priority: TaskPriority.HIGH,
		});
		projectsService.findOne.mockResolvedValue({});

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
			status: 'todo',
			priority: 'high',
		});
	});

	it('throws not found when project is missing', async () => {
		projectsService.findOne.mockRejectedValue(new NotFoundException('Project not found'));

		await expect(
			service.create('user-1', 'project-1', {
				title: 'Implement JWT',
				priority: 'high' as never,
				status: 'todo' as never,
			}),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it('throws forbidden when project belongs to another user', async () => {
		projectsService.findOne.mockRejectedValue(new ForbiddenException('Project belongs to another user'));

		await expect(
			service.create('user-1', 'project-1', {
				title: 'Implement JWT',
				priority: 'high' as never,
				status: 'todo' as never,
			}),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('returns project tasks with filters and pagination', async () => {
		projectsService.findOne.mockResolvedValue({});
		prisma.task.count.mockResolvedValue(1);
		prisma.task.findMany.mockResolvedValue([{ id: 'task-1', title: 'Implement JWT', status: TaskStatus.TODO, priority: TaskPriority.HIGH }]);
		prisma.$transaction.mockResolvedValue([1, [{ id: 'task-1', title: 'Implement JWT', status: TaskStatus.TODO, priority: TaskPriority.HIGH }]]);

		await expect(
			service.findByProject('user-1', 'project-1', {
				page: 1,
				limit: 10,
				status: 'todo' as never,
				priority: 'high' as never,
				due_date_from: new Date('2026-08-01'),
				due_date_to: new Date('2026-08-31'),
				sort: 'due_date' as never,
				order: 'asc' as never,
			}),
		).resolves.toEqual({
			data: [{ id: 'task-1', title: 'Implement JWT', status: 'todo', priority: 'high' }],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		});
	});

	it('returns a single task for the owner', async () => {
		prisma.task.findUnique.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: TaskStatus.TODO,
			priority: TaskPriority.HIGH,
			dueDate: new Date('2026-08-01'),
			deletedAt: null,
			project: {
				id: 'project-1',
				name: 'Backend Internship',
				userId: 'user-1',
				deletedAt: null,
			},
		});

		await expect(service.findOne('user-1', 'task-1')).resolves.toEqual({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: 'todo',
			priority: 'high',
			due_date: new Date('2026-08-01'),
			project: { id: 'project-1', name: 'Backend Internship' },
		});
	});

	it('throws forbidden when task belongs to another user', async () => {
		prisma.task.findUnique.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: TaskStatus.TODO,
			priority: TaskPriority.HIGH,
			dueDate: new Date('2026-08-01'),
			deletedAt: null,
			project: {
				id: 'project-1',
				name: 'Backend Internship',
				userId: 'user-2',
				deletedAt: null,
			},
		});

		await expect(service.findOne('user-1', 'task-1')).rejects.toBeInstanceOf(ForbiddenException);
	});
});