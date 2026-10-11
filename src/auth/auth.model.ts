import { PegawaiResponse } from "../pengguna/pegawai/pegawai.model";
import { PenggunaResponse } from "../pengguna/pengguna/pengguna.model";
import { RoleResponse } from "../pengguna/role/role.model";

export class RequestLogin {
    username: string;
    password: string;
}

export class LoginResponse {
    data: PenggunaResponse;
    token: string;
    refresh_token: string;
}

export class PayloadDecoded {
    username: string;
    sub: number;
    role: RoleResponse;
    pegawai: PegawaiResponse;
    jti: string;
    iat: number;
    exp: number;
}

export class RefreshPayload {
    refresh_token: string
}