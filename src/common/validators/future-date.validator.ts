import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsTodayOrFutureDate(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string): void {
		registerDecorator({
			name: 'IsTodayOrFutureDate',
			target: object.constructor,
			propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown): boolean {
					if (value === null || value === undefined || value === '') {
						return true;
					}

					const date = value instanceof Date ? value : new Date(String(value));
					if (Number.isNaN(date.getTime())) {
						return false;
					}

					const startOfToday = new Date();
					startOfToday.setHours(0, 0, 0, 0);
					return date.getTime() >= startOfToday.getTime();
				},
				defaultMessage(args: ValidationArguments): string {
					return `${args.property} must be today or in the future`;
				},
			},
		});
	};
}