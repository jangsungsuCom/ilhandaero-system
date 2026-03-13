/** GET /users/me 응답 (내 정보 조회) */
export interface MyInfoResponse {
    userId: number;
    email: string;
    provider: "LOCAL" | "GOOGLE";
    role: "USER" | "ADMIN";
    status: "INIT" | "INFO_REGISTERED";
    active: boolean;
    name?: string;
    birthDate?: string;
    phone?: string;
    address1?: string;
    address2?: string;
}

/** PATCH /users/me 요청 (내 정보 수정) */
export interface MyInfoUpdateRequest {
    name?: string;
    birthDate?: string;
    phone?: string;
    address1?: string;
    address2?: string;
}
