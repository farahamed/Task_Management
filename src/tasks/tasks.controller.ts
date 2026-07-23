import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskResponseDto } from './dto/create-task-response.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TasksPaginationResponseDto } from './dto/tasks-pagination.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@Post('projects/:projectId/tasks')
	@ApiOperation({ summary: 'Create task', description: 'Creates a task inside an owned project.' })
	@ApiParam({ name: 'projectId', example: 'uuid' })
	@ApiBody({ type: CreateTaskDto })
	@ApiCreatedResponse({ type: CreateTaskResponseDto, description: 'Task created successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiNotFoundResponse({ description: 'Project not found.' })
	@ApiForbiddenResponse({ description: 'Project belongs to another user.' })
	create(@CurrentUser('sub') userId: string, @Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
		return this.tasksService.create(userId, projectId, dto);
	}

	@Get('projects/:projectId/tasks')
	@ApiOperation({ summary: 'Get project tasks', description: 'Returns tasks that belong to the project and are not soft deleted.' })
	@ApiParam({ name: 'projectId', example: 'uuid' })
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'limit', required: false, example: 10 })
	@ApiQuery({ name: 'status', required: false, example: 'todo' })
	@ApiQuery({ name: 'priority', required: false, example: 'high' })
	@ApiQuery({ name: 'due_date_from', required: false, example: '2026-08-01' })
	@ApiQuery({ name: 'due_date_to', required: false, example: '2026-08-31' })
	@ApiQuery({ name: 'sort', required: false, example: 'due_date' })
	@ApiQuery({ name: 'order', required: false, example: 'asc' })
	@ApiOkResponse({ type: TasksPaginationResponseDto, description: 'Tasks retrieved successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiNotFoundResponse({ description: 'Project not found.' })
	@ApiForbiddenResponse({ description: 'Project belongs to another user.' })
	getProjectTasks(@CurrentUser('sub') userId: string, @Param('projectId') projectId: string, @Query() query: TaskQueryDto) {
		return this.tasksService.findByProject(userId, projectId, query);
	}

	@Get('tasks/:id')
	@ApiOperation({ summary: 'Get task', description: 'Returns a single task owned by the authenticated user.' })
	@ApiParam({ name: 'id', example: 'uuid' })
	@ApiOkResponse({ type: TaskResponseDto, description: 'Task retrieved successfully.' })
	@ApiBadRequestResponse({ description: 'Validation failed.' })
	@ApiNotFoundResponse({ description: 'Task not found.' })
	@ApiForbiddenResponse({ description: 'Task belongs to another user.' })
	getTask(@CurrentUser('sub') userId: string, @Param('id') id: string) {
		return this.tasksService.findOne(userId, id);
	}
}