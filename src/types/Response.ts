import type { User } from "./Model";

export interface LoginResponse {
    token: string;
    user: User;
}

export interface SignUpResponse {
    token: string;
    user: User;
}