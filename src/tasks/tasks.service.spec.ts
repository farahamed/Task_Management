import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { TaskQueryDto } from './dto/task-query.dto';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
	let service: TasksService;
	let prisma: {
		project: { findUnique: jest.Mock };
		task: { create: jest.Mock; count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
		$transaction: jest.Mock;
	};
	let projectsService: {
		findOne: jest.Mock;
	};
	let loggerWarnSpy: jest.SpyInstance;

	beforeEach(() => {
		prisma = {
			project: { findUnique: jest.fn() },
			task: { create: jest.fn(), count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
			$transaction: jest.fn(),
		};
		projectsService = { findOne: jest.fn() };
		loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

		service = new TasksService(prisma as unknown as PrismaService, projectsService as unknown as ProjectsService);
		jest.clearAllMocks();
	});

	afterEach(() => {
		loggerWarnSpy.mockRestore();
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

	it('updates a task for the owner', async () => {
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
		prisma.task.update.mockResolvedValue({
			id: 'task-1',
			title: 'JWT Finished',
			description: 'Use Passport JWT',
			status: TaskStatus.DONE,
			priority: TaskPriority.MEDIUM,
			dueDate: new Date('2026-08-10'),
			project: { id: 'project-1', name: 'Backend Internship' },
		});

		await expect(
			service.update('user-1', 'task-1', {
				title: 'JWT Finished',
				status: 'done' as never,
				priority: 'medium' as never,
				due_date: new Date('2026-08-10'),
			}),
		).resolves.toEqual({
			id: 'task-1',
			title: 'JWT Finished',
			description: 'Use Passport JWT',
			status: 'done',
			priority: 'medium',
			due_date: new Date('2026-08-10'),
			project: { id: 'project-1', name: 'Backend Internship' },
		});
	});

	it('logs a warning when moving from done back to todo', async () => {
		prisma.task.findUnique.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: TaskStatus.DONE,
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
		prisma.task.update.mockResolvedValue({
			id: 'task-1',
			title: 'Implement JWT',
			description: 'Use Passport JWT',
			status: TaskStatus.TODO,
			priority: TaskPriority.HIGH,
			dueDate: new Date('2026-08-01'),
			project: { id: 'project-1', name: 'Backend Internship' },
		});

		await service.update('user-1', 'task-1', { status: 'todo' as never });

		expect(loggerWarnSpy).toHaveBeenCalled();
	});

	it('soft deletes a task for the owner', async () => {
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
		prisma.task.update.mockResolvedValue({ id: 'task-1' });

		await expect(service.remove('user-1', 'task-1')).resolves.toEqual({
			message: 'Task deleted successfully.',
		});
	});

	it('throws not found when task is missing or deleted', async () => {
		prisma.task.findUnique.mockResolvedValue(null);

		await expect(service.remove('user-1', 'task-1')).rejects.toBeInstanceOf(NotFoundException);
	});

	it('throws forbidden for another user on delete', async () => {
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

		await expect(service.remove('user-1', 'task-1')).rejects.toBeInstanceOf(ForbiddenException);
	});
});