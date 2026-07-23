import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TaskPriority } from '../../common/enums/task-priority.enum';
import { SortOrder } from '../../common/enums/sort-order.enum';
import { TaskSortField } from '../../common/enums/task-sort-field.enum';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class TaskQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
	@IsOptional()
	@IsEnum(TaskStatus)
	status?: TaskStatus;

	@ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
	@IsOptional()
	@IsEnum(TaskPriority)
	priority?: TaskPriority;

	@ApiPropertyOptional({ example: '2026-08-01' })
	@IsOptional()
	@Type(() => Date)
	@IsDate()
	due_date_from?: Date;

	@ApiPropertyOptional({ example: '2026-08-31' })
	@IsOptional()
	@Type(() => Date)
	@IsDate()
	due_date_to?: Date;

	@ApiPropertyOptional({ enum: TaskSortField, example: TaskSortField.CREATED_AT, default: TaskSortField.CREATED_AT })
	@IsOptional()
	@IsEnum(TaskSortField)
	sort?: TaskSortField = TaskSortField.CREATED_AT;

	@ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC, default: SortOrder.DESC })
	@IsOptional()
	@IsEnum(SortOrder)
	order?: SortOrder = SortOrder.DESC;
}