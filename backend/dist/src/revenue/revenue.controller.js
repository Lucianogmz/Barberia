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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueController = void 0;
const common_1 = require("@nestjs/common");
const revenue_service_1 = require("./revenue.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RevenueController = class RevenueController {
    revenueService;
    constructor(revenueService) {
        this.revenueService = revenueService;
    }
    async getDashboardSummary(req) {
        return this.revenueService.getDashboardSummary(req.user.id);
    }
    async getMonthlyRevenue(req, year, month) {
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || new Date().getMonth() + 1;
        return this.revenueService.getMonthlyRevenue(req.user.id, y, m);
    }
    async getServiceBreakdown(req, year, month) {
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || new Date().getMonth() + 1;
        return this.revenueService.getServiceBreakdown(req.user.id, y, m);
    }
};
exports.RevenueController = RevenueController;
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('monthly'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getMonthlyRevenue", null);
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RevenueController.prototype, "getServiceBreakdown", null);
exports.RevenueController = RevenueController = __decorate([
    (0, common_1.Controller)('revenue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [revenue_service_1.RevenueService])
], RevenueController);
//# sourceMappingURL=revenue.controller.js.map