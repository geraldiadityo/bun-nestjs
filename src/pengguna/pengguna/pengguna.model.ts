import { PegawaiResponse } from "../pegawai/pegawai.model";
import { RoleResponse } from "../role/role.model";

export class PenggunaRequestDTO {
    username: string;
    pegawaiId: number;
    roleId: number;
    password: string;
    confirm_password: string;
}

export class PenggunaCreateDTO {
    username: string;
    pegawaiId: number;
    roleId: number;
    password: string;
}

export class PenggunaUpdateRequest {
    username: string;
    pegawaiId: number;
    roleId: number;
    old_password?: string;
    new_password?: string;
    confirm_password?: string;
}

export class PenggunaResponse {
    id: number;
    username: string;
    pegawai: PegawaiResponse;
    role: RoleResponse;
    status: boolean
}