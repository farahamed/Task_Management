import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { IsTodayOrFutureDate } from '../../common/validators/future-date.validator';

export enum CreateTaskStatus {
	TODO = 'todo',
	IN_PROGRESS = 'in_progress',
	DONE = 'done',
}

export enum CreateTaskPriority {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

export class CreateTaskDto {
	@ApiProperty({ example: 'Implement JWT' })
	@IsString()
	@Length(1, 200)
	title!: string;

	@ApiPropertyOptional({ example: 'Use Passport JWT' })
	@IsOptional()
	@IsString()
	@Length(0, 2000)
	description?: string;

    @ApiPropertyOptional({ enum: CreateTaskPriority, default: CreateTaskPriority.MEDIUM })
    @IsOptional()
    @IsEnum(CreateTaskPriority)
    priority?: CreateTaskPriority;
    @ApiPropertyOptional({ enum: CreateTaskStatus, default: CreateTaskStatus.TODO })
    @IsOptional()
    @IsEnum(CreateTaskStatus)
    status?: CreateTaskStatus;

	@ApiPropertyOptional({ example: '2026-08-01' })
	@IsOptional()
	@Type(() => Date)
	@IsDate()
	@IsTodayOrFutureDate({ message: 'due_date must be today or in the future' })
	due_date?: Date;
}