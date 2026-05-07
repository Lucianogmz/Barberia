"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScheduleDto = exports.ScheduleDayDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ScheduleDayDto {
    dayOfWeek;
    startTime;
    endTime;
    isActive;
}
exports.ScheduleDayDto = ScheduleDayDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], ScheduleDayDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'startTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], ScheduleDayDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: 'endTime must be in HH:mm format',
    }),
    __metadata("design:type", String)
], ScheduleDayDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ScheduleDayDto.prototype, "isActive", void 0);
class UpdateScheduleDto {
    schedule;
}
exports.UpdateScheduleDto = UpdateScheduleDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScheduleDayDto),
    __metadata("design:type", Array)
], UpdateScheduleDto.prototype, "schedule", void 0);
//# sourceMappingURL=update-schedule.dto.js.map