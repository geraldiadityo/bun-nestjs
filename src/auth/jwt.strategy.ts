import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { PayloadDecoded } from "./auth.model";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger("JwtStrategy");

    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        const secret = configService.get<string>('JWT_SECRET_KEY');
        if (!secret) {
            throw new Error('JWT_SECRET_KEY is not defined in environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: PayloadDecoded): Promise<PayloadDecoded> {
        this.logger.debug(`validating jwt payload for user: ${payload.username}`);

        if (payload.jti) {
            const isBlacklisted = await this.authService.isBlacklisted(payload.jti);
            if (isBlacklisted) {
                this.logger.warn(`token with jti ${payload.jti} has been revoked (blacklisted)`);
                throw new UnauthorizedException('Token has been revoked');
            }
        }

        return payload;
    }
}

