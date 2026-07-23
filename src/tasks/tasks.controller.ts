import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskResponseDto } from './dto/create-task-response.dto';
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
}