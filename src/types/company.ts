export interface Company {
    companyId: number;
    name: string;
}

export interface CompanyResponse {
    status: number;
    message: string;
    data: Company[];
}
