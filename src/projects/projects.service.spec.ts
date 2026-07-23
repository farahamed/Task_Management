import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
	let service: ProjectsService;
	let prisma: {
		project: {
			create: jest.Mock;
			count: jest.Mock;
			findMany: jest.Mock;
			findUnique: jest.Mock;
			update: jest.Mock;
		};
		task: { updateMany: jest.Mock };
		$transaction: jest.Mock;
	};

	beforeEach(() => {
		prisma = {
			project: {
				create: jest.fn(),
				count: jest.fn(),
				findMany: jest.fn(),
				findUnique: jest.fn(),
				update: jest.fn(),
			},
			task: {
				updateMany: jest.fn(),
			},
			$transaction: jest.fn(),
		};

		service = new ProjectsService(prisma as unknown as PrismaService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('creates a project and maps response', async () => {
			prisma.project.create.mockResolvedValue({
				id: 'project-1',
				name: 'Backend Internship',
				description: 'REST API project',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
			});

			await expect(service.create('user-1', { name: 'Backend Internship', description: 'REST API project' })).resolves.toEqual({
				id: 'project-1',
				name: 'Backend Internship',
				description: 'REST API project',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});
		});

		it('throws conflict when duplicate project exists', async () => {
			prisma.project.create.mockRejectedValue(new PrismaClientKnownRequestError('Unique failed', {
				code: 'P2002',
				clientVersion: '5.22.0',
			}));

			await expect(service.create('user-1', { name: 'Backend Internship', description: 'REST API project' })).rejects.toBeInstanceOf(ConflictException);
		});
	});

	describe('findAll', () => {
		it('returns paginated non-deleted projects for a user', async () => {
			prisma.project.count.mockResolvedValue(1);
			prisma.project.findMany.mockResolvedValue([{ id: 'project-1', name: 'Backend Internship' }]);
			prisma.$transaction.mockResolvedValue([1, [{ id: 'project-1', name: 'Backend Internship' }]]);

			await expect(service.findAll('user-1', { page: 1, limit: 10 })).resolves.toEqual({
				data: [{ id: 'project-1', name: 'Backend Internship' }],
				pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
			});
		});
	});

	describe('findOne', () => {
		it('returns a project for the owner', async () => {
			prisma.project.findUnique.mockResolvedValue({
				id: 'project-1',
				userId: 'user-1',
				name: 'Backend Internship',
				description: 'REST API project',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
				deletedAt: null,
			});

			await expect(service.findOne('user-1', 'project-1')).resolves.toEqual({
				id: 'project-1',
				name: 'Backend Internship',
				description: 'REST API project',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});
		});

		it('throws not found when project is deleted or missing', async () => {
			prisma.project.findUnique.mockResolvedValue(null);

			await expect(service.findOne('user-1', 'project-1')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws forbidden for another user', async () => {
			prisma.project.findUnique.mockResolvedValue({
				id: 'project-1',
				userId: 'user-2',
				name: 'Backend Internship',
				description: 'REST API project',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
				deletedAt: null,
			});

			await expect(service.findOne('user-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);
		});
	});

	describe('update', () => {
		it('updates the project for the owner', async () => {
			prisma.project.findUnique.mockResolvedValue({
				id: 'project-1',
				userId: 'user-1',
				name: 'Backend Internship',
				description: 'REST API project',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
				deletedAt: null,
			});
			prisma.project.update.mockResolvedValue({
				id: 'project-1',
				userId: 'user-1',
				name: 'Updated Name',
				description: 'Updated Description',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
				deletedAt: null,
			});

			await expect(service.update('user-1', 'project-1', { name: 'Updated Name', description: 'Updated Description' })).resolves.toEqual({
				id: 'project-1',
				name: 'Updated Name',
				description: 'Updated Description',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});
		});
	});

	describe('remove', () => {
		it('soft deletes project and tasks', async () => {
			prisma.project.findUnique.mockResolvedValue({
				id: 'project-1',
				userId: 'user-1',
				name: 'Backend Internship',
				description: 'REST API project',
				createdAt: new Date('2026-07-23T00:00:00.000Z'),
				deletedAt: null,
			});
			prisma.$transaction.mockResolvedValue([{ count: 2 }, { id: 'project-1' }]);

			await expect(service.remove('user-1', 'project-1')).resolves.toEqual({
				message: 'Project deleted successfully.',
			});
		});
	});
});