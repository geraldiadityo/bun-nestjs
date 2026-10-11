import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./jwt-auth.guard";
import { RefreshPayload, RequestLogin } from "./auth.model";
import { ApiResponse } from "../utils/web.model";
import { PenggunaResponse } from "../pengguna/pengguna/pengguna.model";

@Controller('/api/auth')
export class AuthController {
    constructor (
        private service: AuthService
    ) {}

    @Public()
    @Post('/login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() request: RequestLogin,
    ): Promise<ApiResponse<PenggunaResponse>> {
        const user = await this.service.validate(request);
        const token = await this.service.login(user);

        return {
            data: token.data,
            message: 'login success',
            token: token.token,
            refresh_token: token.refresh_token
        }
    }

    @Public()
    @Post('/refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() request: RefreshPayload
    ): Promise<ApiResponse<PenggunaResponse>> {
        if (!request.refresh_token) {
            throw new UnauthorizedException('token is required')
        }

        const result = await this.service.regenerateToken(request.refresh_token);

        return {
            data: result.data,
            token: result.token,
            refresh_token: result.refresh_token
        }
    }

    @Post('/logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Headers('authorization') authHeader?: string
    ): Promise<ApiResponse<boolean>> {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token is required for logout')
        }

        const token = authHeader.substring(7);
        await this.service.logout(token);

        return {
            data: true,
            message: 'logout successfully'
        }
    }
}