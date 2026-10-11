import { HttpException, Inject, Injectable, InternalServerErrorException, Logger, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import Keyv from "keyv";
import { PenggunaService } from "../pengguna/pengguna/pengguna.service";
import { JwtService } from "@nestjs/jwt";
import { KEYV_INSTACE } from "../common/keyv.provider";
import { PenggunaResponse } from "../pengguna/pengguna/pengguna.model";
import { v4 as uuidv4 } from "uuid";
import { ConfigService } from "@nestjs/config";
import { LoginResponse, PayloadDecoded } from "./auth.model";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger("AuthService")
    private blacklistCache!: Keyv;
    constructor(
        private penggunaService: PenggunaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @Inject(KEYV_INSTACE) private globalKeyv: Keyv
    ) {}

    onModuleInit() {
        this.blacklistCache = new Keyv({
            store: this.globalKeyv.opts.store,
            namespace: 'jwt-blacklist'
        })
    }

    async isBlacklisted(jti: string): Promise<boolean> {
        this.logger.debug(`checking blacklist status for jti: ${jti}`);
        const result = await this.blacklistCache.get(jti);
        return !!result;
    }

    async generateToken(user: PenggunaResponse): Promise<{
        accessToken: string,
        refreshToken: string
    }> {
        const accessPayload = {
            username: user.username,
            sub: user.id,
            role: user.role,
            pegawai: user.pegawai,
            jti: uuidv4(),
        };

        const refreshPayload = {
            sub: user.id,
            username: user.username,
            jti: uuidv4(),
            token_type: 'refresh',
        };

        const accessExpiresIn = this.configService.get<string>('JWT_EXPIRATION_TIME', '30m');
        const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME', '1d');

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                secret: this.configService.get<string>('JWT_SECRET_KEY'),
                expiresIn: (accessExpiresIn || '15m') as any
            }),
            this.jwtService.signAsync(refreshPayload, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET_KEY'),
                expiresIn: (refreshExpiresIn || '7d') as any
            })
        ]);

        return { accessToken, refreshToken }
    }

    async validate(
        data: { username: string, password: string }
    ): Promise<PenggunaResponse> {
        this.logger.debug(`get pengguna with username: ${data.username}`)
        const user = await this.penggunaService.checkUsername(data.username);
        if (!user) {
            this.logger.warn(`pengguna with username ${data.username} is not found`)
            throw new UnauthorizedException('username or password is invalid')
        }

        if (!user.status) {
            this.logger.warn(`pengguna with username ${data.username} is inactive`)
            throw new UnauthorizedException('User account is inactive')
        }
        
        const comparePass = await this.penggunaService.checkPassword(user, data.password);
        if (!comparePass) {
            this.logger.warn(`${user.username} password is incorrect`)
            throw new UnauthorizedException('username or password is invalid')
        }

        return this.penggunaService.toPenggunaResponse(user)
    }

    async login(
        user: PenggunaResponse
    ): Promise<LoginResponse> {
        this.logger.log(`starting sign user ${user.username}`)
        const token = await this.generateToken(user);
        const hashRT = await bcrypt.hash(token.refreshToken, 10);
        await this.penggunaService.updateRefreshToken(user.id, hashRT);
        
        return {
            data: user,
            token: token.accessToken,
            refresh_token: token.refreshToken
        }
    }

    async regenerateToken(
        incomingRefreshToken: string
    ): Promise<LoginResponse> {
        try {
            const payload = await this.jwtService.verifyAsync(incomingRefreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET_KEY')
            });
            
            const user = await this.penggunaService.checkUsername(payload.username);
            if (!user || !user.refresh_token) {
                this.logger.warn(`user with username: ${payload.username} or refresh token are null`)
                throw new UnauthorizedException('session expired')
            }

            if (!user.status) {
                this.logger.warn(`user with username: ${payload.username} is inactive`)
                throw new UnauthorizedException('User account is inactive')
            }

            const isMatch = await bcrypt.compare(incomingRefreshToken, user.refresh_token);
            if (!isMatch) {
                this.logger.warn('refresh token does not match');
                throw new UnauthorizedException('refresh token is invalid')
            }

            const userValidated = this.penggunaService.toPenggunaResponse(user);
            const token = await this.generateToken(userValidated);

            const newHashRT = await bcrypt.hash(token.refreshToken, 10);

            await this.penggunaService.updateRefreshToken(user.id, newHashRT);
            
            return {
                data: userValidated,
                token: token.accessToken,
                refresh_token: token.refreshToken
            }
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }
            this.logger.error(`Refresh token was expired or invalid: ${err.message}`)
            throw new UnauthorizedException('Session was expired or invalid')
        }
    }

    async logout(
        token: string,
    ): Promise<void> {
        try {
            const payload = await this.jwtService.verifyAsync<PayloadDecoded>(token, {
                secret: this.configService.get<string>('JWT_SECRET_KEY')
            });

            if (!payload || !payload.jti || !payload.exp) {
                this.logger.warn(`invalid token on logout attempt`)
                throw new UnauthorizedException('Invalid token payload')
            }

            await this.penggunaService.updateRefreshToken(payload.sub, null);

            const { jti, exp } = payload;
            
            const ttl = exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
                const ttlInMilisecond = ttl * 1000;
                this.logger.debug(`adding token JTI to deny list: ${jti} with TTL: ${ttl}s`);
                await this.blacklistCache.set(jti, 'denied', ttlInMilisecond);
            }
        } catch (err: any) {
            if (err instanceof HttpException) {
                throw err;
            }
            if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
                this.logger.warn(`Token verification failed on logout: ${err.message}`);
                throw new UnauthorizedException('Invalid or expired token');
            }
            this.logger.error(`Error during token invalidation: ${err.message}`, err.stack)
            throw new InternalServerErrorException('Terjadi kesalahan di server')
        }
    }
}