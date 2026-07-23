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

	// Shared mock — reused across tests to keep things DRY
	const mockProject = {
		id: 'project-1',
		userId: 'user-1',
		name: 'Backend Internship',
		description: 'REST API project',
		createdAt: new Date('2026-07-23T00:00:00.000Z'),
		updatedAt: new Date('2026-07-23T00:00:00.000Z'),
		deletedAt: null,
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
			task: { updateMany: jest.fn() },
			$transaction: jest.fn(),
		};
		service = new ProjectsService(prisma as unknown as PrismaService);
		jest.clearAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// create
	// ──────────────────────────────────────────────────────────────────────────
	describe('create', () => {
		it('creates a project and maps the response correctly', async () => {
			prisma.project.create.mockResolvedValue(mockProject);

			await expect(
				service.create('user-1', { name: 'Backend Internship', description: 'REST API project' }),
			).resolves.toEqual({
				id: 'project-1',
				name: 'Backend Internship',
				description: 'REST API project',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});

			expect(prisma.project.create).toHaveBeenCalledWith({
				data: { userId: 'user-1', name: 'Backend Internship', description: 'REST API project' },
			});
		});

		it('throws ConflictException when a project with the same name already exists (P2002)', async () => {
			prisma.project.create.mockRejectedValue(
				new PrismaClientKnownRequestError('Unique constraint failed', {
					code: 'P2002',
					clientVersion: '5.22.0',
				}),
			);

			await expect(
				service.create('user-1', { name: 'Backend Internship', description: 'REST API project' }),
			).rejects.toBeInstanceOf(ConflictException);
		});

		it('rethrows unexpected database errors as-is', async () => {
			prisma.project.create.mockRejectedValue(new Error('Database connection lost'));

			await expect(service.create('user-1', { name: 'Backend Internship' })).rejects.toThrow(
				'Database connection lost',
			);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// findAll
	// ──────────────────────────────────────────────────────────────────────────
	describe('findAll', () => {
		it('returns paginated non-deleted projects for the user', async () => {
			prisma.$transaction.mockResolvedValue([1, [{ id: 'project-1', name: 'Backend Internship' }]]);

			await expect(service.findAll('user-1', { page: 1, limit: 10 })).resolves.toEqual({
				data: [{ id: 'project-1', name: 'Backend Internship' }],
				pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
			});
		});

		it('calculates totalPages correctly when results span multiple pages', async () => {
			prisma.$transaction.mockResolvedValue([25, []]);

			const result = await service.findAll('user-1', { page: 1, limit: 10 });

			expect(result.pagination.totalPages).toBe(3);
		});

		it('returns totalPages of at least 1 even when there are no projects', async () => {
			prisma.$transaction.mockResolvedValue([0, []]);

			const result = await service.findAll('user-1', { page: 1, limit: 10 });

			expect(result.pagination).toMatchObject({ total: 0, totalPages: 1 });
			expect(result.data).toHaveLength(0);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// findOne
	// ──────────────────────────────────────────────────────────────────────────
	describe('findOne', () => {
		it('returns the project when called by its owner', async () => {
			prisma.project.findUnique.mockResolvedValue(mockProject);

			await expect(service.findOne('user-1', 'project-1')).resolves.toEqual({
				id: 'project-1',
				name: 'Backend Internship',
				description: 'REST API project',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});
		});

		it('throws NotFoundException when the project does not exist', async () => {
			prisma.project.findUnique.mockResolvedValue(null);

			await expect(service.findOne('user-1', 'project-1')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when the project is soft deleted', async () => {
			// deletedAt is set → should behave identically to "not found"
			prisma.project.findUnique.mockResolvedValue({ ...mockProject, deletedAt: new Date() });

			await expect(service.findOne('user-1', 'project-1')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws ForbiddenException when the project belongs to a different user', async () => {
			prisma.project.findUnique.mockResolvedValue({ ...mockProject, userId: 'user-2' });

			await expect(service.findOne('user-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// update
	// ──────────────────────────────────────────────────────────────────────────
	describe('update', () => {
		it('updates name and description and returns the formatted result', async () => {
			prisma.project.findUnique.mockResolvedValue(mockProject);
			prisma.project.update.mockResolvedValue({
				...mockProject,
				name: 'Updated Name',
				description: 'Updated Description',
			});

			await expect(
				service.update('user-1', 'project-1', { name: 'Updated Name', description: 'Updated Description' }),
			).resolves.toEqual({
				id: 'project-1',
				name: 'Updated Name',
				description: 'Updated Description',
				created_at: new Date('2026-07-23T00:00:00.000Z'),
			});
		});

		it('throws NotFoundException when the project does not exist', async () => {
			prisma.project.findUnique.mockResolvedValue(null);

			await expect(service.update('user-1', 'project-1', { name: 'New Name' })).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});

		it('throws NotFoundException when the project is soft deleted', async () => {
			prisma.project.findUnique.mockResolvedValue({ ...mockProject, deletedAt: new Date() });

			await expect(service.update('user-1', 'project-1', { name: 'New Name' })).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});

		it('throws ForbiddenException when the project belongs to a different user', async () => {
			prisma.project.findUnique.mockResolvedValue({ ...mockProject, userId: 'user-2' });

			await expect(service.update('user-1', 'project-1', { name: 'New Name' })).rejects.toBeInstanceOf(
				ForbiddenException,
			);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// remove
	// ──────────────────────────────────────────────────────────────────────────
	describe('remove', () => {
		it('soft deletes the project and all its tasks inside a transaction', async () => {
			prisma.project.findUnique.mockResolvedValue(mockProject);
			// $transaction resolves with [taskUpdateMany result, projectUpdate result]
			prisma.$transaction.mockResolvedValue([{ count: 2 }, { id: 'project-1' }]);

			await expect(service.remove('user-1', 'project-1')).resolves.toEqual({
				message: 'Project deleted successfully.',
			});

			expect(prisma.$transaction).toHaveBeenCalled();
		});

		it('throws NotFoundException when the project does not exist', async () => {
			prisma.project.findUnique.mockResolvedValue(null);

			await expect(service.remove('user-1', 'project-1')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws NotFoundException when the project is already soft deleted', async () => {
			prisma.project.findUnique.mockResolvedValue({ ...mockProject, deletedAt: new Date() });

			await expect(service.remove('user-1', 'project-1')).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws ForbiddenException when the project belongs to a different user', async () => {
			prisma.project.findUnique.mockResolvedValue({ ...mockProject, userId: 'user-2' });

			await expect(service.remove('user-1', 'project-1')).rejects.toBeInstanceOf(ForbiddenException);
		});
	});
});
