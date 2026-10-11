import { Module } from "@nestjs/common";
import { PenggunaModule } from "../pengguna/pengguna.module";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthController } from "./auth.controller";

@Module({
    imports: [
        PenggunaModule,
    ],
    providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard
    ],
    controllers: [
        AuthController
    ],
    exports: [
        AuthService,
        JwtAuthGuard
    ]
})
export class AuthModule {}