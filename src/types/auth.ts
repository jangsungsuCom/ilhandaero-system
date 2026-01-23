export type LoginMethod = "email" | "accessCode";

export interface EmailLoginRequest {
    email: string;
    password: string;
}

export interface AccessCodeLoginRequest {
    accessCode: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken?: string;
    user?: {
        id: string;
        email: string;
        name?: string;
    };
}

export interface EmailLoginResponse {
    status: number;
    message: string;
    data: {
        accessToken: string;
        provider: "LOCAL" | "GOOGLE";
        userStatus: "INIT" | "INFO_REGISTERED";
    };
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    birthDate: string;
    phone: string;
    address1: string;
    address2?: string;
}

export interface RegisterResponse {
    status: number;
    message: string;
    data: any;
}
